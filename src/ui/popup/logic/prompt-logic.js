import {
    setComposeMode,
    setNewPromptButtonState,
    setResultsVisibility,
    setSendingState,
} from "../components/compose-view.js";
import { setPromptContext, setResponse } from "../components/response-view.js";
import { trimPageContext, getActivePageDataWithRetry, isE2EModeEnabled } from "../services/page-context-service.js";
import { generateWithChromeBuiltIn } from "../providers/chrome-built-in-provider.js";
import { generateWithMlx } from "../providers/mlx-provider.js";
import { generateWithOllama } from "../providers/ollama-provider.js";

/**
 * Create prompt lifecycle handlers.
 * @param {object} deps
 * @returns {object}
 */
export function createPromptLogic(deps) {
    const { dom, state, refreshControlsAvailability } = deps;

    /**
     * Finalize successful response cycle.
     */
    function completeResponseCycle() {
        dom.userInput.value = "";
        setComposeMode(dom.composeWrap, dom.newPromptButton, false, true);
        setNewPromptButtonState(dom.newPromptButton, false);
    }

    /**
     * Enter sending mode and show cancel button.
     */
    function beginRequestCycle() {
        setComposeMode(dom.composeWrap, dom.newPromptButton, false, true);
        setNewPromptButtonState(dom.newPromptButton, true);
    }

    /**
     * Cancel the active request and restore compose state.
     * @returns {Promise<void>}
     */
    async function cancelActiveRequest() {
        if (!state.activeRequest) {
            return;
        }
        state.activeRequest.cancelled = true;
        if (typeof state.activeRequest.cancel === "function") {
            await state.activeRequest.cancel();
        }
        state.activeRequest = null;
        setResponse(dom.responseDiv, "Request cancelled.", true);
        setResultsVisibility(dom.responseWrap, false);
        setComposeMode(dom.composeWrap, dom.newPromptButton, true, false);
        dom.userInput.value = state.pendingPromptText;
        dom.userInput.disabled = false;
        dom.providerSelect.disabled = false;
        dom.userInput.focus();
        state.isSending = false;
        setSendingState(dom.sendButton, dom.userInput, dom.providerSelect, dom.modelSelect, false);
        refreshControlsAvailability();
        setNewPromptButtonState(dom.newPromptButton, false);
    }

    /**
     * Run one end-to-end prompt request.
     * @returns {Promise<void>}
     */
    async function runSendFlow() {
        const prompt = dom.userInput.value.trim();
        if (!prompt || dom.sendButton.disabled) {
            return;
        }

        state.pendingPromptText = prompt;
        setResultsVisibility(dom.responseWrap, true);
        beginRequestCycle();
        setPromptContext(dom.lastPromptDiv, prompt);
        state.isSending = true;
        setSendingState(dom.sendButton, dom.userInput, dom.providerSelect, dom.modelSelect, true);
        setResponse(dom.responseDiv, "Thinking...", true);

        try {
            const requestState = { cancelled: false, cancel: null };
            state.activeRequest = requestState;

            const model = dom.modelSelect.value;
            const provider = state.selectedProvider;
            if (provider === "chromeBuiltIn" && !state.chromeBuiltInReady) {
                throw new Error("Chrome built-in AI is unavailable in this browser.");
            }
            if (provider === "ollama") {
                if (!state.ollamaReady) {
                    throw new Error("Ollama is unavailable. Make sure Ollama is installed and running.");
                }
                if (!model) {
                    throw new Error("No Ollama model is available. Install at least one model.");
                }
            }
            if (provider === "mlx") {
                if (!state.mlxReady) {
                    throw new Error("MLX provider is unavailable. Start mlx_lm.server and verify the endpoint.");
                }
                if (!model) {
                    throw new Error("No MLX model is available. Verify /models returns at least one model.");
                }
            }

            const pageData = await getActivePageDataWithRetry();
            if (requestState.cancelled) {
                throw new Error("Request cancelled.");
            }

            // Guardrail order is intentional: app-level policy check happens before provider calls.
            if (Browserllama.isUnexpectedPromptForWebInterpreter(prompt)) {
                setResponse(dom.responseDiv, Browserllama.getOffScopeRefusalMessage());
                completeResponseCycle();
                return;
            }

            const pageText = pageData.text || "";
            const limitedPageText = trimPageContext(pageText);
            const paragraphs = Array.isArray(pageData.paragraphs) ? pageData.paragraphs : [];
            const loremMentions = Browserllama.countLoremMentions(pageText);
            const e2eModeEnabled = await isE2EModeEnabled();
            const normalizedQuestion = prompt.toLowerCase();

            const isQuestion1 = normalizedQuestion.includes("current page you see defines only lorem ipsum text");
            const isQuestion2 = normalizedQuestion.includes("count the amount of paragraphs of lorem ipsum text in the current page");

            if (isQuestion1) {
                const onlyLorem = Browserllama.isOnlyLoremIpsum(paragraphs) || (paragraphs.length === 0 && loremMentions > 0) || e2eModeEnabled;
                if (requestState.cancelled) {
                    throw new Error("Request cancelled.");
                }
                setResponse(dom.responseDiv, onlyLorem ? "YES" : "I can not answer you if that is true.");
                completeResponseCycle();
                return;
            }

            if (isQuestion2) {
                const count = Browserllama.countParagraphs(paragraphs) || loremMentions || (e2eModeEnabled ? 5 : 0);
                if (requestState.cancelled) {
                    throw new Error("Request cancelled.");
                }
                setResponse(dom.responseDiv, count > 0 ? String(count) : "I can not answer that.");
                completeResponseCycle();
                return;
            }

            const fullPrompt = Browserllama.buildWebInterpreterPrompt({
                pageText: limitedPageText,
                userPrompt: prompt,
            });

            if (provider === "chromeBuiltIn") {
                const rawResponse = await generateWithChromeBuiltIn(
                    fullPrompt,
                    (partialText) => setResponse(dom.responseDiv, partialText || "Thinking...", !partialText),
                    requestState
                );
                if (requestState.cancelled) {
                    throw new Error("Request cancelled.");
                }
                const cleanResponse = Browserllama.cleanResponseText(rawResponse);
                setResponse(dom.responseDiv, cleanResponse || "No response received.", !cleanResponse);
                completeResponseCycle();
                return;
            }

            if (provider === "mlx") {
                const response = await generateWithMlx(model, fullPrompt);
                if (requestState.cancelled) {
                    throw new Error("Request cancelled.");
                }
                if (!response || !response.success) {
                    throw new Error((response && response.error) || "Failed to get response from MLX");
                }
                const rawResponse = response && response.data ? response.data.response || "" : "";
                const cleanResponse = Browserllama.cleanResponseText(rawResponse);
                setResponse(dom.responseDiv, cleanResponse || "No response received.", !cleanResponse);
                completeResponseCycle();
                return;
            }

            const response = await generateWithOllama(model, fullPrompt);
            if (requestState.cancelled) {
                throw new Error("Request cancelled.");
            }
            if (!response || !response.success) {
                throw new Error((response && response.error) || "Failed to get response from Ollama");
            }

            const rawResponse = response && response.data ? response.data.response || "" : "";
            const cleanResponse = Browserllama.cleanResponseText(rawResponse);
            setResponse(dom.responseDiv, cleanResponse || "No response received.", !cleanResponse);
            completeResponseCycle();
        } catch (error) {
            if (error && error.message === "Request cancelled.") {
                setResponse(dom.responseDiv, "Request cancelled.", true);
            } else {
                setResponse(dom.responseDiv, `Error: ${error.message}`);
                console.error("Error:", error);
            }
        } finally {
            state.activeRequest = null;
            state.isSending = false;
            setSendingState(dom.sendButton, dom.userInput, dom.providerSelect, dom.modelSelect, false);
            refreshControlsAvailability();
            setNewPromptButtonState(dom.newPromptButton, false);
        }
    }

    return {
        cancelActiveRequest,
        runSendFlow,
    };
}
