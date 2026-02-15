# Browserllama Agent Guide

## LLM instructions and rules

- All LLM instructions, rules, and commands live under **`.llm/`** at the project root.
- **Rules** (`.llm/rules/`) – follow these when working on the project:
  - **scope_and_edits.mdc** – where to edit (src/, tests/), read-first, smallest change, list touched files.
  - **testing.mdc** – when to run `pnpm test` and `pnpm run e2e`, "tests not run" when no tests, no extra test deps.
  - **decisions.mdc** – unclear tasks → propose 2–3 options; don’t guess; agent/prompt changes → update this file (AGENTS.md) only.
  - **javascript_style.mdc** – JS style and Chrome extension conventions for this repo.
  - **commits.mdc** – how to organize changes into meaningful commits; title up to 75 chars, type prefix (feat, fix, refactor, chore, docs, etc.).
  - **creating_llm_rules.mdc** – how to add or change rule files.
  - **creating_llm_commands.mdc** – how to add or change commands in `.llm/commands/`.

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
