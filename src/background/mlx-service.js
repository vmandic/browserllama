(function(global) {
    const mlxService = {
        /**
         * Fetch MLX models through OpenAI-compatible endpoint.
         * @param {Function} getMlxServerAddress
         * @param {string|null} serverOverride
         * @returns {Promise<{isRunning: boolean, models: string[], error: string|null}>}
         */
        async fetchMlxModels(getMlxServerAddress, serverOverride = null) {
            const server = serverOverride || await getMlxServerAddress();
            try {
                const response = await fetch(`${server}/models`, {
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
                return {
                    isRunning: false,
                    models: [],
                    error: error.message || "Failed to connect to MLX server",
                };
            }
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
            const response = await fetch(`${server}/chat/completions`, {
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
                throw new Error(`HTTP ${response.status}: ${response.statusText}${details}`);
            }

            const data = await response.json();
            const firstChoice = Array.isArray(data && data.choices) ? data.choices[0] : null;
            const messageContent = firstChoice && firstChoice.message ? firstChoice.message.content : "";
            const textContent = String(messageContent || "").trim();
            if (!textContent) {
                throw new Error("MLX response did not include choices[0].message.content.");
            }
            return { response: textContent };
        },
    };

    global.BrowserllamaMlxService = mlxService;
})(self);
