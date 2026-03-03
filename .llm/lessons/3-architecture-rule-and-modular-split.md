# Create at (UTC)
2026-03-03T11:40:17Z

# Agent model used
GPT-5 Codex

# Backlog task reference
.llm/backlog/tech/tech-1_code_and_file_organization_refactor.md

# Problem description
Large monolithic popup/background files required a structural refactor, but without a persistent rule future edits could drift back to inconsistent organization and naming. Prompt-steering and injection-protection behavior also had to remain unchanged during module extraction.

# Lesson learned
For architecture refactors, define a permanent `.llm/rules` contract before or during implementation, then map file boundaries and naming directly to that rule. Security/guardrail logic must remain centralized (`src/lib/ollama.js`) and be treated as invariants during code moves.

# Actions taken
- Split popup into `src/ui/popup/` modules (views, logic, providers, services) and background into `src/background/*-service.js` modules.
- Added architecture rule file at `.llm/rules/architecture_and_file_organization.mdc` with naming and boundary constraints.
- Updated `src/manifest.json` popup path and made e2e tests read popup route from manifest.
- Updated `README.md` with a single annotated ASCII tree for file-purpose documentation.
- Added testing-rule caveat in `.llm/rules/testing.mdc` to prefer headed e2e and treat headless instability as environment caveat.

# Recommendations
- Keep entry files thin (`src/background.js`, `src/ui/popup/main.js`) and reject new monolith growth.
- Enforce naming consistency (`*-provider.js`, `*-service.js`) in all new modules.
- When popup path changes, keep tests manifest-driven rather than hardcoded paths.
- Treat guardrail flow order as non-negotiable: policy check/refusal before provider generation.
