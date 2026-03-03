# Create at (UTC)
2026-03-03T11:38:53Z

# Agent model used
GPT-5 Codex

# Backlog task reference
None

# Problem description
Ollama model list check succeeded but generation failed with HTTP 403, and popup UI behavior was inconsistent across provider switches with a visible fast twitch on Ollama errors.

# Lesson learned
In browser-extension + local-server integrations, a successful GET health/model check does not guarantee POST generation will pass CORS/origin policy. UI state transitions should avoid immediate mode flips on fast failures to prevent visual flicker.

# Actions taken
- Improved Ollama error handling in `src/background/ollama-service.js` to return actionable 403 guidance.
- Stabilized provider refresh behavior in `src/ui/popup/logic/provider-logic.js` by avoiding destructive reset when models are already loaded.
- Kept error display in response mode in `src/ui/popup/logic/prompt-logic.js` to remove rapid compose/response bouncing.
- Updated Chrome built-in status rendering in `src/ui/popup/components/status-view.js` to honor readiness detail text.

# Recommendations
- When Ollama shows 403 from extension requests, verify the running Ollama process environment (not only shell config files) and confirm which process is bound to `localhost:11434`.
- Preserve previous UI state during provider rechecks; only clear controls when there is no known good state.
- For popup request flows, keep success and error completion paths visually consistent to avoid perceived instability.
