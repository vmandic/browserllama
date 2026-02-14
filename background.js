// Function to get current server address
async function getServerAddress() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['ollamaServer'], function(result) {
            resolve(result.ollamaServer || 'http://localhost:11434');
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

// Function to query Ollama
async function queryOllama(prompt) {
    try {
        const server = await getServerAddress();
        const model = await getPreferredModel();
        
        const res = await fetch(`${server}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: model,
                prompt: prompt,
                stream: false
            })
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
            chrome.action.setTitle({ title: "Ollama is running" });
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

// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
    console.log("Browserllama Extension Installed!");
    checkOllamaStatus().catch(console.error);
    
    chrome.contextMenus.create({
        id: "sendToBrowserllama",
        title: "Send to Browserllama",
        contexts: ["selection"]
    });
});

// Add selection listener
chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.scripting.executeScript({
        target: { tabId: activeInfo.tabId },
        function: addSelectionListener,
    }).catch(console.error);
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
    checkOllamaStatus().catch(console.error);
}, 10000);

// Add new message listener for API calls
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getOllamaStatus") {
        checkOllamaStatus(request.server).then(status => sendResponse({ isRunning: status }));
        return true;
    }
    if (request.action === "generateResponse") {
        fetch("http://localhost:11434/api/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: request.model,
                prompt: request.prompt,
                stream: false
            })
        })
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
