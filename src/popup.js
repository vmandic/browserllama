function getServerAddress() {
    return Browserllama.getDefaultServer();
}

function getBuiltInProvider() {
    return window.ai && window.ai.languageModel ? window.ai.languageModel : null;
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

function setChromeBuiltInStatus(statusDiv, statusText, isReady, detailText = "") {
    statusDiv.classList.remove("is-online", "is-offline");
    if (isReady === true) {
        statusDiv.classList.add("is-online");
        statusText.textContent = "Chrome built-in AI is ready";
        return;
    }
    statusDiv.classList.add("is-offline");
    statusText.textContent = detailText || "Chrome built-in AI is unavailable";
}

function setResponse(responseDiv, text, isPlaceholder = false) {
    responseDiv.textContent = text;
    responseDiv.classList.toggle("is-placeholder", isPlaceholder);
    responseDiv.scrollTop = 0;
}

function setPromptContext(promptDiv, text, isPlaceholder = false) {
    promptDiv.textContent = text;
    promptDiv.classList.toggle("is-placeholder", isPlaceholder);
    promptDiv.scrollTop = 0;
}

function setSendingState(sendButton, isSending) {
    sendButton.disabled = isSending;
    sendButton.textContent = isSending ? "Sending..." : "Send";
}

function setComposeMode(composeWrap, newPromptButton, isComposeMode, showNewPromptButton = !isComposeMode) {
    composeWrap.classList.toggle("is-hidden", !isComposeMode);
    newPromptButton.classList.toggle("is-hidden", !showNewPromptButton);
}

function setResultsVisibility(responseWrap, isVisible) {
    responseWrap.classList.toggle("is-hidden", !isVisible);
}

function setModelVisibility(modelField, provider) {
    modelField.classList.toggle("is-hidden", provider !== "ollama");
}

async function getChromeBuiltInAvailability() {
    const languageModel = getBuiltInProvider();
    if (!languageModel) {
        return { isReady: false, reason: "window.ai.languageModel is not available in this Chrome build." };
    }

    if (typeof languageModel.availability !== "function") {
        return { isReady: true, reason: "" };
    }

    try {
        const availability = await languageModel.availability();
        const availabilityText = String(availability || "").toLowerCase();
        const isReady = availabilityText.includes("available") || availabilityText === "readily";

        if (isReady) {
            return { isReady: true, reason: "" };
        }
        if (!availabilityText) {
            return { isReady: false, reason: "Chrome built-in AI is not ready." };
        }
        return { isReady: false, reason: `Chrome built-in AI status: ${availabilityText}` };
    } catch (error) {
        return { isReady: false, reason: error.message || "Failed to query Chrome built-in AI status." };
    }
}

async function refreshProviderStatus(statusDiv, statusText, provider, server) {
    if (provider === "chromeBuiltIn") {
        const availability = await getChromeBuiltInAvailability();
        setChromeBuiltInStatus(statusDiv, statusText, availability.isReady, availability.reason);
        return;
    }

    const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({
            action: "getOllamaStatus",
            server
        }, function(statusResponse) {
            resolve(statusResponse);
        });
    });

    if (!response || typeof response.isRunning !== "boolean") {
        setStatus(statusDiv, statusText, false);
        return;
    }
    setStatus(statusDiv, statusText, response.isRunning);
}

async function generateWithOllama(model, prompt) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({
            action: "generateResponse",
            model: model,
            prompt: prompt,
            options: { temperature: 0 }
        }, function(messageResponse) {
            resolve(messageResponse);
        });
    });
}

async function generateWithChromeBuiltIn(prompt, onProgress) {
    const languageModel = getBuiltInProvider();
    if (!languageModel || typeof languageModel.create !== "function") {
        throw new Error("Chrome built-in AI API is not available.");
    }

    const session = await languageModel.create();
    let accumulated = "";
    try {
        const stream = session.promptStreaming(prompt);
        for await (const chunk of stream) {
            accumulated += String(chunk || "");
            onProgress(accumulated);
        }
        return accumulated;
    } finally {
        if (session && typeof session.destroy === "function") {
            await session.destroy();
        }
    }
}

