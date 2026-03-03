/**
 * Create initial mutable popup state.
 * @returns {object}
 */
export function createPopupState() {
    return {
        selectedProvider: "ollama",
        activeRequest: null,
        pendingPromptText: "",
        isSending: false,
        ollamaReady: false,
        chromeBuiltInReady: false,
        providerStateRequestId: 0,
    };
}
