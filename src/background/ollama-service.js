(function(global) {
    const ollamaService = {
        /**
         * Fetch Ollama tags and normalize model names.
         * @param {Function} getServerAddress
         * @param {string|null} serverOverride
         * @returns {Promise<{isRunning: boolean, models: string[], error: string|null}>}
         */
        async fetchOllamaTags(getServerAddress, serverOverride = null) {
            const server = serverOverride || await getServerAddress();
            try {
                const response = await fetch(`${server}/api/tags`, {
                    method: "GET",
                    mode: "cors",
                });

                if (!response.ok) {
                    return {
                        isRunning: false,
                        models: [],
                        error: `HTTP ${response.status}: ${response.statusText}`,
                    };
                }

                const data = await response.json();
                return {
                    isRunning: true,
                    models: Browserllama.extractModelNames(data),
                    error: null,
                };
            } catch (error) {
                console.log("Ollama not running:", error);
                return {
                    isRunning: false,
                    models: [],
                    error: error.message || "Failed to connect to Ollama",
                };
            }
        },

        /**
         * Generate non-streaming response via Ollama.
         * @param {Function} getServerAddress
         * @param {string} model
         * @param {string} prompt
         * @param {object} options
         * @returns {Promise<object>}
         */
        async generateWithOllama(getServerAddress, model, prompt, options = { temperature: 0 }) {
            const server = await getServerAddress();
            const res = await fetch(`${server}/api/generate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(
                    Browserllama.buildGeneratePayload({
                        model,
                        prompt,
                        stream: false,
                        options,
                    })
                ),
            });

            if (!res.ok) {
                let responseText = "";
                try {
                    responseText = (await res.text()).trim();
                } catch (error) {
                    responseText = "";
                }

                if (res.status === 403) {
                    const guidance = "Ollama denied this request (HTTP 403). Allow this extension origin in Ollama, for example: OLLAMA_ORIGINS=\"chrome-extension://*\".";
                    if (responseText) {
                        throw new Error(`${guidance} Details: ${responseText}`);
                    }
                    throw new Error(guidance);
                }

                const details = responseText ? `: ${responseText}` : "";
                throw new Error(`HTTP ${res.status}: ${res.statusText}${details}`);
            }

            return res.json();
        },
    };

    global.BrowserllamaOllamaService = ollamaService;
})(self);
