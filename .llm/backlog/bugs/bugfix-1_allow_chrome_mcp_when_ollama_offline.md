# Created at (UTC)
2026-03-02T22:01:21Z

# Title
Allow Chrome MCP when Ollama offline

# What
Fix provider fallback behavior so users can still run prompts via Chrome MCP (`chromeBuiltIn`) when Ollama is unreachable on the current host. The popup must not trap users in an Ollama-failed state, and must keep a clear path to switch provider and send with Chrome MCP when that provider is available.

# Why
Current UX often starts with Ollama selected (`preferredProvider` default), and when Ollama is down the status enters an offline error state (for example: `Ollama is not reachable: No response from background process`). In that state, users should be able to immediately opt into Chrome MCP and continue, but the flow is not explicit or resilient enough for this scenario.

# How to reproduce
1. Use a host where Ollama is not reachable at the configured `ollamaServer` (or stop Ollama locally).
2. Open the extension popup with `preferredProvider` unset or set to `ollama`.
3. Observe status message showing Ollama offline/unreachable.
4. Try to continue with Chrome MCP provider from the same popup session.
5. Current behavior: flow is error-first and does not provide an explicit guided fallback; user can remain blocked in Ollama-centric state.
6. Expected behavior: user can reliably switch to `chromeBuiltIn` and send immediately when Chrome MCP is available, without requiring Ollama recovery.

# How
1. Audit popup readiness logic in `src/popup.js` (`refreshProviderState`, `refreshControlsAvailability`, `loadOllamaProviderState`, `loadChromeBuiltInProviderState`) for Ollama-offline transitions.
2. Ensure provider switch behavior always recomputes readiness from selected provider only, with no stale Ollama-error gating after switching to `chromeBuiltIn`.
3. Add explicit offline fallback UX when Ollama is down and Chrome MCP is available:
   - keep provider selector interactive,
   - show actionable status text that suggests switching provider,
   - avoid ambiguous blocking states.
4. Verify send guards in `src/popup.js` enforce only selected-provider readiness (`chromeBuiltInReady` vs `ollamaReady`) and do not reject valid Chrome MCP sends due to Ollama errors.
5. Confirm background status/icon logic in `src/background.js` stays aligned with selected provider so extension-level state does not imply hard failure while Chrome MCP is usable.
6. Add/extend tests for:
   - Ollama unreachable + Chrome MCP available (send enabled after switch),
   - Ollama unreachable + Chrome MCP unavailable (clear blocked reason),
   - provider switch from failed Ollama to Chrome MCP in one popup session.

# Definition of Done
- When Ollama is unreachable, popup clearly communicates fallback path and does not dead-end the user.
- Switching provider to `chromeBuiltIn` in the same session updates status and control availability without stale Ollama failure state.
- If Chrome MCP is available, send action is enabled and request flow completes through Chrome provider.
- If Chrome MCP is unavailable, popup shows explicit reason and keeps behavior stable.
- Background icon/title behavior remains consistent with selected provider semantics.
- Automated tests cover Ollama-offline fallback behavior and pass.
- No new dependencies are added.

# LLM context checklist
- [ ] Gather implementation context now while writing this task (relevant files, current behavior, constraints, dependencies).
- [ ] Record key context references in this task so implementation starts from concrete facts.
- [ ] At implementation start, re-check current context because code/spec may have changed.
- [ ] Review task evolution via git history (`git log --follow -- .llm/backlog/bugs/bugfix-1_allow_chrome_mcp_when_ollama_offline.md`) before coding.
- [ ] Confirm latest task edit time from git (`git log -1 --format=%cI -- .llm/backlog/bugs/bugfix-1_allow_chrome_mcp_when_ollama_offline.md`) before coding.
- [ ] Update plan based on any drift between recorded context and current repository state.

# LLM implementation checklist
- [ ] Verify current provider state transitions in `src/popup.js` and document exact stale-state failure trigger.
- [ ] Update provider-switch and availability logic in `src/popup.js` so Chrome MCP readiness is independent from Ollama failure once selected.
- [ ] Improve status copy in `src/popup.js` for Ollama-offline fallback guidance toward `chromeBuiltIn`.
- [ ] Confirm `src/popup.html` provider options and defaults still support direct fallback selection.
- [ ] Review `src/background.js` icon/title refresh behavior for selected-provider consistency during Ollama outages.
- [ ] Add or update tests in `tests/` covering Ollama offline to Chrome MCP fallback flow.
- [ ] Run `pnpm test` after implementation.
- [ ] Run `pnpm run e2e` after implementation.
- [ ] Check test coverage, cover and fix what is required, run tests so they pass.
