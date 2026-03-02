# Created at (UTC)
2026-02-15T14:05:00Z

# Title
Add Chrome built-in AI as selectable provider

# What
Add a provider selector in the popup so users can choose between Ollama and Chrome built-in AI. When Chrome built-in AI is selected, run prompts through `window.ai.languageModel` directly in the popup instead of calling the Ollama backend.

# Why
Users on supported Chrome builds should be able to run Browserllama without Ollama running locally. A provider switch keeps the current Ollama flow intact while enabling a simpler zero-server path.

# How
1. Add a `Provider` selector (`Ollama`, `Chrome built-in AI`) in the popup UI.
2. Persist provider choice in `chrome.storage.sync` as `preferredProvider`.
3. Keep model selection visible only for Ollama.
4. For Ollama provider, keep current `background.js` message flow (`generateResponse`) unchanged.
5. For Chrome built-in provider, call `window.ai.languageModel.create()` and stream output with `promptStreaming()`.
6. Update popup status messaging to reflect the selected provider readiness.
7. Keep current special-case prompt logic and page-context prompt construction unchanged.
8. Keep extension icon status aligned with selected provider (avoid red-error state when using Chrome built-in provider).

# Definition of Done
- Popup includes a provider selector and persists provider choice.
- Selecting Chrome built-in AI hides Ollama model selection.
- Prompt send works with Chrome built-in AI using streaming output in the response area.
- Ollama provider flow remains functional and unchanged in behavior.
- Status text reflects provider readiness/availability.
- No new dependencies are introduced.
- Extension remains loadable in Chrome as Manifest V3 extension.

# LLM context checklist
- [ ] Review current popup flow in `src/popup.js` and `src/popup.html`.
- [ ] Confirm existing background messaging actions in `src/background.js`.
- [ ] Confirm storage keys currently in use and add provider key without breaking existing users.
- [ ] Verify no manifest changes are required for minimal provider support.

# LLM implementation checklist
- [ ] Add provider selector UI in `src/popup.html`.
- [ ] Add provider state persistence/retrieval in `src/popup.js`.
- [ ] Add Chrome built-in AI generation path in `src/popup.js` using `promptStreaming`.
- [ ] Keep Ollama generation path and model selection intact.
- [ ] Update status handling for provider-specific states.
- [ ] Update background icon/title polling to respect provider choice.
- [ ] Run `pnpm test`.
- [ ] Run `pnpm run e2e`.
