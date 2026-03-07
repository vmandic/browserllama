/**
 * Query available MLX models (OpenAI-compatible /models) via background worker.
 * @param {string|null} server
 * @returns {Promise<{isRunning: boolean, models: string[], error: string}>}
 */
export async function getMlxModels(server = null) {
    const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: "getMlxModels", server }, function(modelsResponse) {
            if (chrome.runtime.lastError) {
                resolve({
                    isRunning: false,
                    models: [],
                    error: chrome.runtime.lastError.message || "Background process did not respond",
                });
                return;
            }
            resolve(modelsResponse);
        });
    });

    if (!response) {
        return { isRunning: false, models: [], error: "No response from background process" };
    }

    return {
        isRunning: response.isRunning === true,
        models: Array.isArray(response.models) ? response.models : [],
        error: response.error || "",
    };
}

/**
 * Request non-streaming generation from MLX via background worker.
 * @param {string} model
 * @param {string} prompt
 * @returns {Promise<any>}
 */
export async function generateWithMlx(model, prompt) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({
            action: "generateMlxResponse",
            model,
            prompt,
        }, function(messageResponse) {
            if (chrome.runtime.lastError) {
                resolve({
                    success: false,
                    error: chrome.runtime.lastError.message || "Background process did not respond",
                });
                return;
            }
            resolve(messageResponse);
        });
    });
}
