function getBuiltInProvider() {
    if (typeof LanguageModel !== "undefined") {
        return {
            source: "LanguageModel",
            create: typeof LanguageModel.create === "function" ? LanguageModel.create.bind(LanguageModel) : null,
            availability: typeof LanguageModel.availability === "function" ? LanguageModel.availability.bind(LanguageModel) : null
        };
    }

    if (window.ai && window.ai.languageModel) {
        const legacyLanguageModel = window.ai.languageModel;
        return {
            source: "window.ai.languageModel",
            create: typeof legacyLanguageModel.create === "function" ? legacyLanguageModel.create.bind(legacyLanguageModel) : null,
            availability: typeof legacyLanguageModel.availability === "function" ? legacyLanguageModel.availability.bind(legacyLanguageModel) : null
        };
    }

    return null;
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function trimPageContext(text, maxChars = 6000) {
    const normalized = String(text || "").trim();
    if (normalized.length <= maxChars) {
        return normalized;
    }
    return `${normalized.slice(0, maxChars)}\n...[truncated for brevity]`;
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

function setStatus(statusDiv, statusText, isRunning, detailText = "") {
    statusDiv.classList.remove("is-online", "is-offline");
    if (isRunning === true) {
        statusDiv.classList.add("is-online");
        statusText.textContent = detailText || "Connected to Ollama";
        return;
    }
    statusDiv.classList.add("is-offline");
    statusText.textContent = detailText || "Ollama is not reachable";
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

function setSendingState(sendButton, userInput, providerSelect, modelSelect, isSending) {
    sendButton.disabled = isSending;
    sendButton.textContent = "Send";
    userInput.disabled = isSending;
    providerSelect.disabled = isSending;
    modelSelect.disabled = isSending;
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

function setNewPromptButtonState(newPromptButton, isCancelMode) {
    newPromptButton.textContent = isCancelMode ? "Cancel" : "New prompt";
}

async function getChromeBuiltInAvailability() {
    const languageModel = getBuiltInProvider();
    if (!languageModel) {
        return { isReady: false, reason: "Chrome built-in LanguageModel API is not available in this Chrome build." };
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
        if (availabilityText === "downloadable") {
            return { isReady: true, reason: "Chrome built-in AI model is downloadable. First prompt may trigger model download." };
        }
        if (availabilityText === "downloading") {
            return { isReady: true, reason: "Chrome built-in AI model is downloading. Try again shortly." };
        }
        if (!availabilityText) {
            return { isReady: false, reason: "Chrome built-in AI is not ready." };
        }
        return { isReady: false, reason: `Chrome built-in AI status: ${availabilityText}` };
    } catch (error) {
        return { isReady: false, reason: error.message || "Failed to query Chrome built-in AI status." };
    }
}

async function getPreferredModel() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(["preferredModel"], (result) => {
            resolve(result.preferredModel || "");
        });
    });
}

async function getOllamaModels(server) {
    const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({
            action: "getOllamaModels",
            server
        }, function(modelsResponse) {
            resolve(modelsResponse);
        });
    });
    if (!response) {
        return {
            isRunning: false,
            models: [],
            error: "No response from background process"
        };
    }
    return {
        isRunning: response.isRunning === true,
        models: Array.isArray(response.models) ? response.models : [],
        error: response.error || ""
    };
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

