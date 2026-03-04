/**
 * Render Ollama connectivity status.
 * @param {HTMLElement} statusDiv
 * @param {HTMLElement} statusText
 * @param {boolean} isRunning
 * @param {string} detailText
 */
export function setStatus(statusDiv, statusText, isRunning, detailText = "") {
    statusDiv.classList.remove("is-online", "is-offline");
    if (isRunning === true) {
        statusDiv.classList.add("is-online");
        statusText.textContent = detailText || "Connected to Ollama";
        return;
    }
    statusDiv.classList.add("is-offline");
    statusText.textContent = detailText || "Ollama is not reachable";
}

/**
 * Render Chrome built-in provider status.
 * @param {HTMLElement} statusDiv
 * @param {HTMLElement} statusText
 * @param {boolean} isReady
 * @param {string} detailText
 */
export function setChromeBuiltInStatus(statusDiv, statusText, isReady, detailText = "") {
    statusDiv.classList.remove("is-online", "is-offline");
    if (isReady === true) {
        statusDiv.classList.add("is-online");
        statusText.textContent = detailText || "Chrome built-in AI is ready";
        return;
    }
    statusDiv.classList.add("is-offline");
    statusText.textContent = detailText || "Chrome built-in AI is unavailable";
}

/**
 * Render MLX provider status.
 * @param {HTMLElement} statusDiv
 * @param {HTMLElement} statusText
 * @param {boolean} isReady
 * @param {string} detailText
 */
export function setMlxStatus(statusDiv, statusText, isReady, detailText = "") {
    statusDiv.classList.remove("is-online", "is-offline");
    if (isReady === true) {
        statusDiv.classList.add("is-online");
        statusText.textContent = detailText || "MLX server is reachable";
        return;
    }
    statusDiv.classList.add("is-offline");
    statusText.textContent = detailText || "MLX server is not reachable";
}
