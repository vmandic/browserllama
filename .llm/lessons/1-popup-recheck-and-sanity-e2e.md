# Create at (UTC)
2026-03-03T11:38:52Z

# Agent model used
GPT-5 Codex

# Backlog task reference
.llm/backlog/bugs/bugfix-2_recheck_ollama_models_on_provider_switch.md

# Problem description
Provider switching after an offline Ollama start could retain stale popup state and fail to refresh available models in the same popup session. During validation, user also reported a blank popup concern that needed explicit startup coverage.

# Lesson learned
For popup provider flows, every switch back to `ollama` should trigger an explicit fresh-check state before model fetch, so stale readiness does not survive across transitions. Separate from feature behavior tests, a dedicated popup boot/render sanity e2e is required to catch regressions where the popup fails to initialize visually.

# Actions taken
- Updated `src/ui/popup/logic/provider-logic.js` to reset Ollama readiness, clear model options, and show a "Checking Ollama models..." status before each Ollama refresh request.
- Added e2e coverage in `tests/e2e/extension.spec.js` for same-session offline-to-online transition and provider switch back to Ollama with multiple models.
- Added e2e sanity test in `tests/e2e/extension.spec.js` to assert popup opens and base UI elements render.
- Ran `pnpm test` and `pnpm run e2e` to validate behavior.

# Recommendations
- Keep provider refresh logic transition-safe: reset provider-local state before async fetches and guard stale async responses.
- Keep one lightweight startup sanity e2e that validates popup render independently from Ollama availability.
- When user reports blank popup despite passing tests, treat it as possible environment/profile staleness and request popup DevTools error output for deterministic debugging.
