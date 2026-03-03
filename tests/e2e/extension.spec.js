const { test, expect, chromium } = require("@playwright/test");
const path = require("path");
const fs = require("fs");
const os = require("os");

const manifestPath = path.resolve(__dirname, "../../src/manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const popupPath = (manifest.action && manifest.action.default_popup) || "popup.html";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readExtensionIdFromProfile(userDataDir) {
  const extensionsDir = path.join(userDataDir, "Default", "Extensions");
  if (!fs.existsSync(extensionsDir)) {
    return null;
  }
  const candidates = fs
    .readdirSync(extensionsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => /^[a-p]{32}$/.test(name));
  return candidates[0] || null;
}

async function waitForExtensionId(userDataDir, timeoutMs = 15000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const extensionId = readExtensionIdFromProfile(userDataDir);
    if (extensionId) {
      return extensionId;
    }
    await delay(100);
  }
  throw new Error(
    "Timed out waiting for extension id in Chromium profile. Extension may not have loaded."
  );
}

async function waitForExtensionIdFromServiceWorker(context, timeoutMs = 10000) {
  let [serviceWorker] = context.serviceWorkers();
  if (!serviceWorker) {
    serviceWorker = await context.waitForEvent("serviceworker", { timeout: timeoutMs });
  }
  return new URL(serviceWorker.url()).host;
}

async function launchExtensionContext(extensionPath) {
  const isHeadless = process.env.HEADLESS === "1";
  const requestedChannel = process.env.PW_EXTENSION_CHANNEL || (isHeadless ? "chromium" : null);
  const channelsToTry = requestedChannel ? [requestedChannel] : [null];
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "browserllama-e2e-"));

  let lastError = null;
  for (const channel of channelsToTry) {
    let context = null;
    try {
      context = await chromium.launchPersistentContext(userDataDir, {
        ...(channel ? { channel } : {}),
        headless: isHeadless,
        ignoreDefaultArgs: ["--disable-extensions"],
        args: [
          `--disable-extensions-except=${extensionPath}`,
          `--load-extension=${extensionPath}`,
        ],
      });

      // Prefer service worker id resolution (matches original working flow),
      // then fall back to profile inspection in case worker discovery lags.
      let extensionId;
      try {
        extensionId = await waitForExtensionIdFromServiceWorker(
          context,
          isHeadless ? 20000 : 10000
        );
      } catch (serviceWorkerError) {
        extensionId = await waitForExtensionId(userDataDir, isHeadless ? 12000 : 7000);
      }
      return { context, extensionId, userDataDir };
    } catch (error) {
      lastError = error;
      if (context) {
        try {
          await context.close();
        } catch (_) {
          // ignore close errors during fallback
        }
      }
      console.warn(
        `Failed to launch Playwright persistent context with channel '${channel || "default"}':`,
        error && error.message ? error.message : error
      );
    }
  }

  fs.rmSync(userDataDir, { recursive: true, force: true });
  throw lastError || new Error("Failed to launch browser context for extension tests.");
}

async function closeExtensionContext(handle) {
  await handle.context.close();
  fs.rmSync(handle.userDataDir, { recursive: true, force: true });
}

test("answers questions based on current page content", async () => {
  test.setTimeout(60000);
  const extensionPath = path.resolve(__dirname, "../../src");
  const fixturePath = path.resolve(__dirname, "../fixtures/lorem.html");
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

test("answers using Chrome built-in provider when LanguageModel is available", async () => {
  test.setTimeout(60000);
  const extensionPath = path.resolve(__dirname, "../../src");
  const fixturePath = path.resolve(__dirname, "../fixtures/lorem.html");
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

  const contentPage = await context.newPage();
  await contentPage.goto(fixtureUrl);

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
  await popup.goto(`chrome-extension://${extensionId}/${popupPath}`);

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

  await closeExtensionContext(extension);
});

test("shows unsupported status when Chrome built-in AI is unavailable", async () => {
  test.setTimeout(30000);
  const extensionPath = path.resolve(__dirname, "../../src");

  const extension = await launchExtensionContext(extensionPath);
  const { context, extensionId } = extension;

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

  await popup.locator("#providerSelect").selectOption("chromeBuiltIn");
  await expect(popup.locator("#statusText")).toContainText("not available");
  await expect(popup.locator("#sendButton")).toBeDisabled();

  await popup.evaluate(async () => {
    await chrome.storage.sync.remove(["preferredProvider"]);
  });

  await closeExtensionContext(extension);
});

test("auto-switches to Chrome built-in when Ollama is offline", async () => {
  test.setTimeout(30000);
  const extensionPath = path.resolve(__dirname, "../../src");
  const fixturePath = path.resolve(__dirname, "../fixtures/lorem.html");
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
