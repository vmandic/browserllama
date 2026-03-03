importScripts(
    "lib/ollama.js",
    "background/storage-service.js",
    "background/ollama-service.js",
    "background/icon-status-service.js",
    "background/tab-context-service.js",
    "background/message-router-service.js"
);

/**
 * Fetch Ollama tags through storage + API services.
 * @param {string|null} serverOverride
 * @returns {Promise<{isRunning: boolean, models: string[], error: string|null}>}
 */
async function fetchOllamaTags(serverOverride = null) {
    return BrowserllamaOllamaService.fetchOllamaTags(
        BrowserllamaStorageService.getServerAddress,
        serverOverride
    );
}

/**
 * Send generate request to Ollama through service layer.
 * @param {string} model
 * @param {string} prompt
 * @param {object} options
 * @returns {Promise<object>}
 */
async function generateWithOllama(model, prompt, options) {
    return BrowserllamaOllamaService.generateWithOllama(
        BrowserllamaStorageService.getServerAddress,
        model,
        prompt,
        options
    );
}

/**
 * Refresh action icon/title from provider availability.
 * @returns {Promise<void>}
 */
async function refreshExtensionStatusIcon() {
    return BrowserllamaIconStatusService.refreshExtensionStatusIcon(
        BrowserllamaStorageService.getPreferredProvider,
        fetchOllamaTags
    );
}

chrome.runtime.onInstalled.addListener(() => {
    console.log("Browserllama Extension Installed!");
    refreshExtensionStatusIcon().catch(console.error);

    chrome.contextMenus.create({
        id: "sendToBrowserllama",
        title: "Send to Browserllama",
        contexts: ["selection"],
    });
});

BrowserllamaTabContextService.initSelectionTracking();

setInterval(() => {
    refreshExtensionStatusIcon().catch(console.error);
}, 10000);

BrowserllamaMessageRouterService.initMessageRouter({
    fetchOllamaTags,
    generateWithOllama,
    getPageTextFromActiveTab: BrowserllamaTabContextService.getPageTextFromActiveTab,
    refreshExtensionStatusIcon,
});
