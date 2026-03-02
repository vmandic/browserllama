# Skill: Create task files (backlog)

Use this skill when you need to create a new backlog task under `.llm/backlog/` (bug/feature/chore/llm/tech) in this repository.

## Location and mapping

All task files must be created under `.llm/backlog/` at the project root.

| Task type | Directory | Filename prefix |
| --- | --- | --- |
| Bug | `.llm/backlog/bugs/` | `bugfix-` |
| Feature | `.llm/backlog/feats/` | `feat-` |
| Chore | `.llm/backlog/chores/` | `chore-` |
| LLM | `.llm/backlog/llm/` | `llm-` |
| Tech | `.llm/backlog/tech/` | `tech-` |

## Storage format

Tasks can be stored in one of two formats:

1. **Single Markdown file task**.
2. **Task directory package** (for attachments, images, assets, notes).

If using a task directory package:

- Directory name follows the same naming convention as task files, but without `.md`.
- A required primary Markdown file must exist at `<task-dir>/README.md`.
- Optional supporting files may be added in subfolders (for example: `assets/`, `images/`, `attachments/`).

## Naming convention

Task files must use these filename templates:

- `bugfix-1_<title>.md`
- `feat-1_<title>.md`
- `chore-1_<title>.md`
- `llm-1_<title>.md`
- `tech-1_<title>.md`

Task directories must use these directory name templates:

- `bugfix-1_<title>/`
- `feat-1_<title>/`
- `chore-1_<title>/`
- `llm-1_<title>/`
- `tech-1_<title>/`

Rules:

- Use only the mapped prefix for the selected task type.
- Use a positive integer number (`1`, `2`, ...); no zero-padding.
- Add a short title segment after the number.
- Title segment must be lowercase with words separated by underscores.
- Title segment must be at most 6 words.
- Keep the `.md` extension for file tasks.
- Do not add suffixes, extra words, or dates in the filename.

Sequence rules:

- Numbering is scoped by prefix within its task directory.
- New task uses the next available number for that prefix.
- Do not reuse or renumber existing task files.
- File and directory task formats share the same sequence space.

## File content templates

All task files are Markdown files and must include these sections:

- `# Created at (UTC)`
- `# Title`
- `# What`
- `# Why`
- `# How`
- `# Definition of Done`
- `# LLM context checklist`
- `# LLM implementation checklist`

Bug task exception:

- Bug task files must include `# How to reproduce`.
- For bug tasks, include `# How to reproduce` before `# How`.

### Standard template (feat/chore/llm/tech)

```markdown
# Created at (UTC)
2026-02-15T13:45:00Z

# Title
Initial UI and UX improvements

# What

# Why

# How

# Definition of Done

# LLM context checklist
- [ ] Gather implementation context now while writing this task (relevant files, current behavior, constraints, dependencies).
- [ ] Record key context references in this task so implementation starts from concrete facts.
- [ ] At implementation start, re-check current context because code/spec may have changed.
- [ ] Review task evolution via git history (`git log --follow -- <task-file>`) before coding.
- [ ] Confirm latest task edit time from git (`git log -1 --format=%cI -- <task-file>`) before coding.
- [ ] Update plan based on any drift between recorded context and current repository state.

# LLM implementation checklist
- [ ] Convert each item from `# How` into explicit implementation todo steps.
- [ ] Order todos by dependency and execution sequence.
- [ ] Include file-level targets for each todo when possible.
- [ ] Mark validation tasks required to satisfy `# Definition of Done`.
- [ ] Keep checklist task-specific (do not use only generic wording).
```

### Bug template

```markdown
# Created at (UTC)
2026-02-15T13:45:00Z

# Title
Fix popup status indicator encoding

# What

# Why

# How to reproduce

# How

# Definition of Done

# LLM context checklist
- [ ] Gather implementation context now while writing this task (relevant files, current behavior, constraints, dependencies).
- [ ] Record key context references in this task so implementation starts from concrete facts.
- [ ] At implementation start, re-check current context because code/spec may have changed.
- [ ] Review task evolution via git history (`git log --follow -- <task-file>`) before coding.
- [ ] Confirm latest task edit time from git (`git log -1 --format=%cI -- <task-file>`) before coding.
- [ ] Update plan based on any drift between recorded context and current repository state.

# LLM implementation checklist
- [ ] Convert each item from `# How` into explicit implementation todo steps.
- [ ] Order todos by dependency and execution sequence.
- [ ] Include file-level targets for each todo when possible.
- [ ] Mark validation tasks required to satisfy `# Definition of Done`.
- [ ] Keep checklist task-specific (do not use only generic wording).
- [ ] Check test coverage, cover and fix what is required, run tests so they pass.
```

## Creation workflow

1. Determine the task type (bug, feature, chore, llm, tech).
2. Map the type to directory and prefix using the table above.
3. Choose storage format: single Markdown file or task directory package.
4. Find existing files and directories with that prefix in that directory.
5. Pick the next available integer number.
6. Define a concise title of up to 6 words.
7. Convert the title to lowercase underscore format for filename suffix.
8. Create either:
   - `<prefix><number>_<title>.md`, or
   - `<prefix><number>_<title>/README.md` (required for directory tasks).
9. Set `# Created at (UTC)` to the current UTC timestamp in ISO 8601 format.
10. Fill required headings using the correct template.
11. If type is bug, include `# How to reproduce` before `# How`.

## Writing guidelines

- Keep content concise and actionable.
- `# Title`: short human-readable task title matching the filename suffix.
- `# Created at (UTC)`: creation timestamp only; do not overwrite later.
- `# What`: state the change clearly.
- `# Why`: explain expected value or problem solved.
- `# How`: list implementation steps in execution order.
- `# Definition of Done`: include measurable, verifiable outcomes.
- `# LLM context checklist`: generic context/discovery/recheck/git-history actions.
- `# LLM implementation checklist`: task-specific, concrete todo list derived from `# How`.
- For bugs, `# How to reproduce` should include deterministic repro steps.
- Do not add a manual "last edited" field; use git history as the source of truth for task edits.

## Security and path rules

- Never include absolute local filesystem paths in task files.
- Use repository-root-relative paths only (for example: `src/popup.html`, `.llm/backlog/feats/feat-1_initial_ui_ux_improvements.md`).
- Do not include user home paths, machine-specific paths, or OS-specific absolute roots (for example: `/absolute/path/...`, `D:\\absolute\\path\\...`).

## Validation checklist

- File is in the correct `.llm/backlog/<type>/` directory.
- Task is either:
  - file: `<prefix>-N_<title>.md`, or
  - directory: `<prefix>-N_<title>/README.md` exists.
- Filename title suffix uses lowercase words separated by underscores and is at most 6 words.
- Number is the next available for that prefix.
- `# Created at (UTC)` exists and is a valid ISO 8601 UTC timestamp.
- `# Title` heading exists and matches the filename title in readable form.
- Required headings exist exactly as defined.
- Bug tasks include `# How to reproduce` before `# How`.
- `# LLM context checklist` exists and includes context-gather + context-recheck + git-history checks.
- `# LLM implementation checklist` exists and includes task-specific implementation todos.
- No absolute local filesystem paths are present; only repo-relative paths are used.
