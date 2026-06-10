# Graph Report - browserllama  (2026-06-10)

## Corpus Check
- 58 files · ~112,456 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 378 nodes · 448 edges · 38 communities (31 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8b44e254`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]

## God Nodes (most connected - your core abstractions)
1. `bootstrapPopup()` - 19 edges
2. `Privacy Policy for Browserllama` - 10 edges
3. `Browserllama` - 10 edges
4. `scripts` - 7 edges
5. `launchExtensionContext()` - 7 edges
6. `Bug Summary: MLX served but unavailable` - 7 edges
7. `LLM Agent Guide` - 6 edges
8. `fetchMlxModels()` - 5 edges
9. `generateWithMlx()` - 5 edges
10. `default_icon` - 5 edges

## Surprising Connections (you probably didn't know these)
- `fetchMlxModels()` --calls--> `getMlxServerAddress()`  [INFERRED]
  src/background/mlx-service.js → src/background/storage-service.js
- `generateWithMlx()` --calls--> `getMlxServerAddress()`  [INFERRED]
  src/background/mlx-service.js → src/background/storage-service.js
- `fetchOllamaTags()` --calls--> `getServerAddress()`  [INFERRED]
  src/background/ollama-service.js → src/background/storage-service.js
- `generateWithOllama()` --calls--> `getServerAddress()`  [INFERRED]
  src/background/ollama-service.js → src/background/storage-service.js
- `bootstrapPopup()` --calls--> `setModelOptions()`  [EXTRACTED]
  src/ui/popup/main.js → src/ui/popup/components/compose-view.js

## Import Cycles
- None detected.

## Communities (38 total, 7 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.10
Nodes (35): setComposeMode(), setModelOptions(), setModelVisibility(), setNewPromptButtonState(), setResultsVisibility(), setSendingState(), setPromptContext(), setResponse() (+27 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (32): { chromium }, closeExtensionContext(), delay(), fs, getPopupPath(), launchExtensionContext(), os, path (+24 more)

### Community 2 - "Community 2"
Cohesion: 0.10
Nodes (20): action, default_icon, default_popup, background, service_worker, 16, 192, 32 (+12 more)

### Community 3 - "Community 3"
Cohesion: 0.10
Nodes (19): 1) Clone and install, 2) Load extension in Chrome, 3) Prepare provider, Browserllama, Code Structure, Configuration Notes, Docs Hub, E2E caveat (headless) (+11 more)

### Community 4 - "Community 4"
Cohesion: 0.16
Nodes (13): buildGeneratePayload(), buildWebInterpreterPrompt(), cleanResponseText(), extractModelNames(), getDefaultMlxServer(), getDefaultServer(), getOffScopeRefusalMessage(), isLikelyPromptInjection() (+5 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (15): description, devDependencies, @playwright/test, vitest, name, packageManager, private, scripts (+7 more)

### Community 6 - "Community 6"
Cohesion: 0.22
Nodes (10): buildMlxServerCandidates(), fetchMlxModels(), fetchWithTimeout(), generateWithMlx(), normalizeMlxServer(), toMlxErrorMessage(), fetchOllamaTags(), generateWithOllama() (+2 more)

### Community 7 - "Community 7"
Cohesion: 0.15
Nodes (12): Created at (UTC), Current codebase analysis, Definition of Done, Function split map (from current files), How, LLM context checklist, LLM implementation checklist, Prompt steering and injection invariants (+4 more)

### Community 8 - "Community 8"
Cohesion: 0.18
Nodes (10): Changes to This Policy, Contact, Data Collection, Local Storage, Open Source Transparency, Overview, Page Content Processing, Privacy Policy for Browserllama (+2 more)

### Community 9 - "Community 9"
Cohesion: 0.20
Nodes (9): Created at (UTC), Definition of Done, How, How to reproduce, LLM context checklist, LLM implementation checklist, Title, What (+1 more)

### Community 10 - "Community 10"
Cohesion: 0.20
Nodes (9): Created at (UTC), Definition of Done, How, How to reproduce, LLM context checklist, LLM implementation checklist, Title, What (+1 more)

### Community 11 - "Community 11"
Cohesion: 0.20
Nodes (9): Created at (UTC), Definition of Done, How, How to reproduce, LLM context checklist, LLM implementation checklist, Title, What (+1 more)

### Community 12 - "Community 12"
Cohesion: 0.22
Nodes (8): Created at (UTC), Definition of Done, How, LLM context checklist, LLM implementation checklist, Title, What, Why

### Community 13 - "Community 13"
Cohesion: 0.22
Nodes (8): Created at (UTC), Definition of Done, How, LLM context checklist, LLM implementation checklist, Title, What, Why

### Community 14 - "Community 14"
Cohesion: 0.22
Nodes (8): Created at (UTC), Definition of Done, How, LLM context checklist, LLM implementation checklist, Title, What, Why

### Community 15 - "Community 15"
Cohesion: 0.22
Nodes (8): Created at (UTC), Definition of Done, How, LLM context checklist, LLM implementation checklist, Title, What, Why

### Community 16 - "Community 16"
Cohesion: 0.22
Nodes (8): Created at (UTC), Definition of Done, How, LLM context checklist, LLM implementation checklist, Title, What, Why

### Community 17 - "Community 17"
Cohesion: 0.22
Nodes (8): Created at (UTC), Definition of Done, How, LLM context checklist, LLM implementation checklist, Title, What, Why

### Community 18 - "Community 18"
Cohesion: 0.22
Nodes (8): Created at (UTC), Definition of Done, How, LLM context checklist, LLM implementation checklist, Title, What, Why

### Community 19 - "Community 19"
Cohesion: 0.22
Nodes (8): Created at (UTC), Definition of Done, How, LLM context checklist, LLM implementation checklist, Title, What, Why

### Community 20 - "Community 20"
Cohesion: 0.25
Nodes (7): Bug Summary: MLX served but unavailable, Code changes made, Current status, Files touched in this ticket, Root-cause analysis performed, Test execution, Ticket context

### Community 21 - "Community 21"
Cohesion: 0.25
Nodes (7): Actions taken, Agent model used, Backlog task reference, Create at (UTC), Lesson learned, Problem description, Recommendations

### Community 22 - "Community 22"
Cohesion: 0.25
Nodes (7): Actions taken, Agent model used, Backlog task reference, Create at (UTC), Lesson learned, Problem description, Recommendations

### Community 23 - "Community 23"
Cohesion: 0.25
Nodes (7): Actions taken, Agent model used, Backlog task reference, Create at (UTC), Lesson learned, Problem description, Recommendations

### Community 24 - "Community 24"
Cohesion: 0.29
Nodes (6): Cursor integration (symlinks), Goals, LLM Agent Guide, LLM instructions, rules, skills, commands, backlog, and lessons, Project facts, When improving prompts or agent behavior

### Community 27 - "Community 27"
Cohesion: 0.83
Nodes (3): refreshExtensionStatusIcon(), setActiveIconAndTitle(), setOfflineIconAndTitle()

## Knowledge Gaps
- **222 isolated node(s):** `cSpell.words`, `name`, `version`, `private`, `packageManager` (+217 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `cSpell.words`, `name`, `version` to the rest of the system?**
  _222 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.10372340425531915 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06829268292682927 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Community 5` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._