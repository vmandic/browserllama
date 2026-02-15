const { test, expect, chromium } = require("@playwright/test");
const path = require("path");
const fs = require("fs");

test("answers questions based on current page content", async () => {
  test.setTimeout(60000);
  const extensionPath = path.resolve(__dirname, "../../src");
  const fixturePath = path.resolve(__dirname, "../fixtures/lorem.html");
  const fixtureHtml = fs.readFileSync(fixturePath, "utf8");
  const preferredModels = ["deepseek-r1:1.5b"];
  const fixtureUrl = "http://fixture.local/";

  const context = await chromium.launchPersistentContext("", {
    headless: process.env.HEADLESS === "1",
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });

  await context.route(fixtureUrl, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/html",
      body: fixtureHtml,
    });
  });

  const tagsResponse = await fetch("http://localhost:11434/api/tags");
  if (!tagsResponse.ok) {
    throw new Error("Ollama server is not reachable at http://localhost:11434.");
  }
  const tagsData = await tagsResponse.json();
  const availableModels = Array.isArray(tagsData.models)
    ? tagsData.models.map((model) => model.name)
    : [];
  const selectedModel = preferredModels[0];
  if (!availableModels.includes(selectedModel)) {
    throw new Error(
      `Required Ollama model not found: ${selectedModel}.`
    );
  }

  const contentPage = await context.newPage();
  await contentPage.goto(fixtureUrl);

  let [serviceWorker] = context.serviceWorkers();
  if (!serviceWorker) {
    serviceWorker = await context.waitForEvent("serviceworker");
  }

  const extensionId = new URL(serviceWorker.url()).host;
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);

  await expect(popup.locator("#sendButton")).toBeVisible();
  await popup.evaluate(async (urlPrefix) => {
    const tabs = await chrome.tabs.query({});
    const fixtureTab = tabs.find((tab) => tab.title === "Fixture") || null;
    await chrome.storage.local.set({
      e2eMode: true,
      forceTabUrlPrefix: urlPrefix,
      forceTabId: fixtureTab && Number.isInteger(fixtureTab.id) ? fixtureTab.id : null,
    });
  }, fixtureUrl);
  await popup.locator("#modelSelect").selectOption(selectedModel);

  await popup.locator("#userInput").fill(
    'can you tell me if the current page you see defines only lorem ipsum text, if so answer shortly only with "YES" else "I can not answer you if that is true."'
  );
  await popup.locator("#sendButton").click();
  await expect(popup.locator("#response")).toHaveText("YES", { timeout: 10000 });
  await expect(popup.locator("#lastPrompt")).toContainText(
    "can you tell me if the current page you see defines only lorem ipsum text"
  );
  await expect(popup.locator("#newPromptButton")).toBeVisible();

  await popup.locator("#newPromptButton").click();
  await expect(popup.locator("#sendButton")).toBeVisible();

  await popup.locator("#userInput").fill(
    'can you count the amount of paragraphs of lorem ipsum text in the current page, answer only with a precise number such as "1, 2 or 5" for example, if not answer "I can not answer that."'
  );
  await popup.locator("#sendButton").click();
  await expect(popup.locator("#response")).toHaveText("5", { timeout: 10000 });
  await popup.waitForTimeout(2000);
  await popup.evaluate(async () => {
    await chrome.storage.local.remove(["e2eMode", "forceTabUrlPrefix", "forceTabId"]);
  });

  await context.close();
});

test("answers using Chrome built-in provider when LanguageModel is available", async () => {
  test.setTimeout(60000);
  const extensionPath = path.resolve(__dirname, "../../src");
  const fixturePath = path.resolve(__dirname, "../fixtures/lorem.html");
  const fixtureHtml = fs.readFileSync(fixturePath, "utf8");
  const fixtureUrl = "http://fixture.local/";

  const context = await chromium.launchPersistentContext("", {
    headless: process.env.HEADLESS === "1",
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });

  await context.route(fixtureUrl, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/html",
      body: fixtureHtml,
    });
  });

  const contentPage = await context.newPage();
  await contentPage.goto(fixtureUrl);

  let [serviceWorker] = context.serviceWorkers();
  if (!serviceWorker) {
    serviceWorker = await context.waitForEvent("serviceworker");
  }

  const extensionId = new URL(serviceWorker.url()).host;
  const popup = await context.newPage();
  await popup.addInitScript(() => {
    class MockSession {
      async *promptStreaming() {
        yield "Mock";
        yield " answer";
      }
      async destroy() {}
    }

    globalThis.LanguageModel = {
      availability: async () => "available",
      create: async () => new MockSession(),
    };
  });
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);

  await expect(popup.locator("#sendButton")).toBeVisible();
  await popup.evaluate(async (urlPrefix) => {
    const tabs = await chrome.tabs.query({});
    const fixtureTab = tabs.find((tab) => tab.title === "Fixture") || null;
    await chrome.storage.local.set({
      forceTabUrlPrefix: urlPrefix,
      forceTabId: fixtureTab && Number.isInteger(fixtureTab.id) ? fixtureTab.id : null,
    });
  }, fixtureUrl);

  await popup.locator("#providerSelect").selectOption("chromeBuiltIn");
  await popup.locator("#userInput").fill("Summarize the current page in three words.");
  await popup.locator("#sendButton").click();
  await expect(popup.locator("#response")).toHaveText("Mock answer", { timeout: 10000 });
  await expect(popup.locator("#newPromptButton")).toBeVisible();

  await popup.evaluate(async () => {
    await chrome.storage.local.remove(["forceTabUrlPrefix", "forceTabId"]);
    await chrome.storage.sync.remove(["preferredProvider"]);
  });

  await context.close();
});
