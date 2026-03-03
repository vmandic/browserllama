/**
 * Wait helper for retry loops.
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Trim captured page text before prompt assembly.
 * @param {string} text
 * @param {number} maxChars
 * @returns {string}
 */
export function trimPageContext(text, maxChars = 6000) {
    const normalized = String(text || "").trim();
    if (normalized.length <= maxChars) {
        return normalized;
    }
    return `${normalized.slice(0, maxChars)}\n...[truncated for brevity]`;
}

/**
 * Fetch active page text with short retries to avoid empty early capture.
 * @param {number} maxAttempts
 * @returns {Promise<{text: string, paragraphs: string[]}>}
 */
export async function getActivePageDataWithRetry(maxAttempts = 3) {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const pageData = await new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: "getActivePageText" }, function(response) {
                if (response && response.success) {
                    resolve(response.data || { text: "", paragraphs: [] });
                    return;
                }
                resolve({ text: "", paragraphs: [] });
            });
        });

        const text = pageData.text || "";
        const paragraphs = Array.isArray(pageData.paragraphs) ? pageData.paragraphs : [];
        if (text.trim() || paragraphs.length > 0) {
            return { text, paragraphs };
        }

        if (attempt < maxAttempts - 1) {
            await delay(150);
        }
    }

    return { text: "", paragraphs: [] };
}

/**
 * Read e2e mode toggle from local storage.
 * @returns {Promise<boolean>}
 */
export async function isE2EModeEnabled() {
    return new Promise((resolve) => {
        chrome.storage.local.get(["e2eMode"], (result) => {
            resolve(Boolean(result.e2eMode));
        });
    });
}
