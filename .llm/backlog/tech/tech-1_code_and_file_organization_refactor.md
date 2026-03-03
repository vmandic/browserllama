# Created at (UTC)
2026-03-03T08:23:03Z

# Title
Code and file organization refactor

# What
Restructure popup UI and extension JavaScript into smaller, focused files with explicit module boundaries, while keeping behavior unchanged. Move popup assets into a dedicated UI structure under `src/ui/` and split oversized logic in `src/popup.js` and `src/background.js` by responsibility. Keep architecture simple: UI code (rendering + logic), services, and providers only. Add minimal, consistent JSDoc to touched functions so LLMs and developers can infer purpose, inputs, and outputs quickly. Create a general LLM architecture rule file so future code changes consistently follow the same file organization and naming conventions.

# Why
Current implementation mixes multiple concerns inside a few large files (`src/popup.js` 604 lines, `src/background.js` 307 lines, `src/popup.html` 286 lines with inline CSS). This increases review surface and regression risk for every change. A planned split with documented boundaries reduces change blast radius, makes test failures easier to localize, and improves future LLM-assisted edits via succinct JSDoc context.
Without a persistent architecture rule, future edits can drift back into monolith files and inconsistent naming. A dedicated `.llm/rules` architecture guideline makes the target structure enforceable for all future agent-driven changes.

# Current codebase analysis
- `src/popup.js` combines provider discovery, provider status state machine, DOM updates, request lifecycle, prompt policy checks, and event wiring in one file; most orchestration lives inside one `DOMContentLoaded` block (`src/popup.js:243` to `src/popup.js:604`).
- `src/popup.html` contains both structure and styling in one file; inline CSS occupies most of the file (`src/popup.html:7` to `src/popup.html:232`), reducing reuse and increasing merge conflicts.
- `src/background.js` mixes storage access, Ollama API access, icon/status management, tab tracking/content capture, and message routing.
- `tests/e2e/extension.spec.js` hardcodes popup route `popup.html`, so popup relocation requires synchronized test updates.
- `src/lib/ollama.js` is already a reusable shared helper module and should remain the shared boundary for prompt/payload helper logic.
- Recent prompt hardening is active and must be preserved:
  - `buildWebInterpreterPrompt` includes explicit role/scope/injection steering and short-refusal guidance.
  - `isUnexpectedPromptForWebInterpreter` blocks off-scope/injection-like requests, including script/code generation prompts.
  - Popup flow enforces app-level refusal before provider generation call.
  - `cleanResponseText` strips `<think>...</think>` output before rendering.
  - Unit tests in `tests/unit/ollama.test.mjs` cover guardrail prompt content and off-scope/injection checks.

# Prompt steering and injection invariants
- Keep canonical prompt steering and prompt-injection detection centralized in `src/lib/ollama.js` (single source of truth).
- Do not duplicate guardrail policy logic in provider modules; providers should only execute generation APIs.
- Preserve enforcement order in popup send flow:
  1. Validate provider readiness.
  2. Read page context.
  3. Run `isUnexpectedPromptForWebInterpreter`.
  4. Return `getOffScopeRefusalMessage` when blocked.
  5. Build guarded prompt via `buildWebInterpreterPrompt`.
  6. Call provider generation.
- Preserve response sanitation (`cleanResponseText`) for both Ollama and Chrome built-in provider paths.
- Treat guardrail behavior as non-negotiable during file moves; extraction is allowed, behavior change is not.

# Target module plan
```text
src/
  background.js                         # thin entry; imports background modules
  background/
    storage-service.js                  # getServerAddress/getPreferredModel/getPreferredProvider
    ollama-service.js                   # fetchOllamaTags + generate helpers
    icon-status-service.js              # icon/title updates + provider status refresh
    tab-context-service.js              # active tab tracking + page text capture
    message-router-service.js           # chrome.runtime.onMessage action routing
  ui/
    popup/
      popup.html                        # popup entry markup
      popup.css                         # moved styles from old inline <style>
      main.js                           # bootstrap + listener wiring
      dom.js                            # element queries + small DOM utility wrappers
      state.js                          # mutable popup state object and transitions
      components/
        status-view.js                  # setStatus/setChromeBuiltInStatus
        compose-view.js                 # compose/send button visibility + states
        response-view.js                # response/prompt rendering helpers
      providers/
        chrome-built-in-provider.js     # getBuiltInProvider/availability/generate
        ollama-provider.js              # getOllamaModels/generateWithOllama
      services/
        page-context-service.js         # getActivePageDataWithRetry/trimPageContext/isE2EModeEnabled
        popup-storage-service.js        # popup-side preference reads/writes
      logic/
        provider-logic.js               # provider selection + readiness loading
        prompt-logic.js                 # submit/cancel flow + prompt guardrail branch
```

