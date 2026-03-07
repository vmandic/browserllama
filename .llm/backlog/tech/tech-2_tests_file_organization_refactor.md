# Created at (UTC)
2026-03-07T09:56:09Z

# Title
Tests file organization refactor

# What
Reorganize automated tests into a clearer file structure grouped by concern (unit, integration/e2e, and shared helpers) while preserving current test behavior and coverage intent.

# Why
Current and future tests are harder to navigate when files, fixtures, and helpers are not consistently placed. A predictable structure lowers maintenance overhead, shortens debugging time, and makes adding new tests safer.

# How
1. Audit current test files and support utilities under `tests/` to map what belongs to unit, e2e, or shared utilities.
2. Define a target folder layout and naming rules for test files, fixtures, and helper modules.
3. Move test files and helper files incrementally to the new layout without changing assertions or behavior.
4. Update imports, path references, and any test runner configuration that depends on old locations.
5. Update test documentation so contributors know where to place new tests.
6. Run the test suite to verify no regressions after the file moves.

# Definition of Done
- Test files are organized in a documented, consistent directory structure.
- Shared helpers/fixtures are centralized and not duplicated across test groups.
- All affected imports and configuration paths are updated and working.
- `pnpm test` passes after reorganization.
- `HEADLESS=1 pnpm run e2e` passes after reorganization.
- No test behavior changes beyond path and organization updates.

# LLM context checklist
- [ ] Gather implementation context now while writing this task (relevant files, current behavior, constraints, dependencies).
- [ ] Record key context references in this task so implementation starts from concrete facts.
- [ ] At implementation start, re-check current context because code/spec may have changed.
- [ ] Review task evolution via git history (`git log --follow -- <task-file>`) before coding.
- [ ] Confirm latest task edit time from git (`git log -1 --format=%cI -- <task-file>`) before coding.
- [ ] Update plan based on any drift between recorded context and current repository state.

# LLM implementation checklist
- [ ] Inventory current files in `tests/unit`, `tests/e2e`, and test helper locations.
- [ ] Propose and apply a final target directory map for test files and helpers.
- [ ] Move files to the target structure with minimal diff scope (moves + import path updates).
- [ ] Update any path-dependent config or scripts used by test commands.
- [ ] Update docs that describe test layout and contribution expectations.
- [ ] Run `pnpm test` and confirm pass.
- [ ] Run `HEADLESS=1 pnpm run e2e` and confirm pass.
