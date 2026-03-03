import { getPopupDom } from "./dom.js";
import { createPopupState } from "./state.js";
import {
    setComposeMode,
    setModelOptions,
    setModelVisibility,
    setNewPromptButtonState,
    setResultsVisibility,
} from "./components/compose-view.js";
import { setPromptContext, setResponse } from "./components/response-view.js";
import {
    clearTempSelectedText,
    getPreferredProvider,
    getTempSelectedText,
    setPreferredModel,
    setPreferredProvider,
} from "./services/popup-storage-service.js";
import { createProviderLogic } from "./logic/provider-logic.js";
import { createPromptLogic } from "./logic/prompt-logic.js";

/**
 * Bootstrap popup app.
 */
async function bootstrapPopup() {
    const dom = getPopupDom();
    const state = createPopupState();

    /**
     * Keep controls enabled/disabled based on selected provider state.
     */
    function refreshControlsAvailability() {
        const providerReady = state.selectedProvider === "chromeBuiltIn" ? state.chromeBuiltInReady : state.ollamaReady;
        dom.sendButton.disabled = state.isSending || !providerReady;
        dom.modelSelect.disabled = state.isSending || state.selectedProvider !== "ollama" || !state.ollamaReady;
    }

    const providerLogic = createProviderLogic({ dom, state, refreshControlsAvailability });
    const promptLogic = createPromptLogic({ dom, state, refreshControlsAvailability });

    setModelOptions(dom.modelSelect, []);
    refreshControlsAvailability();
    setComposeMode(dom.composeWrap, dom.newPromptButton, true);
    setResultsVisibility(dom.responseWrap, false);
    setNewPromptButtonState(dom.newPromptButton, false);

    dom.providerSelect.addEventListener("change", () => {
        state.selectedProvider = dom.providerSelect.value;
        setPreferredProvider(state.selectedProvider);
        setModelVisibility(dom.modelField, state.selectedProvider);
        providerLogic.refreshProviderState({ allowAutoSwitch: false }).catch(console.error);
    });

    dom.modelSelect.addEventListener("change", () => {
        if (!dom.modelSelect.value) {
            return;
        }
        setPreferredModel(dom.modelSelect.value);
    });

    dom.sendButton.addEventListener("click", () => {
        promptLogic.runSendFlow().catch(console.error);
    });

    dom.newPromptButton.addEventListener("click", async () => {
        if (state.activeRequest) {
            await promptLogic.cancelActiveRequest();
            return;
        }
        setPromptContext(dom.lastPromptDiv, "No prompt sent yet.", true);
        setResponse(dom.responseDiv, "Response will appear here.", true);
        setResultsVisibility(dom.responseWrap, false);
        dom.userInput.value = "";
        state.pendingPromptText = "";
        setComposeMode(dom.composeWrap, dom.newPromptButton, true);
        setNewPromptButtonState(dom.newPromptButton, false);
        dom.userInput.focus();
    });

    dom.userInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            if (!dom.sendButton.disabled) {
                dom.sendButton.click();
            }
        }
    });

    state.selectedProvider = await getPreferredProvider();
    dom.providerSelect.value = state.selectedProvider;
    setModelVisibility(dom.modelField, state.selectedProvider);
    await providerLogic.refreshProviderState({ allowAutoSwitch: true });

    const tempSelectedText = await getTempSelectedText();
    if (tempSelectedText) {
        dom.userInput.value = tempSelectedText;
        await clearTempSelectedText();
    }
}

document.addEventListener("DOMContentLoaded", function() {
    bootstrapPopup().catch((error) => {
        console.error("Failed to initialize popup:", error);
    });
});