# Function split map (from current files)
- Move popup provider API functions from `src/popup.js` (`getBuiltInProvider`, `getChromeBuiltInAvailability`, `generateWithChromeBuiltIn`, `getOllamaModels`, `generateWithOllama`) into `src/ui/popup/providers/*-provider.js`.
- Move popup view-only DOM setters (`setStatus`, `setChromeBuiltInStatus`, `setResponse`, `setPromptContext`, `setSendingState`, `setComposeMode`, `setResultsVisibility`, `setModelVisibility`, `setNewPromptButtonState`) into `src/ui/popup/components/`.
- Move popup page-context helpers (`delay`, `trimPageContext`, `getActivePageDataWithRetry`, `isE2EModeEnabled`) into `src/ui/popup/services/page-context-service.js`.
- Move popup state-machine logic (`setModelOptions`, `refreshControlsAvailability`, `loadOllamaProviderState`, `loadChromeBuiltInProviderState`, `refreshProviderState`) into `src/ui/popup/logic/provider-logic.js`.
- Move popup request lifecycle (`cancelActiveRequest`, submit handler branch logic, `completeResponseCycle`, `beginRequestCycle`, `restoreComposeAfterError`) into `src/ui/popup/logic/prompt-logic.js`.
- Keep prompt-policy helpers (`buildWebInterpreterPrompt`, `isLikelyPromptInjection`, `isUnexpectedPromptForWebInterpreter`, `getOffScopeRefusalMessage`, `cleanResponseText`) centralized in `src/lib/ollama.js` and wire logic modules to call these helpers.
- Split background responsibilities into dedicated files matching current function groups:
  - storage (`getServerAddress`, `getPreferredModel`, `getPreferredProvider`)
  - Ollama API (`fetchOllamaTags`, generate request helper)
  - icon/provider status (`setActiveIconAndTitle`, `checkOllamaStatus`, `refreshExtensionStatusIcon`)
  - tab capture (`addSelectionListener`, `getPageTextFromActiveTab`, tab tracking, `isExtensionUrl`)
  - action router (current `chrome.runtime.onMessage` handler branches).
- Naming directive:
  - Provider modules must end with `-provider.js`.
  - Service modules must end with `-service.js`.
  - Do not introduce controller layer naming/files.

# How
1. Establish baseline and constraints:
   - Confirm behavior and run baseline checks before refactor (`pnpm test`, `HEADLESS=1 pnpm run e2e`).
   - Freeze message action contract names (`getOllamaModels`, `generateResponse`, `getActivePageText`) and storage keys.
2. Move popup UI to `src/ui/popup/`:
   - Create `src/ui/popup/popup.html` and `src/ui/popup/popup.css`.
   - Move style block out of HTML into CSS.
   - Update popup script loading to module entry (`main.js`) with existing shared `src/lib/ollama.js`.
   - Update `src/manifest.json` `action.default_popup` to the new popup path.
3. Refactor popup JavaScript in slices (no behavior changes per slice):
   - Extract view/render helpers.
   - Extract provider integrations.
   - Extract page context + storage services.
   - Extract provider logic and prompt/request logic (simple logic modules, not controllers).
   - Keep `main.js` as thin bootstrap (DOM references + event wiring + logic composition).
   - Keep prompt policy evaluation and refusal behavior semantically identical to current flow.
4. Refactor background JavaScript in slices:
   - Introduce `src/background/` modules with `-service` naming consistency.
   - Keep `src/background.js` as a thin entry file that imports and initializes module logic.
   - Preserve current listener registration semantics and async `sendResponse` behavior.
5. Add minimal JSDoc signatures to touched functions:
   - One-line purpose.
   - `@param` tags for inputs.
   - `@returns` tag for non-void functions.
   - Keep docs succinct; no long narrative blocks.
6. Update tests/docs affected by path and file moves:
   - Update e2e popup navigation in `tests/e2e/extension.spec.js` to use the configured popup path.
   - Update docs that reference old popup file location if required.
   - Update root `README.md` with:
     - An updated source tree for `src/` and tests.
     - A short per-file purpose breakdown for code files in the new structure.
     - Notes on naming conventions (`-provider`, `-service`) and where UI logic vs rendering lives.
