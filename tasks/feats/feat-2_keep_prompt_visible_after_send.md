# Created at (UTC)
2026-02-15T13:18:58Z

# Title
Keep prompt visible after send

# What
Update the popup UX so the user’s submitted prompt remains visible after sending and is shown above the response as contextual reference. After a response is shown, collapse prompt/model input controls and present a single "New prompt" action to start the next query.

# Why
The current flow clears the prompt input on send, which removes conversation context and makes it harder to verify what the response refers to. Keeping the prompt visible improves clarity and trust in results, especially for longer or similar-looking prompts. Collapsing editing controls after an answer reduces visual noise and keeps the popup focused on result reading in a small viewport.

# How
1. Add a dedicated "Last prompt" display area in the popup UI above the response block.
2. Capture the exact submitted prompt at send time and render it in the new display area.
3. After a response (success or error), collapse the prompt textarea and model selector, and show a "New prompt" button instead.
4. Implement "New prompt" so it restores prompt/model controls, focuses the prompt input, and preserves expected keyboard behavior.
5. Keep the existing input behavior stable (including keyboard send and selected-text prefill) while ensuring contextual prompt visibility.
6. Preserve current response rendering and error handling behavior without adding dependencies.
7. Add empty-state handling for first open (no submitted prompt yet) with a clear placeholder.
8. Manually verify layout and readability on common popup sizes, including long prompts and long responses.

# Definition of Done
- Submitted prompt remains visible in the popup after send.
- The visible prompt appears above the response area with clear labeling.
- After displaying an answer, prompt/model controls are hidden and replaced by a visible "New prompt" button.
- Clicking "New prompt" restores prompt/model controls and focuses the prompt field.
- First-open state shows an understandable placeholder when no prompt has been sent.
- Existing send flow, model selection, and response/error rendering continue to work.
- No new dependencies are introduced.
- Manual smoke check confirms behavior in the Chrome extension popup.

# LLM context checklist
- [ ] Gather implementation context from `src/popup.js` and `src/popup.html` (current send flow, UI regions, and state handling).
- [ ] Confirm where input is currently cleared and how response placeholder state is handled.
- [ ] Record constraints before coding (minimal edits, no dependency changes, preserve current behavior).
- [ ] Re-check current repository state before implementation in case task or popup files changed.
- [ ] Review task evolution via `git log --follow -- tasks/feats/feat-2_keep_prompt_visible_after_send.md`.
- [ ] Confirm latest edit timestamp via `git log -1 --format=%cI -- tasks/feats/feat-2_keep_prompt_visible_after_send.md`.
- [ ] Adjust implementation steps if repository context has drifted.

# LLM implementation checklist
- [ ] Add a prompt-context section in `src/popup.html` above the response section.
- [ ] Add styles in `src/popup.html` for prompt-context readability and overflow handling.
- [ ] Update send handler logic in `src/popup.js` to store and display the submitted prompt immediately on send.
- [ ] Add a compact post-response mode in `src/popup.html`/`src/popup.js` that hides prompt/model controls and shows a `New prompt` button.
- [ ] Wire `New prompt` behavior in `src/popup.js` to restore controls and focus prompt input.
- [ ] Ensure special-case answer paths and normal generation path both keep prompt context visible and enter compact post-response mode.
- [ ] Keep input/send interactions stable (Enter behavior, disabled state, and selected-text prefill).
- [ ] Manually validate with short and long prompts plus success/error responses, including repeated `New prompt` cycles.
- [ ] Confirm Definition of Done is satisfied without dependency changes.
