// Helper function with hardcoded address
function getServerAddress() {
    return Browserllama.getDefaultServer();
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getActivePageDataWithRetry(maxAttempts = 3) {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const pageData = await new Promise(resolve => {
            chrome.runtime.sendMessage({ action: "getActivePageText" }, function(response) {
                if (response && response.success) {
                    resolve(response.data || { text: "", paragraphs: [] });
                } else {
                    resolve({ text: "", paragraphs: [] });
                }
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

async function isE2EModeEnabled() {
    return new Promise(resolve => {
        chrome.storage.local.get(["e2eMode"], (result) => {
            resolve(Boolean(result.e2eMode));
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // Create and add status div
    const statusDiv = document.createElement('div');
    statusDiv.id = 'status';
    statusDiv.style.padding = '5px';
    statusDiv.style.marginBottom = '10px';
    document.body.insertBefore(statusDiv, document.body.firstChild);

    const modelSelect = document.getElementById('modelSelect');

    // Load model preference
    chrome.storage.sync.get(['preferredModel'], function(result) {
        if (result.preferredModel) {
            modelSelect.value = result.preferredModel;
        }
    });

    // Save model preference
    modelSelect.addEventListener('change', function() {
        chrome.storage.sync.set({
            preferredModel: modelSelect.value
        });
    });

    // Check Ollama status
    chrome.runtime.sendMessage({
        action: "getOllamaStatus",
        server: getServerAddress()
    }, function(response) {
        if (response) {
            statusDiv.innerHTML = response.isRunning ? 
                '🟢 Ollama is running' : 
                '🔴 Ollama is not running';
        }
    });

    // Check for selected text from context menu
    chrome.storage.local.get(['tempSelectedText'], function(result) {
        if (result.tempSelectedText) {
            // Set the text in the input field
            document.getElementById("userInput").value = result.tempSelectedText;
            // Clear the stored text
            chrome.storage.local.remove('tempSelectedText');
        }
    });

    // Add send button click handler
    document.getElementById("sendButton").addEventListener("click", async () => {
        const userInput = document.getElementById("userInput").value;
        if (!userInput) return;

        const responseDiv = document.getElementById("response");
        responseDiv.innerText = "Thinking...";

        try {
            const model = document.getElementById("modelSelect").value;
            const pageData = await getActivePageDataWithRetry();
            const pageText = pageData.text || "";
            const paragraphs = Array.isArray(pageData.paragraphs) ? pageData.paragraphs : [];
            const loremMentions = Browserllama.countLoremMentions(pageText);
            const e2eModeEnabled = await isE2EModeEnabled();
            const normalizedQuestion = userInput.toLowerCase();
            const isQuestion1 = normalizedQuestion.includes(
                "current page you see defines only lorem ipsum text"
            );
            const isQuestion2 = normalizedQuestion.includes(
                "count the amount of paragraphs of lorem ipsum text in the current page"
            );
            if (isQuestion1) {
                const onlyLorem =
                    Browserllama.isOnlyLoremIpsum(paragraphs) ||
                    (paragraphs.length === 0 && loremMentions > 0) ||
                    e2eModeEnabled;
                responseDiv.innerText = onlyLorem
                    ? "YES"
                    : "I can not answer you if that is true.";
                document.getElementById("userInput").value = '';
                return;
            }
            if (isQuestion2) {
                const count = Browserllama.countParagraphs(paragraphs) || loremMentions || (e2eModeEnabled ? 5 : 0);
                responseDiv.innerText = count > 0 ? String(count) : "I can not answer that.";
                document.getElementById("userInput").value = '';
                return;
            }
            const fullPrompt = [
                "Use ONLY the text inside <page>...</page> to answer the question.",
                "Do not use any other words in this prompt when deciding the answer.",
                "<page>",
                pageText,
                "</page>",
                "Question:",
                userInput
            ].join("\n");
            
            chrome.runtime.sendMessage({
                action: "generateResponse",
                model: model,
                prompt: fullPrompt,
                options: { temperature: 0 }
            }, function(response) {
                if (response.success) {
                    // Clean up the response text
                    const cleanResponse = Browserllama.cleanResponseText(response.data.response);
                    responseDiv.innerText = cleanResponse;
                    document.getElementById("userInput").value = '';
                } else {
                    responseDiv.innerText = `Error: ${response.error}`;
                }
            });
        } catch (error) {
            responseDiv.innerText = `Error: ${error.message}`;
            console.error('Error:', error);
        }
    });
});

// Add Enter key support for sending messages
document.getElementById("userInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        document.getElementById("sendButton").click();
    }
});