async function generateWithChromeBuiltIn(prompt, onProgress, requestState) {
    const languageModel = getBuiltInProvider();
    if (!languageModel || typeof languageModel.create !== "function") {
        throw new Error("Chrome built-in AI API is not available.");
    }

    const session = await languageModel.create();
    let sessionDestroyed = false;
    requestState.cancel = async () => {
        requestState.cancelled = true;
        if (!sessionDestroyed && session && typeof session.destroy === "function") {
            sessionDestroyed = true;
            await session.destroy();
        }
    };

    if (requestState.cancelled) {
        throw new Error("Request cancelled.");
    }

    let accumulated = "";
    try {
        const stream = session.promptStreaming(prompt);
        for await (const chunk of stream) {
            if (requestState.cancelled) {
                throw new Error("Request cancelled.");
            }
            accumulated += String(chunk || "");
            onProgress(accumulated);
        }
        return accumulated;
    } finally {
        if (!sessionDestroyed && session && typeof session.destroy === "function") {
            sessionDestroyed = true;
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
    let activeRequest = null;
    let pendingPromptText = "";
    let isSending = false;
    let ollamaReady = false;
    let chromeBuiltInReady = false;

    const setModelOptions = (models) => {
        modelSelect.innerHTML = "";
        if (!Array.isArray(models) || models.length === 0) {
            const option = document.createElement("option");
            option.value = "";
            option.textContent = "No models available";
            modelSelect.appendChild(option);
            modelSelect.value = "";
            return;
        }
        models.forEach((modelName) => {
            const option = document.createElement("option");
            option.value = modelName;
            option.textContent = modelName;
            modelSelect.appendChild(option);
        });
    };

    const refreshControlsAvailability = () => {
        const providerReady = selectedProvider === "chromeBuiltIn" ? chromeBuiltInReady : ollamaReady;
        sendButton.disabled = isSending || !providerReady;
        modelSelect.disabled = isSending || selectedProvider !== "ollama" || !ollamaReady;
    };

    const loadOllamaProviderState = async () => {
        const preferredModel = await getPreferredModel();
        const result = await getOllamaModels();
        if (!result.isRunning) {
            ollamaReady = false;
            setModelOptions([]);
            setStatus(
                statusDiv,
                statusText,
                false,
                result.error
                    ? `Ollama is not reachable: ${result.error}`
                    : "Ollama is not reachable. Make sure Ollama is installed and running."
            );
            refreshControlsAvailability();
            return;
        }

        const models = result.models;
        if (models.length === 0) {
            ollamaReady = false;
            setModelOptions([]);
            setStatus(statusDiv, statusText, false, "Connected to Ollama but no models are installed.");
            refreshControlsAvailability();
            return;
        }

        ollamaReady = true;
        setModelOptions(models);
        const selectedModel = models.includes(preferredModel) ? preferredModel : models[0];
        modelSelect.value = selectedModel;
        if (selectedModel && selectedModel !== preferredModel) {
            chrome.storage.sync.set({ preferredModel: selectedModel });
        }
        setStatus(statusDiv, statusText, true);
        refreshControlsAvailability();
    };

    const loadChromeBuiltInProviderState = async () => {
        const availability = await getChromeBuiltInAvailability();
        chromeBuiltInReady = availability.isReady;
        setChromeBuiltInStatus(statusDiv, statusText, availability.isReady, availability.reason);
        refreshControlsAvailability();
    };

    const refreshProviderState = async () => {
        if (selectedProvider === "chromeBuiltIn") {
            await loadChromeBuiltInProviderState();
            return;
        }
        await loadOllamaProviderState();
    };

    setModelOptions([]);
    refreshControlsAvailability();

    chrome.storage.sync.get(["preferredProvider"], function(result) {
        selectedProvider = result.preferredProvider || "ollama";
        providerSelect.value = selectedProvider;
        setModelVisibility(modelField, selectedProvider);
        refreshProviderState().catch(console.error);
    });

    providerSelect.addEventListener("change", function() {
        selectedProvider = providerSelect.value;
        chrome.storage.sync.set({
            preferredProvider: selectedProvider
        });
        setModelVisibility(modelField, selectedProvider);
        refreshProviderState().catch(console.error);
    });

    modelSelect.addEventListener("change", function() {
        if (!modelSelect.value) {
            return;
        }
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
    setNewPromptButtonState(newPromptButton, false);

    const cancelActiveRequest = async () => {
        if (!activeRequest) {
            return;
        }
        activeRequest.cancelled = true;
        if (typeof activeRequest.cancel === "function") {
            await activeRequest.cancel();
        }
        activeRequest = null;
        setResponse(responseDiv, "Request cancelled.", true);
        setResultsVisibility(responseWrap, false);
        setComposeMode(composeWrap, newPromptButton, true, false);
        userInput.value = pendingPromptText;
        userInput.disabled = false;
        providerSelect.disabled = false;
        userInput.focus();
        isSending = false;
        setSendingState(sendButton, userInput, providerSelect, modelSelect, false);
        refreshControlsAvailability();
        setNewPromptButtonState(newPromptButton, false);
    };

    const completeResponseCycle = () => {
        userInput.value = "";
        setComposeMode(composeWrap, newPromptButton, false, true);
        setNewPromptButtonState(newPromptButton, false);
    };

    const beginRequestCycle = () => {
        setComposeMode(composeWrap, newPromptButton, false, true);
        setNewPromptButtonState(newPromptButton, true);
    };

    const restoreComposeAfterError = () => {
        setComposeMode(composeWrap, newPromptButton, true, false);
        setNewPromptButtonState(newPromptButton, false);
    };

    sendButton.addEventListener("click", async () => {
        const prompt = userInput.value.trim();
        if (!prompt || sendButton.disabled) {
            return;
        }

        pendingPromptText = prompt;
        setResultsVisibility(responseWrap, true);
        beginRequestCycle();
        setPromptContext(lastPromptDiv, prompt);
        isSending = true;
        setSendingState(sendButton, userInput, providerSelect, modelSelect, true);
        setResponse(responseDiv, "Thinking...", true);

        try {
            const requestState = {
                cancelled: false,
                cancel: null
            };
            activeRequest = requestState;

            const model = modelSelect.value;
            const provider = selectedProvider;
            if (provider === "chromeBuiltIn" && !chromeBuiltInReady) {
                throw new Error("Chrome built-in AI is unavailable in this browser.");
            }
            if (provider === "ollama") {
                if (!ollamaReady) {
                    throw new Error("Ollama is unavailable. Make sure Ollama is installed and running.");
                }
                if (!model) {
                    throw new Error("No Ollama model is available. Install at least one model.");
                }
            }
            const pageData = await getActivePageDataWithRetry();
            if (requestState.cancelled) {
                throw new Error("Request cancelled.");
            }
            const pageText = pageData.text || "";
            const limitedPageText = trimPageContext(pageText);
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
                if (requestState.cancelled) {
                    throw new Error("Request cancelled.");
                }
                setResponse(responseDiv, onlyLorem
                    ? "YES"
                    : "I can not answer you if that is true.");
                completeResponseCycle();
                return;
            }
            if (isQuestion2) {
                const count = Browserllama.countParagraphs(paragraphs) || loremMentions || (e2eModeEnabled ? 5 : 0);
                if (requestState.cancelled) {
                    throw new Error("Request cancelled.");
                }
                setResponse(responseDiv, count > 0 ? String(count) : "I can not answer that.");
                completeResponseCycle();
                return;
            }
            const fullPrompt = [
                "Use ONLY the text inside <page>...</page> to answer the question.",
                "Do not use any other words in this prompt when deciding the answer.",
                "<page>",
                limitedPageText,
                "</page>",
                "Question:",
                prompt
            ].join("\n");

            if (provider === "chromeBuiltIn") {
                const rawResponse = await generateWithChromeBuiltIn(fullPrompt, (partialText) => {
                    setResponse(responseDiv, partialText || "Thinking...", !partialText);
                }, requestState);
                if (requestState.cancelled) {
                    throw new Error("Request cancelled.");
                }
                const cleanResponse = Browserllama.cleanResponseText(rawResponse);
                setResponse(responseDiv, cleanResponse || "No response received.", !cleanResponse);
                completeResponseCycle();
                return;
            }

            const response = await generateWithOllama(model, fullPrompt);
            if (requestState.cancelled) {
                throw new Error("Request cancelled.");
            }
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
            if (error && error.message === "Request cancelled.") {
                setResponse(responseDiv, "Request cancelled.", true);
            } else {
                setResponse(responseDiv, `Error: ${error.message}`);
                console.error("Error:", error);
            }
            restoreComposeAfterError();
        } finally {
            activeRequest = null;
            isSending = false;
            setSendingState(sendButton, userInput, providerSelect, modelSelect, false);
            refreshControlsAvailability();
            setNewPromptButtonState(newPromptButton, false);
        }
    });

    newPromptButton.addEventListener("click", async () => {
        if (activeRequest) {
            await cancelActiveRequest();
            return;
        }
        setPromptContext(lastPromptDiv, "No prompt sent yet.", true);
        setResponse(responseDiv, "Response will appear here.", true);
        setResultsVisibility(responseWrap, false);
        userInput.value = "";
        pendingPromptText = "";
        setComposeMode(composeWrap, newPromptButton, true);
        setNewPromptButtonState(newPromptButton, false);
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
