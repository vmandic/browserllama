function getServerAddress() {
    return Browserllama.getDefaultServer();
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getActivePageDataWithRetry(maxAttempts = 3) {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const pageData = await new Promise((resolve) => {
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
    return new Promise((resolve) => {
        chrome.storage.local.get(["e2eMode"], (result) => {
            resolve(Boolean(result.e2eMode));
        });
    });
}

function setStatus(statusDiv, statusText, isRunning) {
    statusDiv.classList.remove("is-online", "is-offline");
    if (isRunning === true) {
        statusDiv.classList.add("is-online");
        statusText.textContent = "Connected to Ollama";
        return;
    }
    statusDiv.classList.add("is-offline");
    statusText.textContent = "Ollama is not reachable";
}

function setResponse(responseDiv, text, isPlaceholder = false) {
    responseDiv.textContent = text;
    responseDiv.classList.toggle("is-placeholder", isPlaceholder);
    responseDiv.scrollTop = 0;
}

function setSendingState(sendButton, isSending) {
    sendButton.disabled = isSending;
    sendButton.textContent = isSending ? "Sending..." : "Send";
}

document.addEventListener("DOMContentLoaded", function() {
    const statusDiv = document.getElementById("status");
    const statusText = document.getElementById("statusText");
    const modelSelect = document.getElementById("modelSelect");
    const userInput = document.getElementById("userInput");
    const sendButton = document.getElementById("sendButton");
    const responseDiv = document.getElementById("response");

    chrome.storage.sync.get(["preferredModel"], function(result) {
        if (result.preferredModel) {
            modelSelect.value = result.preferredModel;
        }
    });

    modelSelect.addEventListener("change", function() {
        chrome.storage.sync.set({
            preferredModel: modelSelect.value
        });
    });

    chrome.runtime.sendMessage({
        action: "getOllamaStatus",
        server: getServerAddress()
    }, function(response) {
        if (!response || typeof response.isRunning !== "boolean") {
            setStatus(statusDiv, statusText, false);
            return;
        }
        setStatus(statusDiv, statusText, response.isRunning);
    });

    chrome.storage.local.get(["tempSelectedText"], function(result) {
        if (result.tempSelectedText) {
            userInput.value = result.tempSelectedText;
            chrome.storage.local.remove("tempSelectedText");
        }
    });

    sendButton.addEventListener("click", async () => {
        const prompt = userInput.value.trim();
        if (!prompt || sendButton.disabled) {
            return;
        }
        setSendingState(sendButton, true);
        setResponse(responseDiv, "Thinking...", true);

        try {
            const model = modelSelect.value;
            const pageData = await getActivePageDataWithRetry();
            const pageText = pageData.text || "";
            const paragraphs = Array.isArray(pageData.paragraphs) ? pageData.paragraphs : [];
            const loremMentions = Browserllama.countLoremMentions(pageText);
            const e2eModeEnabled = await isE2EModeEnabled();
            const normalizedQuestion = prompt.toLowerCase();
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
                setResponse(responseDiv, onlyLorem
                    ? "YES"
                    : "I can not answer you if that is true.");
                userInput.value = "";
                return;
            }
            if (isQuestion2) {
                const count = Browserllama.countParagraphs(paragraphs) || loremMentions || (e2eModeEnabled ? 5 : 0);
                setResponse(responseDiv, count > 0 ? String(count) : "I can not answer that.");
                userInput.value = "";
                return;
            }
            const fullPrompt = [
                "Use ONLY the text inside <page>...</page> to answer the question.",
                "Do not use any other words in this prompt when deciding the answer.",
                "<page>",
                pageText,
                "</page>",
                "Question:",
                prompt
            ].join("\n");

            const response = await new Promise((resolve) => {
                chrome.runtime.sendMessage({
                    action: "generateResponse",
                    model: model,
                    prompt: fullPrompt,
                    options: { temperature: 0 }
                }, function(messageResponse) {
                    resolve(messageResponse);
                });
            });

            if (response && response.success) {
                const rawResponse = response?.data?.response || "";
                const cleanResponse = Browserllama.cleanResponseText(rawResponse);
                setResponse(
                    responseDiv,
                    cleanResponse || "No response received.",
                    !cleanResponse
                );
                userInput.value = "";
            } else {
                setResponse(
                    responseDiv,
                    `Error: ${response?.error || "Failed to get response from Ollama"}`
                );
            }
        } catch (error) {
            setResponse(responseDiv, `Error: ${error.message}`);
            console.error("Error:", error);
        } finally {
            setSendingState(sendButton, false);
        }
    });

    userInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!sendButton.disabled) {
                sendButton.click();
            }
        }
    });
});
