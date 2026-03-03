(function(global) {
    /**
     * Set healthy extension icon and title.
     * @param {string} title
     */
    function setActiveIconAndTitle(title) {
        try {
            chrome.action.setIcon({
                path: {
                    "16": "icons/circle-16.png",
                    "32": "icons/circle-32.png",
                    "128": "icons/circle-128.png",
                },
            });
        } catch (iconError) {
            console.warn("Failed to set icon:", iconError);
        }
        chrome.action.setTitle({ title });
    }

    /**
     * Set offline extension icon and title.
     * @param {string} title
     */
    function setOfflineIconAndTitle(title) {
        try {
            chrome.action.setIcon({
                path: {
                    "16": "icons/circle-red-16.png",
                    "32": "icons/circle-red-32.png",
                    "192": "icons/circle-red-192.png",
                },
            });
        } catch (iconError) {
            console.warn("Failed to set red icon:", iconError);
        }
        chrome.action.setTitle({ title });
    }

    const iconStatusService = {
        setActiveIconAndTitle,

        /**
         * Refresh icon state based on provider and Ollama reachability.
         * @param {Function} getPreferredProvider
         * @param {Function} fetchOllamaTags
         */
        async refreshExtensionStatusIcon(getPreferredProvider, fetchOllamaTags) {
            const provider = await getPreferredProvider();
            if (provider === "chromeBuiltIn") {
                setActiveIconAndTitle("Using Chrome built-in AI");
                return;
            }

            const tags = await fetchOllamaTags();
            if (tags.isRunning) {
                setActiveIconAndTitle("Ollama is running");
                return;
            }
            setOfflineIconAndTitle("Ollama is not running");
        },
    };

    global.BrowserllamaIconStatusService = iconStatusService;
})(self);
