/**
 * Render response text output.
 * @param {HTMLElement} responseDiv
 * @param {string} text
 * @param {boolean} isPlaceholder
 */
export function setResponse(responseDiv, text, isPlaceholder = false) {
    responseDiv.textContent = text;
    responseDiv.classList.toggle("is-placeholder", isPlaceholder);
    responseDiv.scrollTop = 0;
}

/**
 * Render submitted prompt context.
 * @param {HTMLElement} promptDiv
 * @param {string} text
 * @param {boolean} isPlaceholder
 */
export function setPromptContext(promptDiv, text, isPlaceholder = false) {
    promptDiv.textContent = text;
    promptDiv.classList.toggle("is-placeholder", isPlaceholder);
    promptDiv.scrollTop = 0;
}
