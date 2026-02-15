importScripts("lib/ollama.js");

// Function to get current server address
async function getServerAddress() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['ollamaServer'], function(result) {
            resolve(result.ollamaServer || Browserllama.getDefaultServer());
        });
    });
}

// Get preferred model
async function getPreferredModel() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['preferredModel'], function(result) {
            resolve(result.preferredModel || 'deepseek-r1:1.5b');
        });
    });
}

async function getPreferredProvider() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(["preferredProvider"], function(result) {
            resolve(result.preferredProvider || "ollama");
        });
    });
}

function setActiveIconAndTitle(title) {
    try {
        chrome.action.setIcon({
            path: {
                "16": "icons/circle-16.png",
                "32": "icons/circle-32.png",
                "128": "icons/circle-128.png"
            }
        });
    } catch (iconError) {
        console.warn('Failed to set icon:', iconError);
    }
    chrome.action.setTitle({ title });
}

// Function to query Ollama
async function queryOllama(prompt) {
    try {
        const server = await getServerAddress();
        const model = await getPreferredModel();
        
        const res = await fetch(`${server}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
                Browserllama.buildGeneratePayload({
                    model,
                    prompt,
                    stream: false,
                    options: { temperature: 0 }
                })
            )
        });

        const data = await res.json();
        return data.response;
    } catch (error) {
        console.error("Error connecting to Ollama:", error);
        return "Error processing request.";
    }
}

// Function to check if Ollama is running
async function checkOllamaStatus(serverOverride = null) {
    try {
        const server = serverOverride || 'http://localhost:11434';
        const response = await fetch(`${server}/api/tags`, {
            method: 'GET',
            mode: 'cors'
        });
        
        if (response.ok) {
            setActiveIconAndTitle("Ollama is running");
            return true;
        }
    } catch (error) {
        console.log('Ollama not running:', error);
    }
    
    try {
        chrome.action.setIcon({
            path: {
                "16": "icons/circle-red-16.png",
                "32": "icons/circle-red-32.png",
                "128": "icons/circle-red-128.png"
            }
        });
    } catch (iconError) {
        console.warn('Failed to set red icon:', iconError);
    }
    chrome.action.setTitle({ title: "Ollama is not running" });
    return false;
}

async function refreshExtensionStatusIcon() {
    const provider = await getPreferredProvider();
    if (provider === "chromeBuiltIn") {
        setActiveIconAndTitle("Using Chrome built-in AI");
        return;
    }
    await checkOllamaStatus();
}

// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
    console.log("Browserllama Extension Installed!");
    refreshExtensionStatusIcon().catch(console.error);
    
    chrome.contextMenus.create({
        id: "sendToBrowserllama",
        title: "Send to Browserllama",
        contexts: ["selection"]
    });
});

let lastContentTabId = null;

// Add selection listener
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

function addSelectionListener() {
    document.addEventListener('selectionchange', () => {
        const selectedText = window.getSelection().toString().trim();
        if (selectedText) {
            chrome.storage.local.set({ 'tempSelectedText': selectedText });
        }
    });
}

// Check status every 10 seconds
setInterval(() => {
    refreshExtensionStatusIcon().catch(console.error);
}, 10000);

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab && !isExtensionUrl(tab.url)) {
        lastContentTabId = tabId;
    }
});

// Add new message listener for API calls
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getOllamaStatus") {
        checkOllamaStatus(request.server).then(status => sendResponse({ isRunning: status }));
        return true;
    }
    if (request.action === "getActivePageText") {
        getPageTextFromActiveTab()
            .then(data => sendResponse({ success: true, data }))
            .catch(error => {
                console.error("Failed to read page text:", error);
                sendResponse({ success: false, error: error.message || "Failed to read page text" });
            });
        return true;
    }
    if (request.action === "generateResponse") {
        getServerAddress()
        .then(server => fetch(`${server}/api/generate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(
                Browserllama.buildGeneratePayload({
                    model: request.model,
                    prompt: request.prompt,
                    stream: false,
                    options: request.options || { temperature: 0 }
                })
            )
        }))
        .then(async res => {
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            return res.json();
        })
        .then(data => {
            sendResponse({ success: true, data: data });
        })
        .catch(error => {
            console.error('Error:', error);
            sendResponse({ 
                success: false, 
                error: error.message || 'Failed to get response from Ollama'
            });
        });
        return true;
    }
});

async function getPageTextFromActiveTab() {
    const forcedTarget = await new Promise(resolve => {
        chrome.storage.local.get(["forceTabUrlPrefix", "forceTabId"], (result) => {
            resolve({
                forceTabUrlPrefix: result.forceTabUrlPrefix || null,
                forceTabId: Number.isInteger(result.forceTabId) ? result.forceTabId : null
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
            targetTab = tabs.find(tab => typeof tab.url === "string" && tab.url.startsWith(forcedTarget.forceTabUrlPrefix)) || null;
        }
        const activeTab = tabs.find(tab => tab.active && !isExtensionUrl(tab.url));
        const fallbackTab = [...tabs].reverse().find(tab => !isExtensionUrl(tab.url));
        targetTab = targetTab || activeTab || fallbackTab;
    }
    if (!targetTab || !targetTab.id) {
        throw new Error("No suitable tab found for content capture.");
    }
    const results = await chrome.scripting.executeScript({
        target: { tabId: targetTab.id },
        function: () => {
            const paragraphs = Array.from(document.querySelectorAll("p"))
                .map(p => p.innerText.trim())
                .filter(Boolean);
            return {
                text: document.body?.innerText || "",
                paragraphs
            };
        }
    });
    return results && results[0] && results[0].result ? results[0].result : { text: "", paragraphs: [] };
}

function isExtensionUrl(url) {
    return typeof url === "string" && url.startsWith("chrome-extension://");
}
