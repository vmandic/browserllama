const { test, expect } = require("@playwright/test");
const path = require("path");
const {
  closeExtensionContext,
  getPopupPath,
  launchExtensionContext,
} = require("../shared/e2e/extension-context.js");

const popupPath = getPopupPath();

test("opens popup and renders base UI", async () => {
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

  await expect(popup.locator("main.popup")).toBeVisible();
  await expect(popup.locator("#userInput")).toBeVisible();
  await expect(popup.locator("#providerSelect")).toBeVisible();
  await expect(popup.locator("#sendButton")).toBeVisible();

  await closeExtensionContext(extension);
});

