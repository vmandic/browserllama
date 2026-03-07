# Privacy Policy for Browserllama

Last updated: 2026

## Overview

Browserllama is a free and open-source browser extension created by **Vedran Mandić**.

The project was built with a strong focus on **user freedom, transparency, and privacy**.  
Browserllama does not collect, track, sell, or monetize user data.

The extension exists to help users analyze webpage content using **locally controlled AI models**.

Source code is publicly available:
https://github.com/vmandic/browserllama

---

## Data Collection

Browserllama **does not collect personal data**.

The extension does not:

- Track browsing activity
- Collect personal information
- Use analytics services
- Use advertising networks
- Send telemetry
- Store user data on remote servers

All processing happens locally within the user's browser or through **AI services explicitly chosen by the user**.

---

## Page Content Processing

When the user activates the extension, Browserllama reads the content of the **currently active webpage** in order to generate AI responses about that page.

This happens **only when triggered by the user**.

The content may then be sent to one of the following providers selected by the user:

- **Ollama** (local AI server)
- **MLX** (local AI server)
- **Chrome built-in AI APIs**

These services process the text to generate responses to the user’s prompt.

Browserllama itself does not store or transmit this data anywhere else.

---

## Local Storage

The extension uses browser storage only to save **user preferences**, such as:

- selected AI provider
- configured endpoint
- preferred model

These settings remain **only on the user's device**.

---

## Remote Communication

Browserllama may communicate with AI providers that the user explicitly configures.

Typical endpoints include:

- `http://localhost` (for local AI servers such as Ollama or MLX)

The extension does not connect to external services unless the user explicitly configures them.

Browserllama itself does not operate any backend servers.

---

## Open Source Transparency

Browserllama is an **open source project**.

This means anyone can:

- inspect the source code
- verify how the extension works
- build the extension themselves
- modify it for personal use

The goal of this project is to empower users with **privacy-respecting local AI tools**, not to collect data.

---

## User Control

Users remain in full control of:

- which AI provider is used
- which models are installed
- what prompts are sent
- whether the extension is used at all

The extension only operates when the user explicitly interacts with it.

---

## Changes to This Policy

If the privacy policy changes in the future, updates will be published in the project repository.

---

## Contact

If you have questions about this privacy policy, you can contact the project author:

**Vedran Mandić**

GitHub:  
https://github.com/vmandic