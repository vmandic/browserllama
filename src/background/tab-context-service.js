(function(global) {
    let lastContentTabId = null;

    /**
     * Check if URL is extension-internal.
     * @param {string} url
     * @returns {boolean}
     */
    function isExtensionUrl(url) {
        return typeof url === "string" && url.startsWith("chrome-extension://");
    }

    /**
     * Inject selection listener into active tab page.
     */
    function addSelectionListener() {
        document.addEventListener("selectionchange", () => {
            const selectedText = window.getSelection().toString().trim();
            if (selectedText) {
                chrome.storage.local.set({ tempSelectedText: selectedText });
            }
        });
    }

    const tabContextService = {
        /**
         * Register tab listeners for page context capture.
         */
        initSelectionTracking() {
            chrome.tabs.onActivated.addListener((activeInfo) => {
                chrome.scripting.executeScript({
                    target: { tabId: activeInfo.tabId },
                    function: addSelectionListener,
                }).catch(console.error);

                chrome.tabs.get(activeInfo.tabId, (tab) => {
                    if (tab && !isExtensionUrl(tab.url)) {
                        lastContentTabId = activeInfo.tabId;
                    }
                });
            });

            chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
                if (changeInfo.status === "complete" && tab && !isExtensionUrl(tab.url)) {
                    lastContentTabId = tabId;
                }
            });
        },

        /**
         * Extract current page text and paragraph list from a best-effort tab target.
         * @returns {Promise<{text: string, paragraphs: string[]}>}
         */
        async getPageTextFromActiveTab() {
            const forcedTarget = await new Promise((resolve) => {
                chrome.storage.local.get(["forceTabUrlPrefix", "forceTabId"], (result) => {
                    resolve({
                        forceTabUrlPrefix: result.forceTabUrlPrefix || null,
                        forceTabId: Number.isInteger(result.forceTabId) ? result.forceTabId : null,
                    });
                });
            });

            let targetTab = null;
            if (forcedTarget.forceTabId !== null) {
                try {
                    const tab = await chrome.tabs.get(forcedTarget.forceTabId);
                    if (tab && !isExtensionUrl(tab.url)) {
                        targetTab = tab;
                    }
                } catch (error) {
                    console.warn("Failed to read forced tab id:", error);
                }
            }

            if (lastContentTabId) {
                try {
                    const tab = await chrome.tabs.get(lastContentTabId);
                    if (tab && !isExtensionUrl(tab.url)) {
                        targetTab = tab;
                    }
                } catch (error) {
                    console.warn("Failed to read last content tab:", error);
                }
            }

            if (!targetTab) {
                const tabs = await chrome.tabs.query({});
                if (forcedTarget.forceTabUrlPrefix) {
                    targetTab = tabs.find((tab) => typeof tab.url === "string" && tab.url.startsWith(forcedTarget.forceTabUrlPrefix)) || null;
                }
                const activeTab = tabs.find((tab) => tab.active && !isExtensionUrl(tab.url));
                const fallbackTab = [...tabs].reverse().find((tab) => !isExtensionUrl(tab.url));
                targetTab = targetTab || activeTab || fallbackTab;
            }

            if (!targetTab || !targetTab.id) {
                throw new Error("No suitable tab found for content capture.");
            }

            const results = await chrome.scripting.executeScript({
                target: { tabId: targetTab.id },
                function: () => {
                    const paragraphs = Array.from(document.querySelectorAll("p"))
                        .map((paragraph) => paragraph.innerText.trim())
                        .filter(Boolean);
                    return {
                        text: document.body && document.body.innerText ? document.body.innerText : "",
                        paragraphs,
                    };
                },
            });

            return results && results[0] && results[0].result ? results[0].result : { text: "", paragraphs: [] };
        },
    };

    global.BrowserllamaTabContextService = tabContextService;
})(self);
