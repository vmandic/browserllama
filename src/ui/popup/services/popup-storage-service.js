/**
 * Read preferred provider key.
 * @returns {Promise<string>}
 */
export async function getPreferredProvider() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(["preferredProvider"], (result) => {
            resolve(result.preferredProvider || "ollama");
        });
    });
}

/**
 * Persist preferred provider key.
 * @param {string} provider
 */
export function setPreferredProvider(provider) {
    chrome.storage.sync.set({ preferredProvider: provider });
}

/**
 * Read preferred model key.
 * @returns {Promise<string>}
 */
export async function getPreferredModel() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(["preferredModel"], (result) => {
            resolve(result.preferredModel || "");
        });
    });
}

/**
 * Persist preferred model key.
 * @param {string} model
 */
export function setPreferredModel(model) {
    chrome.storage.sync.set({ preferredModel: model });
}

/**
 * Read configured MLX server URL.
 * @returns {Promise<string>}
 */
export async function getMlxServer() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(["mlxServer"], (result) => {
            resolve(result.mlxServer || Browserllama.getDefaultMlxServer());
        });
    });
}

/**
 * Persist MLX server URL.
 * @param {string} server
 */
export function setMlxServer(server) {
    chrome.storage.sync.set({ mlxServer: server });
}

/**
 * Read temporary selected text payload.
 * @returns {Promise<string>}
 */
export async function getTempSelectedText() {
    return new Promise((resolve) => {
        chrome.storage.local.get(["tempSelectedText"], (result) => {
            resolve(result.tempSelectedText || "");
        });
    });
}

/**
 * Remove temporary selected text payload.
 * @returns {Promise<void>}
 */
export async function clearTempSelectedText() {
    return new Promise((resolve) => {
        chrome.storage.local.remove("tempSelectedText", () => resolve());
    });
}
