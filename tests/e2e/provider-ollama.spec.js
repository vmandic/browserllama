const { test, expect } = require("@playwright/test");
const path = require("path");
const fs = require("fs");
const {
  closeExtensionContext,
  getPopupPath,
  launchExtensionContext,
} = require("../shared/e2e/extension-context.js");

const popupPath = getPopupPath();

test("answers questions based on current page content", async () => {
  test.setTimeout(60000);
  const extensionPath = path.resolve(__dirname, "../../src");
  const fixturePath = path.resolve(__dirname, "../shared/fixtures/lorem.html");
  const fixtureHtml = fs.readFileSync(fixturePath, "utf8");
  const preferredModels = ["deepseek-r1:1.5b"];
  const fixtureUrl = "http://fixture.local/";

  const extension = await launchExtensionContext(extensionPath);
  const { context, extensionId } = extension;

  await context.route(fixtureUrl, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/html",
      body: fixtureHtml,
    });
  });

  const selectedModel = preferredModels[0];

  let generateCallCount = 0;
  await context.route("http://localhost:11434/api/tags", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        models: [{ name: selectedModel }],
      }),
    });
  });

  await context.route("http://localhost:11434/api/generate", async (route) => {
    generateCallCount += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        response: generateCallCount === 1 ? "YES" : "5",
      }),
    });
  });

  const contentPage = await context.newPage();
  await contentPage.goto(fixtureUrl);

  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/${popupPath}`);

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
  await popup.locator("#providerSelect").selectOption("ollama");
  await expect(popup.locator("#modelSelect")).toBeVisible();
  await expect(popup.locator("#modelSelect")).toBeEnabled();
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

  await closeExtensionContext(extension);
});

test("keeps popup stable when Ollama is offline", async () => {
  test.setTimeout(30000);
  const extensionPath = path.resolve(__dirname, "../../src");

  const extension = await launchExtensionContext(extensionPath);
  const { context, extensionId } = extension;

  await context.route("http://localhost:11434/api/tags", async (route) => {
    await route.abort("connectionrefused");
  });

  const popup = await context.newPage();
  await popup.addInitScript(() => {
    try {
      delete globalThis.LanguageModel;
    } catch (error) {
      globalThis.LanguageModel = undefined;
    }
    globalThis.ai = undefined;
  });
  await popup.goto(`chrome-extension://${extensionId}/${popupPath}`);

  await expect(popup.locator("#statusText")).toContainText("Ollama is not reachable");
  await expect(popup.locator("#sendButton")).toBeDisabled();
  await expect(popup.locator("#modelSelect")).toBeDisabled();

  await closeExtensionContext(extension);
});

test("auto-switches to Chrome built-in when Ollama is offline", async () => {
  test.setTimeout(30000);
  const extensionPath = path.resolve(__dirname, "../../src");
  const fixturePath = path.resolve(__dirname, "../shared/fixtures/lorem.html");
  const fixtureHtml = fs.readFileSync(fixturePath, "utf8");
  const fixtureUrl = "http://fixture.local/";

  const extension = await launchExtensionContext(extensionPath);
  const { context, extensionId } = extension;

  await context.route(fixtureUrl, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/html",
      body: fixtureHtml,
    });
  });

  await context.route("http://localhost:11434/api/tags", async (route) => {
    await route.abort("connectionrefused");
  });

  const contentPage = await context.newPage();
  await contentPage.goto(fixtureUrl);

  const popup = await context.newPage();
  await popup.addInitScript(() => {
    class MockSession {
      async *promptStreaming() {
        yield "Fallback";
        yield " works";
      }
      async destroy() {}
    }

    globalThis.LanguageModel = {
      availability: async () => "available",
      create: async () => new MockSession(),
    };
  });
  await popup.goto(`chrome-extension://${extensionId}/${popupPath}`);

  await popup.evaluate(async (urlPrefix) => {
    const tabs = await chrome.tabs.query({});
    const fixtureTab = tabs.find((tab) => tab.title === "Fixture") || null;
    await chrome.storage.local.set({
      forceTabUrlPrefix: urlPrefix,
      forceTabId: fixtureTab && Number.isInteger(fixtureTab.id) ? fixtureTab.id : null,
    });
  }, fixtureUrl);

  await expect(popup.locator("#providerSelect")).toHaveValue("chromeBuiltIn");
  await expect(popup.locator("#statusText")).toContainText("Chrome built-in AI is ready");
  await expect(popup.locator("#sendButton")).toBeEnabled();

  await popup.locator("#userInput").fill("Summarize the current page in three words.");
  await popup.locator("#sendButton").click();
  await expect(popup.locator("#response")).toHaveText("Fallback works", { timeout: 10000 });

  await popup.evaluate(async () => {
    await chrome.storage.local.remove(["forceTabUrlPrefix", "forceTabId"]);
    await chrome.storage.sync.remove(["preferredProvider"]);
  });

  await closeExtensionContext(extension);
});

