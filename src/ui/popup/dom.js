/**
 * Resolve and return required popup DOM nodes.
 * @returns {object}
 */
export function getPopupDom() {
    const statusDiv = document.getElementById("status");
    const statusText = document.getElementById("statusText");
    const composeWrap = document.getElementById("composeWrap");
    const providerSelect = document.getElementById("providerSelect");
    const mlxServerInput = document.getElementById("mlxServerInput");
    const mlxEndpointField = document.getElementById("mlxEndpointField");
    const modelSelect = document.getElementById("modelSelect");
    const modelField = modelSelect ? modelSelect.closest(".field") : null;
    const newPromptButton = document.getElementById("newPromptButton");
    const lastPromptDiv = document.getElementById("lastPrompt");
    const responseWrap = document.getElementById("responseWrap");
    const userInput = document.getElementById("userInput");
    const sendButton = document.getElementById("sendButton");
    const responseDiv = document.getElementById("response");

    const missing = [
        statusDiv,
        statusText,
        composeWrap,
        providerSelect,
        mlxServerInput,
        mlxEndpointField,
        modelSelect,
        modelField,
        newPromptButton,
        lastPromptDiv,
        responseWrap,
        userInput,
        sendButton,
        responseDiv,
    ].some((node) => !node);

    if (missing) {
        throw new Error("Popup UI elements are missing.");
    }

    return {
        statusDiv,
        statusText,
        composeWrap,
        providerSelect,
        mlxServerInput,
        mlxEndpointField,
        modelSelect,
        modelField,
        newPromptButton,
        lastPromptDiv,
        responseWrap,
        userInput,
        sendButton,
        responseDiv,
    };
}
