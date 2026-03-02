# Skill: Define a new `.llm/commands/` command

Use this skill when you are asked to create a new LLM command file for this repository.

## Where commands live

- All new LLM commands must be defined under `.llm/commands/` at the project root.
- Do not define commands in other directories (not under `.llm/rules/` and not ad hoc elsewhere in the repo).
- If `.llm/commands/` does not exist, create it when adding the first command.

## Command file conventions

- One command per file so each command is easy to find and edit.
- Use descriptive, lowercase filenames with underscores (e.g. `run_tests.mdc`, `review_pr.mdc`). Use the `.mdc` extension for Cursor.
- Name the file after what the command does (e.g. `summarize_changes.mdc`, `add_unit_test.mdc`).

## Command file structure

Each file under `.llm/commands/` should:

1. Start with a clear title (a single `#` heading) that states the command’s purpose.
2. Define the trigger or name of the command (e.g. slash command name or short label) if your setup uses it.
3. Give specific, actionable instructions: what to do, in what order, and what to avoid.
4. Reference project context when needed (e.g. "Read `AGENTS.md` first", "Use `src/` as extension root").
5. Stay focused on a single workflow or task; split complex behavior into multiple commands if it helps.

## Writing style for commands

- Use concise, imperative language ("Run tests", "Read the file", "Do not modify manifest.json").
- Use bullet or numbered lists for steps and options.
- Prefer "do X" over "you should do X".
- Include constraints or guardrails (e.g. "Only touch files under `src/`", "Do not install new dependencies unless asked").

## When to add a new command

- Add a command when you have a recurring workflow that benefits from a single, reusable instruction set.
- Add a command when you want to standardize how agents perform a task (e.g. "how to add a new rule file", "how to define a new command").
- Do not add commands for one-off or highly context-specific tasks.

## Relation to rules

- Rules (in `.llm/rules/`) define ongoing conventions and constraints.
- Commands (in `.llm/commands/`) define discrete, invocable workflows.
- When a command depends on project conventions, reference the relevant rule file(s) by name (e.g. "Follow `javascript_style.mdc`").

## Example outline

```markdown
# Command: Run E2E and Report

Trigger: /e2e-report (or as configured)

1. Run `pnpm run e2e` (or `HEADLESS=1 pnpm run e2e` if headless).
2. If tests fail, list failing specs and the first error message.
3. Do not change code unless the user asks for a fix.
4. Keep output to a short summary and any failure details.
```
