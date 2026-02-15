# Created at (UTC)
2026-02-15T18:33:52Z

# Title
Scan installed Ollama models

# What
Replace the hardcoded Ollama model list in the popup with a dynamic list fetched from the local Ollama server. Before listing models, verify that Ollama is reachable; if it is not reachable (including Ollama not installed locally), surface offline status, disable invalid actions, and avoid showing stale hardcoded options.

# Why
The fixed model list can drift from what is actually installed on the user machine, causing failed requests and a confusing setup experience. Dynamic discovery ensures the UI reflects real local availability and keeps model selection accurate.

# How
1. Add a background message action that queries Ollama model tags from the configured server and returns `{ isRunning, models, error }` style data.
2. Reuse or align with existing Ollama status checks so online/offline handling is consistent between icon status and popup status.
3. Update popup initialization to request discovered models when provider is `ollama` and populate `#modelSelect` dynamically.
4. Preserve `preferredModel` behavior: auto-select stored model when available; otherwise select a safe fallback from discovered models.
5. Handle empty model results and offline/unreachable Ollama with clear UI messaging and disabled model selection/send behavior when appropriate.
6. Remove hardcoded Ollama options from popup markup and let JavaScript own model option rendering.
7. Ensure the extension does not crash when Ollama is missing/offline and surfaces actionable messaging instead of generic failures.
8. Keep Chrome built-in provider flow unchanged, but explicitly handle unsupported browser/API cases with clear status and guarded send behavior.
9. Add/extend tests for Ollama-offline and Chrome-built-in-unsupported scenarios.

# Definition of Done
- Popup no longer relies on a hardcoded Ollama model list.
- When Ollama is online, popup shows currently installed models from Ollama tags.
- When Ollama is offline, unreachable, or missing locally, popup shows clear status, disables invalid send behavior, and extension UI remains stable (no crash).
- Stored `preferredModel` is applied only when it exists in discovered models.
- Existing send flow continues to work with selected discovered model.
- When Chrome built-in AI is unsupported, popup clearly informs the user and blocks/guards invalid send attempts.
- Automated tests cover at least: Ollama offline/unreachable safety, and Chrome built-in unsupported behavior.
- No new dependencies are added.

# LLM context checklist
- [ ] Gather current context in `src/popup.js`, `src/popup.html`, and `src/background.js` for status checks, model selection, and message actions.
- [ ] Confirm current storage keys (`preferredModel`, `preferredProvider`, `ollamaServer`) and their defaults.
- [ ] Record current Ollama status logic and identify where to avoid duplicate fetch logic.
- [ ] Re-check task and implementation context before coding in case repository state has changed.
- [ ] Review task evolution via `git log --follow -- tasks/feats/feat-4_scan_installed_ollama_models.md`.
- [ ] Confirm latest edit timestamp via `git log -1 --format=%cI -- tasks/feats/feat-4_scan_installed_ollama_models.md`.
- [ ] Adjust implementation steps if there is drift between task intent and current code.

# LLM implementation checklist
- [ ] Add a `getOllamaModels` message action in `src/background.js` that reads configured server and fetches `/api/tags`.
- [ ] Return normalized model names from `src/background.js` and include offline/error information for popup handling.
- [ ] Update `src/popup.html` to remove hardcoded model `<option>` items and keep an empty/select-ready model control.
- [ ] Add model-loading logic in `src/popup.js` to fetch models, render options, and persist selected `preferredModel`.
- [ ] Update popup provider/status flow in `src/popup.js` so Ollama offline/missing and empty-model states are handled explicitly without crashes.
- [ ] Add send-guard behavior in `src/popup.js` for invalid provider readiness states (Ollama unavailable, Chrome built-in unsupported).
- [ ] Verify `chromeBuiltIn` path in `src/popup.js` remains functional and clearly reports unsupported API cases.
- [ ] Add or update tests in `tests/` to cover Ollama offline/unreachable and Chrome built-in unsupported scenarios.
- [ ] Run `pnpm test` after code implementation.
- [ ] Run `pnpm run e2e` after code implementation.
