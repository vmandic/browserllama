# LLM Agent Guide

This file defines project-level AI conventions and should be respected by any coding agent operating in this repository.

## LLM instructions, rules, skills, commands, backlog, and lessons

- **Root**: All LLM-related configuration lives under **`.llm/`** at the project root.
- **Rules** (`.llm/rules/`) – always-on project conventions:
  - `scope_and_edits.mdc` – where to edit (src/, tests/), read-first, smallest change, list touched files.
  - `testing.mdc` – when to run `pnpm test` / `pnpm run e2e`, “tests not run” wording, no extra test deps.
  - `decisions.mdc` – unclear tasks → propose 2–3 options; don’t guess; agent/prompt changes → update `AGENTS.md`.
  - `javascript_style.mdc` – JS style and Chrome extension conventions for this repo.
  - `commits.mdc` – how to organize changes into meaningful commits; title style and allowed type prefixes.
- **Skills** (`.llm/skills/`) – reusable, opt-in workflows (each in its own directory with `SKILL.md`):
  - `create_task_files` – create backlog task files under `.llm/backlog/` using the project templates.
  - `create_llm_rule` – add or update a `.llm/rules/*.mdc` file.
  - `create_llm_command` – add a new `.llm/commands/*.mdc` command.
  - `create_lesson` (`create-lesson`) – create a `.llm/lessons/<number>-<topic>.md` file to capture reusable learnings from user chats/prompts.
- **Commands** (`.llm/commands/`) – invocable workflows for the AI assistant:
  - `review-code.mdc` – smart senior JS code review flow that applies the rules above and runs build/lint/tests.
- **Backlog** (`.llm/backlog/`) – project task specs grouped by type:
  - Subdirs: `bugs/`, `feats/`, `chores/`, `llm/`, `tech/` plus `.llm/backlog/README.md` describing the format.
- **Lessons** (`.llm/lessons/`) – reusable implementation learnings captured from user chats and prompts when it is useful for future agents.
  - Use the `create_lesson` skill (`.llm/skills/create_lesson/SKILL.md`) for filename conventions, required sections, and validation rules.

## Cursor integration (symlinks)

To ensure proper integration with Cursor:

- `.cursor/rules` must be a symlink to `.llm/rules`.
- `.cursor/skills` must be a symlink to `.llm/skills`.

Whenever adding a new rule under `.llm/rules/` or a new skill under `.llm/skills/`, ensure the `.cursor/` symlinks remain valid and up to date.

Do not duplicate files between `.llm/` and `.cursor/`. `.llm/` is the single source of truth.

## Project facts

- Chrome extension (Manifest V3). Extension root is **`src/`** (load this folder in chrome://extensions).
- Talks to a local Ollama server at http://localhost:11434.
- Primary files: `src/background.js`, `src/popup.js`, `src/popup.html`, `src/manifest.json`.

## Goals

- Keep the extension stable and minimal.
- Prefer small, safe edits over refactors.
- Avoid adding dependencies unless explicitly requested.

## When improving prompts or agent behavior

- Update **this file (AGENTS.md)** only, unless the user asks to change a specific file under `.llm/rules/` or `.llm/commands/`.
