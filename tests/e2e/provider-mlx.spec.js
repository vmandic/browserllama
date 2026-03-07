const { test, expect } = require("@playwright/test");
const path = require("path");
const fs = require("fs");
const {
  closeExtensionContext,
  getPopupPath,
  launchExtensionContext,
} = require("../shared/e2e/extension-context.js");

const popupPath = getPopupPath();

test("checks MLX availability and re-probes after endpoint change", async () => {
  test.setTimeout(30000);
  const extensionPath = path.resolve(__dirname, "../../src");
  let mlxDefaultProbeCount = 0;
  let mlxCustomProbeCount = 0;

  const extension = await launchExtensionContext(extensionPath);
  const { context, extensionId } = extension;

  await context.route("http://localhost:8080/v1/models", async (route) => {
    mlxDefaultProbeCount += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [{ id: "mlx-default-model" }],
      }),
    });
  });

  await context.route("http://localhost:9000/v1/models", async (route) => {
    mlxCustomProbeCount += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [{ id: "mlx-custom-model" }],
      }),
    });
  });

  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/${popupPath}`);

  await popup.locator("#providerSelect").selectOption("mlx");
  await expect(popup.locator("#mlxEndpointField")).toBeVisible();
  await expect(popup.locator("#statusText")).toContainText("MLX provider available at http://localhost:8080/v1");
  await expect(popup.locator("#modelSelect")).toBeEnabled();
  await expect(popup.locator("#modelSelect option")).toContainText("mlx-default-model");
  expect(mlxDefaultProbeCount).toBeGreaterThanOrEqual(1);

  await popup.locator("#mlxServerInput").fill("http://localhost:9000/v1");
  await popup.locator("#mlxServerInput").dispatchEvent("change");

  await expect(popup.locator("#statusText")).toContainText("MLX provider available at http://localhost:9000/v1");
  await expect(popup.locator("#modelSelect option")).toContainText("mlx-custom-model");
  expect(mlxCustomProbeCount).toBeGreaterThanOrEqual(1);

  await popup.evaluate(async () => {
    await chrome.storage.sync.remove(["preferredProvider", "preferredModel", "mlxServer"]);
  });

  await closeExtensionContext(extension);
});

test("answers using MLX provider when server is available", async () => {
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

  await context.route("http://localhost:8080/v1/models", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [{ id: "mlx-community/Qwen2.5-7B-Instruct-4bit" }],
      }),
    });
  });

  await context.route("http://localhost:8080/v1/chat/completions", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        choices: [
          {
            message: { content: "MLX mock answer" },
          },
        ],
      }),
    });
  });

  const contentPage = await context.newPage();
  await contentPage.goto(fixtureUrl);

  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/${popupPath}`);

  await popup.evaluate(async (urlPrefix) => {
    const tabs = await chrome.tabs.query({});
    const fixtureTab = tabs.find((tab) => tab.title === "Fixture") || null;
    await chrome.storage.local.set({
      forceTabUrlPrefix: urlPrefix,
      forceTabId: fixtureTab && Number.isInteger(fixtureTab.id) ? fixtureTab.id : null,
    });
  }, fixtureUrl);

  await popup.locator("#providerSelect").selectOption("mlx");
  await expect(popup.locator("#statusText")).toContainText("MLX provider available");
  await popup.locator("#modelSelect").selectOption("mlx-community/Qwen2.5-7B-Instruct-4bit");
  await popup.locator("#userInput").fill("Summarize the current page in three words.");
  await popup.locator("#sendButton").click();
  await expect(popup.locator("#response")).toHaveText("MLX mock answer", { timeout: 10000 });
  await expect(popup.locator("#newPromptButton")).toBeVisible();

  await popup.evaluate(async () => {
    await chrome.storage.local.remove(["forceTabUrlPrefix", "forceTabId"]);
    await chrome.storage.sync.remove(["preferredProvider", "preferredModel", "mlxServer"]);
  });

  await closeExtensionContext(extension);
});

