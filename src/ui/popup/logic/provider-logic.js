import { setChromeBuiltInStatus, setStatus } from "../components/status-view.js";
import { setModelOptions, setModelVisibility } from "../components/compose-view.js";
import { getChromeBuiltInAvailability } from "../providers/chrome-built-in-provider.js";
import { getOllamaModels } from "../providers/ollama-provider.js";
import { getPreferredModel, setPreferredModel, setPreferredProvider } from "../services/popup-storage-service.js";

/**
 * Create provider state operations.
 * @param {object} deps
 * @returns {object}
 */
export function createProviderLogic(deps) {
    const { dom, state, refreshControlsAvailability } = deps;

    /**
     * Check if a provider refresh result is stale.
     * @param {number} requestId
     * @returns {boolean}
     */
    function isStaleProviderStateRequest(requestId) {
        return requestId !== state.providerStateRequestId;
    }

    /**
     * Load Ollama models and readiness.
     * @param {number} requestId
     * @param {{allowAutoSwitch: boolean}} options
     */
    async function loadOllamaProviderState(requestId, options = {}) {
        const allowAutoSwitch = options.allowAutoSwitch === true;
        const preferredModel = await getPreferredModel();
        if (isStaleProviderStateRequest(requestId)) {
            return;
        }

        const result = await getOllamaModels();
        if (isStaleProviderStateRequest(requestId)) {
            return;
        }

        if (!result.isRunning) {
            state.ollamaReady = false;
            setModelOptions(dom.modelSelect, []);
            const chromeAvailability = await getChromeBuiltInAvailability();
            if (isStaleProviderStateRequest(requestId)) {
                return;
            }
            state.chromeBuiltInReady = chromeAvailability.isReady;
            if (chromeAvailability.isReady && allowAutoSwitch) {
                state.selectedProvider = "chromeBuiltIn";
                dom.providerSelect.value = "chromeBuiltIn";
                setPreferredProvider("chromeBuiltIn");
                setModelVisibility(dom.modelField, state.selectedProvider);
                setChromeBuiltInStatus(
                    dom.statusDiv,
                    dom.statusText,
                    true,
                    "Ollama is unavailable. Switched to Chrome built-in AI."
                );
                refreshControlsAvailability();
                return;
            }
            const errorDetail = result.error
                ? `Ollama is not reachable: ${result.error}`
                : "Ollama is not reachable. Make sure Ollama is installed and running.";
            setStatus(dom.statusDiv, dom.statusText, false, errorDetail);
            refreshControlsAvailability();
            return;
        }

        if (result.models.length === 0) {
            state.ollamaReady = false;
            setModelOptions(dom.modelSelect, []);
            setStatus(dom.statusDiv, dom.statusText, false, "Connected to Ollama but no models are installed.");
            refreshControlsAvailability();
            return;
        }

        state.ollamaReady = true;
        setModelOptions(dom.modelSelect, result.models);
        const selectedModel = result.models.includes(preferredModel) ? preferredModel : result.models[0];
        dom.modelSelect.value = selectedModel;
        if (selectedModel && selectedModel !== preferredModel) {
            setPreferredModel(selectedModel);
        }
        setStatus(dom.statusDiv, dom.statusText, true);
        refreshControlsAvailability();
    }

    /**
     * Load Chrome built-in readiness.
     * @param {number} requestId
     */
    async function loadChromeBuiltInProviderState(requestId) {
        const availability = await getChromeBuiltInAvailability();
        if (isStaleProviderStateRequest(requestId)) {
            return;
        }
        state.chromeBuiltInReady = availability.isReady;
        setChromeBuiltInStatus(dom.statusDiv, dom.statusText, availability.isReady, availability.reason);
        refreshControlsAvailability();
    }

    /**
     * Refresh selected provider state.
     * @param {{allowAutoSwitch: boolean}} options
     */
    async function refreshProviderState(options = {}) {
        const requestId = state.providerStateRequestId + 1;
        state.providerStateRequestId = requestId;
        if (state.selectedProvider === "chromeBuiltIn") {
            await loadChromeBuiltInProviderState(requestId);
            return;
        }
        await loadOllamaProviderState(requestId, options);
    }

    return { refreshProviderState };
}
