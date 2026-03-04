# Created at (UTC)
2026-03-04T20:40:10Z

# Title
Add MLX model provider

# What
Add a new local MLX provider to the extension provider layer, with default server base URL `http://localhost:8080/v1`, so users can run Apple Silicon-optimized MLX models through the same app flow used by existing providers.

# Why
MLX is a strong local runtime on Apple Silicon and complements Ollama. Adding first-class MLX support expands local model options without cloud dependencies and keeps provider selection unified in one extension UI.

# How
1. Extend provider configuration/state to include `mlx` as a selectable provider and persist the MLX base URL with default `http://localhost:8080/v1`.
2. Implement `MLXProvider` request logic using OpenAI-compatible endpoints (`POST /chat/completions`, optional `POST /completions`, `GET /models`).
3. Map existing app prompt/message payloads to MLX OpenAI-compatible request/response schemas.
4. Add an explicit provider availability probe that calls `GET /models` when MLX is selected, on popup initialization, and before first request after endpoint change.
5. Define probe outcomes and UI behavior: mark provider as available on successful response with a valid models payload; mark unavailable with actionable message on timeout/network/schema errors.
6. Add model discovery for MLX via `GET /models` and surface discovered models in the provider/model selector.
7. Add connection/health checks and clear error states for common MLX server issues (offline server, invalid host/port, non-OpenAI-compatible responses).
8. Update popup/provider UI text and settings flow so MLX endpoint details are visible and editable.
9. Keep current Ollama and Chrome built-in providers behavior unchanged.

# Definition of Done
- Provider selector includes an MLX option.
- Default MLX endpoint is `http://localhost:8080/v1` for new configs.
- Provider availability is explicitly checked via `GET /models` and reflected in UI status (available/unavailable with reason).
- Chat/generate flow works against MLX server `POST /chat/completions` using OpenAI-compatible JSON.
- MLX model list loads from `GET /models` and is selectable in UI.
- MLX connection failures show actionable errors without breaking existing provider flows.
- Existing Ollama and Chrome providers remain functional with no regressions.
- No new dependencies are introduced.

# LLM context checklist
- [ ] Gather implementation context now while writing this task (relevant files, current behavior, constraints, dependencies).
- [ ] Record key context references in this task so implementation starts from concrete facts.
- [ ] At implementation start, re-check current context because code/spec may have changed.
- [ ] Review task evolution via git history (`git log --follow -- <task-file>`) before coding.
- [ ] Confirm latest task edit time from git (`git log -1 --format=%cI -- <task-file>`) before coding.
- [ ] Update plan based on any drift between recorded context and current repository state.

# LLM implementation checklist
- [ ] Inspect provider abstraction and add `mlx` provider type in `src/popup.js` and related state handling.
- [ ] Add MLX default endpoint constant (`http://localhost:8080/v1`) in provider configuration path.
- [ ] Implement MLX availability probe using `GET /models` triggered on provider select, popup init, and endpoint update.
- [ ] Add provider availability state (`available`/`unavailable`) and reason mapping for timeout/network/invalid-schema cases.
- [ ] Implement MLX API client methods for chat completion and model listing in provider logic.
- [ ] Add schema mapping between extension message format and OpenAI-compatible MLX payloads.
- [ ] Update popup UI controls in `src/popup.html` and `src/popup.js` for MLX provider selection and endpoint editing.
- [ ] Display MLX provider availability state in popup UI and prevent send when unavailable with clear recovery hint.
- [ ] Add robust MLX error handling paths in background/provider request code (`src/background.js`).
- [ ] Verify provider switching between Ollama, MLX, and Chrome built-in remains stable.
- [ ] Run `pnpm test`.
- [ ] Run `pnpm run e2e`.
