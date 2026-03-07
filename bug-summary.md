# Bug Summary: MLX served but unavailable

## Ticket context
- User report: MLX server is running (`mlx_lm.server` on `127.0.0.1:8080`) but extension shows MLX not working.
- Popup evidence: `MLX provider unavailable: No response from background process`, model list remains empty.
- Task file created for review-first workflow:
  - `.llm/backlog/bugs/bugfix-3_fix_mlx_reachability_when_server_is_running.md`

## Root-cause analysis performed
- Traced end-to-end MLX flow:
  - popup provider logic -> popup MLX provider bridge -> background message router -> MLX service HTTP calls.
- Key weak points identified:
  - popup did not handle `chrome.runtime.lastError` for MLX messages, leading to generic/no-response behavior.
  - background MLX fetch/generate path lacked resilience for common local endpoint variants (`localhost` vs `127.0.0.1`, `/v1` path shape).
  - background message actions could fail before async promise chain depending on invocation timing/errors.

## Code changes made
- Updated `src/background/mlx-service.js`:
  - Added MLX endpoint normalization.
  - Added candidate endpoint fallback strategy:
    - `localhost` <-> `127.0.0.1`
    - root base and `/v1` variants where applicable
  - Added request timeout protection (8s) with explicit timeout message.
  - Applied fallback/retry logic to both:
    - `GET /models`
    - `POST /chat/completions`

- Updated `src/ui/popup/providers/mlx-provider.js`:
  - Added `chrome.runtime.lastError` handling for:
    - `getMlxModels`
    - `generateWithMlx`
  - Returns explicit background-process error details instead of silent/null response handling.

- Updated `src/background/message-router-service.js`:
  - Wrapped MLX actions with `Promise.resolve().then(...)` for safer async routing:
    - `getMlxModels`
    - `generateMlxResponse`

- Added new unit tests in `tests/unit/background-mlx-service.test.mjs`:
  - Verifies fallback probe from `localhost` to `127.0.0.1` for model listing.
  - Verifies fallback generation path for MLX completions.

- Updated bug task context file:
  - `.llm/backlog/bugs/bugfix-3_fix_mlx_reachability_when_server_is_running.md`
  - Included exact popup error string from screenshot.

## Test execution
- `pnpm test`: passed (all unit tests, including new MLX service tests).
- E2E status:
  - Full headless run previously showed one unrelated Ollama-availability failure in this environment.
  - MLX-targeted headless run failed to launch Chromium persistent extension context (environment/runtime issue), so MLX e2e could not be completed in this session.

## Current status
- Code-level fixes for MLX background-response reliability and endpoint robustness are implemented.
- Unit coverage for new MLX fallback behavior is in place and passing.
- Remaining validation gap: run headed e2e/manual repro in local Chrome extension runtime to confirm popup now transitions to available state with real `mlx_lm.server`.

## Files touched in this ticket
- `.llm/backlog/bugs/bugfix-3_fix_mlx_reachability_when_server_is_running.md`
- `src/background/mlx-service.js`
- `src/background/message-router-service.js`
- `src/ui/popup/providers/mlx-provider.js`
- `tests/unit/background-mlx-service.test.mjs`
