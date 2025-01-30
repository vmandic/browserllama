// Helper function with hardcoded address
function getServerAddress() {
    return 'http://localhost:11434';
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

    // Add send button click handler
    document.getElementById("sendButton").addEventListener("click", async () => {
        const userInput = document.getElementById("userInput").value;
        if (!userInput) return;

        const responseDiv = document.getElementById("response");
        responseDiv.innerText = "Thinking...";

        try {
            const model = document.getElementById("modelSelect").value;
            
            chrome.runtime.sendMessage({
                action: "generateResponse",
                model: model,
                prompt: userInput
            }, function(response) {
                if (response.success) {
                    // Clean up the response text
                    const cleanResponse = response.data.response
                        .replace(/<think>/g, '')
                        .replace(/<\/think>/g, '')
                        .trim();
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
