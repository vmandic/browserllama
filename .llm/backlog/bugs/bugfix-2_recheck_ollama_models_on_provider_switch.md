# Created at (UTC)
2026-03-03T08:54:09Z

# Title
Recheck Ollama models on provider switch

# What
Fix popup provider-state handling so switching to `ollama` always performs a fresh active-model check and updates the model selector from the latest Ollama state. This must work when Ollama was unavailable earlier in the same popup session but later becomes available with running models.

# Why
Current behavior can keep stale "offline/no models" state after provider changes in the same popup session. If Ollama starts after the initial failed check, switching back to `ollama` may not actively refresh models, so users cannot immediately use models that are now running (for example visible in `ollama ps`).

# How to reproduce
1. Ensure extension popup starts with Ollama unavailable (stop Ollama or make `ollamaServer` unreachable).
2. Open popup and confirm Ollama shows offline/error or no-available-model state.
3. Start Ollama and ensure at least two models are running (`ollama ps` shows both).
4. In the same popup session, switch provider away from and back to `ollama`.
5. Current behavior: popup can keep stale readiness/model state and not recheck active models immediately.
6. Expected behavior: every switch to `ollama` triggers fresh provider check and model list refresh, reflecting currently running/available models.

# How
0. Follow project LLM architectural rules and conventions from `.llm/rules/` (including scope/edit boundaries, decision handling, testing expectations, and JavaScript style) while implementing this fix.
1. Audit `src/popup.js` provider switch flow (`providerSelect` change handler, `refreshProviderState`, `loadOllamaProviderState`) for stale cache/state reuse.
2. Ensure switching to `ollama` always requests fresh models via background message (no stale short-circuit from previous failed state).
3. Reset or recompute Ollama readiness/model-select state before applying new results so previous errors do not persist incorrectly.
4. Confirm model selector updates when fresh models are returned and preferred model fallback logic remains correct.
5. Review background model query path in `src/background.js` (`checkOllama`) to ensure popup receives current model data each request.
6. Add/extend tests for:
   - Ollama initially offline, then online in same popup session, then provider switched to `ollama` -> model select refreshes correctly.
   - Multiple models available -> selector is enabled and populated.

# Definition of Done
- Switching to `ollama` in popup always triggers a fresh Ollama model check in that session.
- After Ollama becomes available, popup reflects current models without requiring popup reload.
- When multiple models are available, model selector is enabled and shows the refreshed list.
- Status text/readiness state aligns with the latest Ollama check result and does not keep stale offline state.
- Automated tests cover offline-to-online provider-switch refresh flow and pass.
- No new dependencies are added.

# LLM context checklist
- [ ] Gather implementation context now while writing this task (relevant files, current behavior, constraints, dependencies).
- [ ] Record key context references in this task so implementation starts from concrete facts.
- [ ] At implementation start, re-check current context because code/spec may have changed.
- [ ] Review task evolution via git history (`git log --follow -- .llm/backlog/bugs/bugfix-2_recheck_ollama_models_on_provider_switch.md`) before coding.
- [ ] Confirm latest task edit time from git (`git log -1 --format=%cI -- .llm/backlog/bugs/bugfix-2_recheck_ollama_models_on_provider_switch.md`) before coding.
- [ ] Update plan based on any drift between recorded context and current repository state.

# LLM implementation checklist
- [ ] Re-read and apply `.llm/rules/` architectural guidance before coding (`scope_and_edits.mdc`, `decisions.mdc`, `testing.mdc`, `javascript_style.mdc`).
- [ ] Trace current popup refresh sequence in `src/popup.js` and document why switch-to-ollama misses fresh model checks.
- [ ] Update switch and refresh logic in `src/popup.js` so `ollama` selection always performs a fresh request and state reset.
- [ ] Verify model list rendering and preferred-model fallback behavior in `src/popup.js` after refresh.
- [ ] Validate `src/background.js` model query response path is not caching stale model arrays for popup requests.
- [ ] Add or update tests in `tests/e2e/extension.spec.js` for offline-to-online same-session refresh behavior.
- [ ] Run `pnpm test` after implementation.
- [ ] Run `pnpm run e2e` after implementation.
- [ ] Check test coverage, cover and fix what is required, run tests so they pass.
