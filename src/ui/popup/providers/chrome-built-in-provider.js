/**
 * Resolve Chrome built-in LanguageModel provider API object.
 * @returns {{source: string, create: Function|null, availability: Function|null}|null}
 */
export function getBuiltInProvider() {
    if (typeof LanguageModel !== "undefined") {
        return {
            source: "LanguageModel",
            create: typeof LanguageModel.create === "function" ? LanguageModel.create.bind(LanguageModel) : null,
            availability: typeof LanguageModel.availability === "function" ? LanguageModel.availability.bind(LanguageModel) : null,
        };
    }

    if (window.ai && window.ai.languageModel) {
        const legacyLanguageModel = window.ai.languageModel;
        return {
            source: "window.ai.languageModel",
            create: typeof legacyLanguageModel.create === "function" ? legacyLanguageModel.create.bind(legacyLanguageModel) : null,
            availability: typeof legacyLanguageModel.availability === "function" ? legacyLanguageModel.availability.bind(legacyLanguageModel) : null,
        };
    }

    return null;
}

/**
 * Query built-in model readiness state.
 * @returns {Promise<{isReady: boolean, reason: string}>}
 */
export async function getChromeBuiltInAvailability() {
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

/**
 * Generate response via Chrome built-in streaming API.
 * @param {string} prompt
 * @param {(partial: string) => void} onProgress
 * @param {{cancelled: boolean, cancel: Function|null}} requestState
 * @returns {Promise<string>}
 */
export async function generateWithChromeBuiltIn(prompt, onProgress, requestState) {
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
