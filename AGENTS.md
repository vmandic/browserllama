# Browserllama Agent Guide

This file is the single source of truth for how to work on this repo with Codex.

## Project Facts
- Chrome extension (Manifest V3).
- Talks to a local Ollama server at http://localhost:11434.
- Primary files:
  - background.js: status checks, context menu, message routing
  - popup.js: UI behavior and requests
  - popup.html: UI layout
  - manifest.json: extension metadata

## Goals
- Keep the extension stable and minimal.
- Prefer small, safe edits over refactors.
- Avoid adding dependencies unless explicitly requested.

## Workflow Rules
- Read the relevant files before editing.
- Make the smallest change that accomplishes the task.
- If behavior changes, briefly explain the change.
- If no tests exist, say "tests not run."

## Output Rules
- Summarize changes and list touched files.
- Use `rg` for search when needed.

## Decision Rules
- If a task is unclear, propose 2-3 options.
- If asked to improve prompts/agent behavior, update this file only.
