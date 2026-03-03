(function(global) {
    const storageService = {
        /**
         * Read configured Ollama server address.
         * @returns {Promise<string>}
         */
        async getServerAddress() {
            return new Promise((resolve) => {
                chrome.storage.sync.get(["ollamaServer"], function(result) {
                    resolve(result.ollamaServer || Browserllama.getDefaultServer());
                });
            });
        },

        /**
         * Read preferred model key.
         * @returns {Promise<string>}
         */
        async getPreferredModel() {
            return new Promise((resolve) => {
                chrome.storage.sync.get(["preferredModel"], function(result) {
                    resolve(result.preferredModel || "deepseek-r1:1.5b");
                });
            });
        },

        /**
         * Read preferred provider key.
         * @returns {Promise<string>}
         */
        async getPreferredProvider() {
            return new Promise((resolve) => {
                chrome.storage.sync.get(["preferredProvider"], function(result) {
                    resolve(result.preferredProvider || "ollama");
                });
            });
        },
    };

    global.BrowserllamaStorageService = storageService;
})(self);
