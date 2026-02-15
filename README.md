# Browserllama

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Tests](https://img.shields.io/badge/tests-vitest%20%2B%20playwright-0ea5a6)](#testing)
[![Chrome Extension](https://img.shields.io/badge/chrome-extension-MV3-1d4ed8)](https://developer.chrome.com/docs/extensions/mv3/intro/)

Local-first AI assistant for Chrome pages.
Browserllama lets you ask questions about the current tab using:

- Ollama running on your machine
- Chrome built-in AI (when supported by your Chrome build)

## Docs Hub

Use the public setup + fallback docs page:

- [Browserllama GitHub Pages](https://vmandic.github.io/browserllama/)

This page includes setup guides, troubleshooting, and FAQ links with section anchors.

## Screenshot

![Browserllama popup](src/images/screenshot.jpg)

## Features

- Prompt against the current page context.
- Provider switch between Ollama and Chrome built-in AI.
- Model selection for Ollama providers.
- Compact popup workflow with prompt/response history.
- Fallback docs link in the popup header.

## Quick Start

### 1) Clone and install

```bash
git clone https://github.com/vmandic/browserllama.git
cd browserllama
pnpm install
```

### 2) Load extension in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the `src/` folder.

### 3) Prepare provider

#### Option A: Ollama (recommended default)

1. Install Ollama from [ollama.com](https://ollama.com/).
2. Start the server:

```bash
ollama serve
```

3. Pull at least one model:

```bash
ollama pull deepseek-r1:8b
```

4. Open Browserllama popup and keep provider on **Ollama**.

#### Option B: Chrome built-in AI

1. Use a compatible Chrome build and account setup.
2. Enable required AI-related flags in `chrome://flags`.
3. Relaunch Chrome.
4. In popup provider dropdown, select **Chrome built-in AI**.

If the provider is unavailable, see the docs hub troubleshooting section:
[https://vmandic.github.io/browserllama/#troubleshooting-chrome-ai](https://vmandic.github.io/browserllama/#troubleshooting-chrome-ai)

## Configuration Notes

Browserllama defaults to `http://localhost:11434` for Ollama.

If you use `ollama serve` and need to allow extension origins, set environment vars (example):

```bash
export OLLAMA_ALLOW_ORIGINS="chrome-extension://<your-extension-id>"
export OLLAMA_ORIGINS="chrome-extension://*"
```

Reference discussion:
[https://github.com/ollama/ollama/issues/6489](https://github.com/ollama/ollama/issues/6489)

## Testing

### Unit tests

```bash
pnpm test
```

### E2E tests

Install Chromium for Playwright (first run only):

```bash
pnpm exec playwright install chromium
```

Run e2e (headed):

```bash
pnpm run e2e
```

Run e2e (headless):

```bash
HEADLESS=1 pnpm run e2e
```

## Roadmap Tasks

Backlog specs live under [`tasks/`](tasks/) and feature work items under [`tasks/feats/`](tasks/feats/).

## License

MIT. See [`LICENSE`](LICENSE).