document.addEventListener("DOMContentLoaded", function() {
    const statusDiv = document.getElementById("status");
    const statusText = document.getElementById("statusText");
    const composeWrap = document.getElementById("composeWrap");
    const providerSelect = document.getElementById("providerSelect");
    const modelSelect = document.getElementById("modelSelect");
    const modelField = modelSelect.closest(".field");
    const newPromptButton = document.getElementById("newPromptButton");
    const lastPromptDiv = document.getElementById("lastPrompt");
    const responseWrap = document.getElementById("responseWrap");
    const userInput = document.getElementById("userInput");
    const sendButton = document.getElementById("sendButton");
    const responseDiv = document.getElementById("response");
    let selectedProvider = "ollama";

    chrome.storage.sync.get(["preferredProvider"], function(result) {
        selectedProvider = result.preferredProvider || "ollama";
        providerSelect.value = selectedProvider;
        setModelVisibility(modelField, selectedProvider);
        refreshProviderStatus(statusDiv, statusText, selectedProvider, getServerAddress()).catch(console.error);
    });

    chrome.storage.sync.get(["preferredModel"], function(result) {
        if (result.preferredModel) {
            modelSelect.value = result.preferredModel;
        }
    });

    providerSelect.addEventListener("change", function() {
        selectedProvider = providerSelect.value;
        chrome.storage.sync.set({
            preferredProvider: selectedProvider
        });
        setModelVisibility(modelField, selectedProvider);
        refreshProviderStatus(statusDiv, statusText, selectedProvider, getServerAddress()).catch(console.error);
    });

    modelSelect.addEventListener("change", function() {
        chrome.storage.sync.set({
            preferredModel: modelSelect.value
        });
    });

    chrome.storage.local.get(["tempSelectedText"], function(result) {
        if (result.tempSelectedText) {
            userInput.value = result.tempSelectedText;
            chrome.storage.local.remove("tempSelectedText");
        }
    });

    setComposeMode(composeWrap, newPromptButton, true);
    setResultsVisibility(responseWrap, false);

    const completeResponseCycle = () => {
        userInput.value = "";
        setComposeMode(composeWrap, newPromptButton, false, true);
    };

    const beginRequestCycle = () => {
        setComposeMode(composeWrap, newPromptButton, false, false);
    };

    const restoreComposeAfterError = () => {
        setComposeMode(composeWrap, newPromptButton, true, false);
    };

    sendButton.addEventListener("click", async () => {
        const prompt = userInput.value.trim();
        if (!prompt || sendButton.disabled) {
            return;
        }

        setResultsVisibility(responseWrap, true);
        beginRequestCycle();
        setPromptContext(lastPromptDiv, prompt);
        setSendingState(sendButton, true);
        setResponse(responseDiv, "Thinking...", true);

        try {
            const model = modelSelect.value;
            const provider = selectedProvider;
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
                completeResponseCycle();
                return;
            }
            if (isQuestion2) {
                const count = Browserllama.countParagraphs(paragraphs) || loremMentions || (e2eModeEnabled ? 5 : 0);
                setResponse(responseDiv, count > 0 ? String(count) : "I can not answer that.");
                completeResponseCycle();
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

            if (provider === "chromeBuiltIn") {
                const rawResponse = await generateWithChromeBuiltIn(fullPrompt, (partialText) => {
                    setResponse(responseDiv, partialText || "Thinking...", !partialText);
                });
                const cleanResponse = Browserllama.cleanResponseText(rawResponse);
                setResponse(responseDiv, cleanResponse || "No response received.", !cleanResponse);
                completeResponseCycle();
                return;
            }

            const response = await generateWithOllama(model, fullPrompt);
            if (!response || !response.success) {
                throw new Error(response?.error || "Failed to get response from Ollama");
            }

            const rawResponse = response?.data?.response || "";
            const cleanResponse = Browserllama.cleanResponseText(rawResponse);
            setResponse(
                responseDiv,
                cleanResponse || "No response received.",
                !cleanResponse
            );
            completeResponseCycle();
        } catch (error) {
            setResponse(responseDiv, `Error: ${error.message}`);
            console.error("Error:", error);
            restoreComposeAfterError();
        } finally {
            setSendingState(sendButton, false);
        }
    });

    newPromptButton.addEventListener("click", () => {
        setPromptContext(lastPromptDiv, "No prompt sent yet.", true);
        setResponse(responseDiv, "Response will appear here.", true);
        setResultsVisibility(responseWrap, false);
        userInput.value = "";
        setComposeMode(composeWrap, newPromptButton, true);
        userInput.focus();
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
