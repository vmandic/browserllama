(function(global) {
    const REQUEST_TIMEOUT_MS = 8000;

    /**
     * Normalize MLX server base URL.
     * @param {string} server
     * @returns {string}
     */
    function normalizeMlxServer(server) {
        const trimmed = String(server || "").trim();
        const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
        return withProtocol.replace(/\/+$/, "");
    }

    /**
     * Build candidate MLX base URLs to handle common localhost/path mismatches.
     * @param {string} server
     * @returns {string[]}
     */
    function buildMlxServerCandidates(server) {
        const normalized = normalizeMlxServer(server);
        const candidates = [];
        const seen = new Set();

        function addCandidate(value) {
            if (!value || seen.has(value)) {
                return;
            }
            seen.add(value);
            candidates.push(value);
        }

        addCandidate(normalized);
        try {
            const parsed = new URL(normalized);
            const hasV1Path = parsed.pathname === "/v1" || parsed.pathname.startsWith("/v1/");
            const hasRootPath = parsed.pathname === "/" || parsed.pathname === "";
            const portSuffix = parsed.port ? `:${parsed.port}` : "";

            function baseForHost(hostname) {
                return `${parsed.protocol}//${hostname}${portSuffix}`;
            }

            function pathForHost(hostname, pathname) {
                return `${baseForHost(hostname)}${pathname || ""}`.replace(/\/+$/, "");
            }

            if (parsed.hostname === "localhost") {
                addCandidate(pathForHost("127.0.0.1", parsed.pathname));
            } else if (parsed.hostname === "127.0.0.1") {
                addCandidate(pathForHost("localhost", parsed.pathname));
            }

            if (hasRootPath) {
                addCandidate(`${normalized}/v1`);
                if (parsed.hostname === "localhost") {
                    addCandidate(`${baseForHost("127.0.0.1")}/v1`);
                } else if (parsed.hostname === "127.0.0.1") {
                    addCandidate(`${baseForHost("localhost")}/v1`);
                }
            } else if (hasV1Path) {
                const rootBase = baseForHost(parsed.hostname);
                addCandidate(rootBase);
                if (parsed.hostname === "localhost") {
                    addCandidate(baseForHost("127.0.0.1"));
                } else if (parsed.hostname === "127.0.0.1") {
                    addCandidate(baseForHost("localhost"));
                }
            }
        } catch (error) {
            addCandidate(normalized);
        }

        return candidates;
    }

    /**
     * Fetch with request timeout to avoid dangling message ports in MV3.
     * @param {string} url
     * @param {object} options
     * @returns {Promise<Response>}
     */
    async function fetchWithTimeout(url, options) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        try {
            return await fetch(url, { ...options, signal: controller.signal });
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * Normalize fetch error message for user-facing status text.
     * @param {any} error
     * @returns {string}
     */
    function toMlxErrorMessage(error) {
        if (error && error.name === "AbortError") {
            return `Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`;
        }
        return (error && error.message) || "Failed to connect to MLX server";
    }

    const mlxService = {
        /**
         * Fetch MLX models through OpenAI-compatible endpoint.
         * @param {Function} getMlxServerAddress
         * @param {string|null} serverOverride
         * @returns {Promise<{isRunning: boolean, models: string[], error: string|null}>}
         */
        async fetchMlxModels(getMlxServerAddress, serverOverride = null) {
            const server = serverOverride || await getMlxServerAddress();
            const candidateServers = buildMlxServerCandidates(server);
            let lastError = "Failed to connect to MLX server";

            for (const candidateServer of candidateServers) {
                try {
                    const response = await fetchWithTimeout(`${candidateServer}/models`, {
                        method: "GET",
                        mode: "cors",
                    });

                    if (!response.ok) {
                        lastError = `HTTP ${response.status}: ${response.statusText}`;
                        continue;
                    }

                    const data = await response.json();
                    const modelItems = Array.isArray(data && data.data) ? data.data : [];
                    const modelIds = modelItems
                        .map((item) => String((item && item.id) || "").trim())
                        .filter(Boolean);
                    return {
                        isRunning: true,
                        models: modelIds,
                        error: null,
                    };
                } catch (error) {
                    lastError = toMlxErrorMessage(error);
                }
            }

            return {
                isRunning: false,
                models: [],
                error: lastError,
            };
        },

        /**
         * Generate non-streaming response via MLX OpenAI-compatible endpoint.
         * @param {Function} getMlxServerAddress
         * @param {string} model
         * @param {string} prompt
         * @returns {Promise<{response: string}>}
         */
        async generateWithMlx(getMlxServerAddress, model, prompt) {
            const server = await getMlxServerAddress();
            const payload = {
                model,
                messages: [
                    { role: "user", content: prompt },
                ],
                stream: false,
            };
            const candidateServers = buildMlxServerCandidates(server);
            let lastError = "Failed to connect to MLX server";

            for (const candidateServer of candidateServers) {
                try {
                    const response = await fetchWithTimeout(`${candidateServer}/chat/completions`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(payload),
                    });

                    if (!response.ok) {
                        let responseText = "";
                        try {
                            responseText = (await response.text()).trim();
                        } catch (error) {
                            responseText = "";
                        }
                        const details = responseText ? `: ${responseText}` : "";
                        lastError = `HTTP ${response.status}: ${response.statusText}${details}`;
                        continue;
                    }

                    const data = await response.json();
                    const firstChoice = Array.isArray(data && data.choices) ? data.choices[0] : null;
                    const messageContent = firstChoice && firstChoice.message ? firstChoice.message.content : "";
                    const textContent = String(messageContent || "").trim();
                    if (!textContent) {
                        throw new Error("MLX response did not include choices[0].message.content.");
                    }
                    return { response: textContent };
                } catch (error) {
                    lastError = toMlxErrorMessage(error);
                }
            }

            throw new Error(lastError);
        },
    };

    global.BrowserllamaMlxService = mlxService;
})(self);
