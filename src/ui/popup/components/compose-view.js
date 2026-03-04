/**
 * Render model dropdown options.
 * @param {HTMLSelectElement} modelSelect
 * @param {string[]} models
 */
export function setModelOptions(modelSelect, models) {
    modelSelect.innerHTML = "";
    if (!Array.isArray(models) || models.length === 0) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "No models available";
        modelSelect.appendChild(option);
        modelSelect.value = "";
        return;
    }
    models.forEach((modelName) => {
        const option = document.createElement("option");
        option.value = modelName;
        option.textContent = modelName;
        modelSelect.appendChild(option);
    });
}

/**
 * Render send/input disabled state.
 * @param {HTMLButtonElement} sendButton
 * @param {HTMLTextAreaElement} userInput
 * @param {HTMLSelectElement} providerSelect
 * @param {HTMLSelectElement} modelSelect
 * @param {boolean} isSending
 */
export function setSendingState(sendButton, userInput, providerSelect, modelSelect, isSending) {
    sendButton.disabled = isSending;
    sendButton.textContent = "Send";
    userInput.disabled = isSending;
    providerSelect.disabled = isSending;
    modelSelect.disabled = isSending;
}

/**
 * Toggle compose/results mode.
 * @param {HTMLElement} composeWrap
 * @param {HTMLButtonElement} newPromptButton
 * @param {boolean} isComposeMode
 * @param {boolean} showNewPromptButton
 */
export function setComposeMode(composeWrap, newPromptButton, isComposeMode, showNewPromptButton = !isComposeMode) {
    composeWrap.classList.toggle("is-hidden", !isComposeMode);
    newPromptButton.classList.toggle("is-hidden", !showNewPromptButton);
}

/**
 * Toggle response panel visibility.
 * @param {HTMLElement} responseWrap
 * @param {boolean} isVisible
 */
export function setResultsVisibility(responseWrap, isVisible) {
    responseWrap.classList.toggle("is-hidden", !isVisible);
}

/**
 * Toggle model field visibility per provider.
 * @param {HTMLElement} modelField
 * @param {string} provider
 */
export function setModelVisibility(modelField, provider) {
    const requiresModelSelection = provider === "ollama" || provider === "mlx";
    modelField.classList.toggle("is-hidden", !requiresModelSelection);
}

/**
 * Render new prompt button caption.
 * @param {HTMLButtonElement} newPromptButton
 * @param {boolean} isCancelMode
 */
export function setNewPromptButtonState(newPromptButton, isCancelMode) {
    newPromptButton.textContent = isCancelMode ? "Cancel" : "New prompt";
}
