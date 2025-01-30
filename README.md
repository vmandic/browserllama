# Browserllama

A chrome extension for integrating a local running Ollama server into your browser.

## Prerequisites

- Chrome browser
- Ollama server running locally
- At least one LLM model installed locally (from the supported models in this plugin, or you can edit the code and add your own)

## Features

- Send messages to local Ollama server and get responses
- Select LLM of own choice you installed locally

## Why

- I want to use Ollama on my browser and I want to run it all locally with the LLM model I can select.

## How does it look?

<img src="images/screenshot.jpg" alt="Screenshot of Browserllama" />

## Install

- Download the code and load it manually into chrome extensions (chrome://extensions/)
- Make sure your Ollama server is running and accessible at `http://localhost:11434/api/generate`
- You can also run CLI `ollama serve` to start the server (instead of running the actual application), but make sure you set up the environment variables for the server to run, i.e. to allow CORS for chrome-extension://[ID] (you can find out the ID after you install the extension), for example I added these to my .bashrc file:

```bashrc
export OLLAMA_ALLOW_ORIGINS=chrome-extension://moemjknfmlpkgamlcdnmpobaakdpindc
export OLLAMA_ORIGINS=chrome-extension://*
```