test("keeps manual ollama selection when offline after auto-switch", async () => {
  test.setTimeout(30000);
  const extensionPath = path.resolve(__dirname, "../../src");

  const extension = await launchExtensionContext(extensionPath);
  const { context, extensionId } = extension;

  await context.route("http://localhost:11434/api/tags", async (route) => {
    await route.abort("connectionrefused");
  });

  const popup = await context.newPage();
  await popup.addInitScript(() => {
    class MockSession {
      async *promptStreaming() {
        yield "unused";
      }
      async destroy() {}
    }

    globalThis.LanguageModel = {
      availability: async () => "available",
      create: async () => new MockSession(),
    };
  });
  await popup.goto(`chrome-extension://${extensionId}/${popupPath}`);

  await expect(popup.locator("#providerSelect")).toHaveValue("chromeBuiltIn");
  await popup.locator("#providerSelect").selectOption("ollama");
  await expect(popup.locator("#providerSelect")).toHaveValue("ollama");
  await expect(popup.locator("#statusText")).toContainText("Ollama is not reachable");
  await expect(popup.locator("#sendButton")).toBeDisabled();

  await popup.evaluate(async () => {
    await chrome.storage.sync.remove(["preferredProvider"]);
  });

  await closeExtensionContext(extension);
});

test("rechecks ollama models on provider switch after offline startup", async () => {
  test.setTimeout(30000);
  const extensionPath = path.resolve(__dirname, "../../src");
  let ollamaTagsRequestCount = 0;
  let ollamaOnline = false;

  const extension = await launchExtensionContext(extensionPath);
  const { context, extensionId } = extension;

  await context.route("http://localhost:11434/api/tags", async (route) => {
    ollamaTagsRequestCount += 1;
    if (!ollamaOnline) {
      await route.abort("connectionrefused");
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        models: [
          { name: "deepseek-r1:1.5b" },
          { name: "qwen2.5:3b" },
        ],
      }),
    });
  });

  const popup = await context.newPage();
  await popup.addInitScript(() => {
    class MockSession {
      async *promptStreaming() {
        yield "unused";
      }
      async destroy() {}
    }

    globalThis.LanguageModel = {
      availability: async () => "available",
      create: async () => new MockSession(),
    };
  });
  await popup.goto(`chrome-extension://${extensionId}/${popupPath}`);

  await expect(popup.locator("#providerSelect")).toHaveValue("chromeBuiltIn");
  await expect(popup.locator("#statusText")).toContainText("Chrome built-in AI is ready");

  ollamaOnline = true;
  await popup.locator("#providerSelect").selectOption("ollama");
  await expect(popup.locator("#providerSelect")).toHaveValue("ollama");
  await expect(popup.locator("#statusText")).toContainText("Connected to Ollama");
  await expect(popup.locator("#modelSelect")).toBeEnabled();
  await expect(popup.locator("#sendButton")).toBeEnabled();

  const modelOptions = await popup.locator("#modelSelect option").allTextContents();
  expect(modelOptions).toContain("deepseek-r1:1.5b");
  expect(modelOptions).toContain("qwen2.5:3b");
  expect(ollamaTagsRequestCount).toBeGreaterThanOrEqual(2);

  await popup.evaluate(async () => {
    await chrome.storage.sync.remove(["preferredProvider", "preferredModel"]);
  });

  await closeExtensionContext(extension);
});

