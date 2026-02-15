// Shared helpers for extension logic and tests.
(function (global) {
  const DEFAULT_SERVER = "http://localhost:11434";

  function getDefaultServer() {
    return DEFAULT_SERVER;
  }

  function buildGeneratePayload(options) {
    const payload = {
      model: options.model,
      prompt: options.prompt,
      stream: options.stream === true,
    };
    if (options.options) {
      payload.options = options.options;
    }
    return payload;
  }

  function cleanResponseText(text) {
    return String(text || "")
      .replace(/<think>[\s\S]*?<\/think>/g, "")
      .trim();
  }

  function extractModelNames(tagsResponse) {
    const models = Array.isArray(tagsResponse && tagsResponse.models)
      ? tagsResponse.models
      : [];
    return models
      .map((model) => String((model && model.name) || "").trim())
      .filter(Boolean);
  }

  function isOnlyLoremIpsum(paragraphs) {
    if (!Array.isArray(paragraphs) || paragraphs.length === 0) {
      return false;
    }
    return paragraphs.every((paragraph) =>
      String(paragraph || "").toLowerCase().includes("lorem ipsum")
    );
  }

  function countParagraphs(paragraphs) {
    if (!Array.isArray(paragraphs)) {
      return 0;
    }
    return paragraphs.filter((paragraph) => String(paragraph || "").trim()).length;
  }

  function countLoremMentions(text) {
    const matches = String(text || "").toLowerCase().match(/lorem ipsum/g);
    return matches ? matches.length : 0;
  }

  const api = {
    getDefaultServer,
    buildGeneratePayload,
    cleanResponseText,
    extractModelNames,
    isOnlyLoremIpsum,
    countParagraphs,
    countLoremMentions,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    global.Browserllama = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
