const { chromium } = require("@playwright/test");
const fs = require("fs");
const os = require("os");
const path = require("path");

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

function getPopupPath() {
    const manifestPath = path.resolve(__dirname, "../../../src/manifest.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    return (manifest.action && manifest.action.default_popup) || "popup.html";
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
                `Failed to launch Playwright persistent context with channel '${
                    channel || "default"
                }':`,
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

module.exports = {
    closeExtensionContext,
    getPopupPath,
    launchExtensionContext,
};

