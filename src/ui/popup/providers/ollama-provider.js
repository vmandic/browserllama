/**
 * Query available Ollama models via background worker.
 * @param {string|null} server
 * @returns {Promise<{isRunning: boolean, models: string[], error: string}>}
 */
export async function getOllamaModels(server = null) {
    const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: "getOllamaModels", server }, function(modelsResponse) {
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
 * Request non-streaming generation from Ollama via background worker.
 * @param {string} model
 * @param {string} prompt
 * @returns {Promise<any>}
 */
export async function generateWithOllama(model, prompt) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({
            action: "generateResponse",
            model,
            prompt,
            options: { temperature: 0 },
        }, function(messageResponse) {
            resolve(messageResponse);
        });
    });
}
