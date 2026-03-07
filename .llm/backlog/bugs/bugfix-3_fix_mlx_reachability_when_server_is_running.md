# Created at (UTC)
2026-03-07T09:53:55Z

# Title
Fix MLX reachability when server is running

# What
Fix MLX provider readiness and request-path handling so Browserllama can use MLX when `mlx_lm.server` is already running and serving models, including the common local setup shown in user repro (`127.0.0.1:8080`).

# Why
Current behavior can report MLX as unavailable even when `mlx_lm.server` is up, which blocks model selection and send flow. In the reported case (March 7, 2026 screenshot), the server starts successfully but the extension still treats MLX as not working.
Current popup error shown in repro: `MLX provider unavailable: No response from background process`.

# How to reproduce
1. Start MLX with:
   - `mlx_lm.server --model mlx-community/Qwen2.5-7B-Instruct-4bit`
2. Confirm server startup log shows:
   - `Starting httpd at 127.0.0.1 on port 8080...`
3. Open Browserllama popup and select provider `MLX (OpenAI-compatible)`.
4. Keep endpoint at default or current saved value and wait for provider status refresh.
5. Current behavior: popup shows `MLX provider unavailable: No response from background process` and model dropdown remains `No models available` even though server is running.
6. Expected behavior: popup reports MLX available, model list loads, and send works with selected MLX model.

# How
0. Follow project LLM architectural rules and conventions from `.llm/rules/` (scope/edit boundaries, decision handling, testing expectations, JavaScript style) while implementing this fix.
1. Trace MLX provider probe flow end-to-end:
   - popup state refresh in `src/ui/popup/logic/provider-logic.js`
   - popup/background message bridge in `src/ui/popup/providers/mlx-provider.js` and `src/background/message-router-service.js`
   - MLX fetch/generate implementation in `src/background/mlx-service.js`
   - MLX endpoint defaults/storage in `src/lib/browserllama.js` and `src/ui/popup/services/popup-storage-service.js`
2. Identify root cause for false-unavailable state under running MLX server:
   - endpoint base mismatch (`http://host:port` vs `http://host:port/v1`)
   - incorrect path joining (`/models`, `/chat/completions`)
   - stale or invalid saved `mlxServer` value
   - weak parsing/validation of `GET /models` response.
3. Implement the smallest safe fix so MLX probe and generation use valid OpenAI-compatible URLs for both default and user-edited endpoints.
4. Improve user-visible MLX status details to include actionable endpoint/path failure context when probe fails.
5. Ensure provider switching and endpoint changes re-probe correctly without stale readiness state.
6. Add/extend tests for:
   - running MLX server reported as available with models returned
   - endpoint normalization/path joining across saved/default endpoint values
   - successful non-streaming MLX generation request after availability probe.

# Definition of Done
- With MLX running on local machine (as in repro), popup marks provider as available and loads models.
- MLX probe path and generation path are correct and consistent with configured endpoint.
- Saved MLX endpoint values are handled robustly (no false negatives due to formatting/path issues).
- Status text clearly indicates concrete failure reason when MLX probe fails.
- Existing Ollama and Chrome built-in flows remain unaffected.
- Automated tests covering the fixed MLX flow pass.
- No new dependencies are added.

# LLM context checklist
- [ ] Gather implementation context now while writing this task (relevant files, current behavior, constraints, dependencies).
- [ ] Record key context references in this task so implementation starts from concrete facts.
- [ ] At implementation start, re-check current context because code/spec may have changed.
- [ ] Review task evolution via git history (`git log --follow -- .llm/backlog/bugs/bugfix-3_fix_mlx_reachability_when_server_is_running.md`) before coding.
- [ ] Confirm latest task edit time from git (`git log -1 --format=%cI -- .llm/backlog/bugs/bugfix-3_fix_mlx_reachability_when_server_is_running.md`) before coding.
- [ ] Update plan based on any drift between recorded context and current repository state.

# LLM implementation checklist
- [ ] Re-read and apply `.llm/rules/` guidance before coding (`scope_and_edits.mdc`, `decisions.mdc`, `testing.mdc`, `javascript_style.mdc`).
- [ ] Inspect MLX endpoint default/normalization behavior in `src/lib/browserllama.js` and popup storage/service usage.
- [ ] Trace and document exact failing MLX probe URL/path from popup to background service.
- [ ] Implement minimal fix in MLX provider/service path handling and readiness logic.
- [ ] Update MLX status error text to surface actionable endpoint/path details.
- [ ] Add or update tests in `tests/unit/` and/or `tests/e2e/extension.spec.js` for served-but-unavailable MLX scenario.
- [ ] Run `pnpm test` after implementation.
- [ ] Run `pnpm run e2e` after implementation.
- [ ] Check test coverage, cover and fix what is required, run tests so they pass.
