# Created at (UTC)
2026-02-15T18:53:08Z

# Title
GitHub pages fallback docs site

# What
Create a GitHub Pages-ready single-page website with one `index.html` that presents Browserllama as a modern product page and fallback support hub. Add a compact docs link in the extension popup header so users can open this page directly from the UI.

# Why
Users need a public, easy-to-share fallback page when setup issues happen (for example Ollama not installed, Chrome built-in AI flags not enabled, or local model/API readiness confusion). A polished page also improves onboarding and documentation discoverability.

# How
1. Create a single `index.html` at repository root with a complete one-page product layout (hero, features, setup, troubleshooting, FAQ, footer).
2. Make the page visually modern (large typography, clear sections, strong visual hierarchy) and responsive for desktop/mobile.
3. Add SEO essentials: semantic heading structure, meta description, canonical, social tags, and descriptive title.
4. Include internal navigation links that use browser anchors (`#...`) for major sections and FAQ entries.
5. Add FAQ content focused on real Browserllama questions: installing Ollama, selecting a model, extension loading, and Chrome built-in AI requirements.
6. Add troubleshooting guides for:
   - Ollama not installed / not running / wrong server.
   - Chrome built-in AI not available, including how to enable required Chrome experiments/flags.
7. Add a small top subtext/link in `src/popup.html` (and any needed JS behavior) that points users to the docs page with concise wording.
8. Keep extension behavior stable and avoid unrelated refactors.

# Definition of Done
- A single `index.html` exists and can be used for GitHub Pages.
- The page is a modern, stylized single-pager with clear sections and responsive layout.
- SEO metadata and semantic structure are present.
- FAQ and troubleshooting sections cover Ollama setup failures and Chrome built-in AI experiments setup.
- Section headers are anchor-navigable via URL hash links.
- Popup includes a compact docs/help link at the top.
- No new dependencies are introduced.

# LLM context checklist
- [ ] Gather implementation context now while writing this task (relevant files, current behavior, constraints, dependencies).
- [ ] Record key context references in this task so implementation starts from concrete facts.
- [ ] At implementation start, re-check current context because code/spec may have changed.
- [ ] Review task evolution via git history (`git log --follow -- <task-file>`) before coding.
- [ ] Confirm latest task edit time from git (`git log -1 --format=%cI -- <task-file>`) before coding.
- [ ] Update plan based on any drift between recorded context and current repository state.

# LLM implementation checklist
- [ ] Create and style root `index.html` single-page content sections.
- [ ] Add SEO/meta/canonical/Open Graph tags in `index.html`.
- [ ] Add anchor navigation links and matching section IDs.
- [ ] Write Browserllama-specific FAQ and troubleshooting copy.
- [ ] Add popup top-link UI to docs in `src/popup.html`.
- [ ] Verify popup still renders and existing controls remain unchanged.
- [ ] Run `pnpm test`.
- [ ] Run `pnpm run e2e`.
