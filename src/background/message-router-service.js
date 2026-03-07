(function(global) {
    const messageRouterService = {
        /**
         * Register runtime message actions.
         * @param {object} deps
         */
        initMessageRouter(deps) {
            const {
                fetchOllamaTags,
                fetchMlxModels,
                generateWithOllama,
                generateWithMlx,
                getPageTextFromActiveTab,
                refreshExtensionStatusIcon,
            } = deps;

            chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                if (request.action === "getOllamaStatus") {
                    fetchOllamaTags(request.server)
                        .then((result) => sendResponse({ isRunning: result.isRunning === true }))
                        .catch((error) => sendResponse({ isRunning: false, error: error.message || "Failed to query Ollama status" }));
                    return true;
                }

                if (request.action === "getOllamaModels") {
                    fetchOllamaTags(request.server)
                        .then((result) => sendResponse(result))
                        .catch((error) => {
                            sendResponse({
                                isRunning: false,
                                models: [],
                                error: error.message || "Failed to query Ollama models",
                            });
                        });
                    return true;
                }

                if (request.action === "getMlxModels") {
                    Promise.resolve()
                        .then(() => fetchMlxModels(request.server))
                        .then((result) => sendResponse(result))
                        .catch((error) => {
                            sendResponse({
                                isRunning: false,
                                models: [],
                                error: error.message || "Failed to query MLX models",
                            });
                        });
                    return true;
                }

                if (request.action === "getActivePageText") {
                    getPageTextFromActiveTab()
                        .then((data) => sendResponse({ success: true, data }))
                        .catch((error) => {
                            console.error("Failed to read page text:", error);
                            sendResponse({ success: false, error: error.message || "Failed to read page text" });
                        });
                    return true;
                }

                if (request.action === "generateResponse") {
                    generateWithOllama(request.model, request.prompt, request.options || { temperature: 0 })
                        .then((data) => sendResponse({ success: true, data }))
                        .catch((error) => {
                            console.error("Error:", error);
                            sendResponse({
                                success: false,
                                error: error.message || "Failed to get response from Ollama",
                            });
                        });
                    return true;
                }

                if (request.action === "generateMlxResponse") {
                    Promise.resolve()
                        .then(() => generateWithMlx(request.model, request.prompt))
                        .then((data) => sendResponse({ success: true, data }))
                        .catch((error) => {
                            console.error("Error:", error);
                            sendResponse({
                                success: false,
                                error: error.message || "Failed to get response from MLX",
                            });
                        });
                    return true;
                }

                if (request.action === "refreshStatusIcon") {
                    refreshExtensionStatusIcon()
                        .then(() => sendResponse({ success: true }))
                        .catch((error) => sendResponse({ success: false, error: error.message || "Refresh failed" }));
                    return true;
                }

                return false;
            });
        },
    };

    global.BrowserllamaMessageRouterService = messageRouterService;
})(self);
