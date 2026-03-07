const { test, expect } = require("@playwright/test");
const path = require("path");
const fs = require("fs");
const {
  closeExtensionContext,
  getPopupPath,
  launchExtensionContext,
} = require("../shared/e2e/extension-context.js");

const popupPath = getPopupPath();

test("answers using Chrome built-in provider when LanguageModel is available", async () => {
  test.setTimeout(60000);
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