7. Create architecture rule for future changes:
   - Add `.llm/rules/architecture_and_file_organization.mdc` defining:
     - allowed module layers (UI rendering, UI logic, providers, services),
     - naming conventions (`*-provider.js`, `*-service.js`, view/logic naming),
     - boundaries/invariants (no provider-local prompt policy forks, keep prompt guardrails in `src/lib/ollama.js`),
     - expectations for thin entry files and small module responsibilities.
   - Validate `.cursor/rules` symlink remains valid after adding the new rule.
8. Validate final behavior:
   - Manual smoke: popup load, provider switch, send/cancel, Ollama offline state, Chrome built-in state.
   - Manual security smoke: off-scope prompt refusal, injection-style prompt refusal, and clean rendering without `<think>` tags.
   - Run `pnpm test` and `HEADLESS=1 pnpm run e2e`.

# Definition of Done
- Popup entry lives under `src/ui/popup/` and extension popup still loads correctly from `src/`.
- Previous monolith responsibilities are split into modules listed in this task, with unchanged user-facing behavior.
- `src/background.js` and popup entry logic are thin orchestrators; heavy logic resides in module files.
- Naming consistency is enforced (`*-provider.js` and `*-service.js`), with no controller layer files.
- Touched functions include concise JSDoc signatures (purpose + params + returns where applicable).
- Prompt steering and injection protection behavior matches pre-refactor semantics for both providers.
- Guardrail helpers remain centralized in `src/lib/ollama.js` and are not duplicated across modules.
- E2E popup-path assumptions are updated to match the new popup location contract.
- `README.md` includes an updated code tree and file purpose breakdown that matches final file layout.
- `.llm/rules/architecture_and_file_organization.mdc` exists and documents the agreed architecture, naming conventions, and module boundaries for ongoing work.
- Cursor integration remains valid (`.cursor/rules` still points to `.llm/rules`).
- Unit and e2e tests are run after implementation and pass.
- No new dependencies are added.

# LLM context checklist
- [x] Gather implementation context now while writing this task (relevant files, current behavior, constraints, dependencies).
- [x] Record key context references in this task so implementation starts from concrete facts.
- [ ] At implementation start, re-check current context because code/spec may have changed.
- [ ] Review task evolution via git history (`git log --follow -- <task-file>`) before coding.
- [ ] Confirm latest task edit time from git (`git log -1 --format=%cI -- <task-file>`) before coding.
- [ ] Update plan based on any drift between recorded context and current repository state.

# LLM implementation checklist
- [ ] Create `src/ui/popup/` structure and move popup markup + CSS (`popup.html`, `popup.css`).
- [ ] Update `src/manifest.json` popup entry path and verify extension loads popup without errors.
- [ ] Extract popup view helpers into `src/ui/popup/components/` modules.
- [ ] Extract popup provider integrations into `src/ui/popup/providers/*-provider.js` modules.
- [ ] Extract popup services (`page-context`, storage helpers) into `src/ui/popup/services/*-service.js`.
- [ ] Implement simple popup logic modules (`provider-logic.js`, `prompt-logic.js`) and keep `main.js` thin.
- [ ] Preserve guardrail call order in popup send flow (policy check/refusal before generation for both providers).
- [ ] Split `src/background.js` concerns into `src/background/*-service.js` modules and retain listener behavior.
- [ ] Update e2e popup URL usage in `tests/e2e/extension.spec.js` to match configured popup path.
- [ ] Add concise JSDoc to all touched functions (one-line intent + `@param` + `@returns` where needed).
- [ ] Keep prompt policy helpers centralized in `src/lib/ollama.js` and avoid provider-local policy forks.
- [ ] Ensure unit tests still assert guardrail prompt clauses and off-scope/injection blocking patterns.
- [ ] Add/adjust tests if needed for script/code-generation blocking and response cleaning behavior.
- [ ] Update `README.md` with the final code tree and per-file structure breakdown.
- [ ] Create `.llm/rules/architecture_and_file_organization.mdc` with enforceable architecture/file-organization directives.
- [ ] Confirm `.cursor/rules` symlink still resolves to `.llm/rules` after rule creation.
- [ ] Run `pnpm test`.
- [ ] Run `HEADLESS=1 pnpm run e2e`.
