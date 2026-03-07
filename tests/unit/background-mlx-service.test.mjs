import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
globalThis.self = globalThis;
require("../../src/background/mlx-service.js");

describe("background mlx service", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it("tries loopback /v1 when server is root localhost", async () => {
        const fetchMock = vi
            .fn()
            .mockRejectedValueOnce(new TypeError("fetch failed"))
            .mockResolvedValueOnce({
                ok: false,
                status: 404,
                statusText: "Not Found",
            })
            .mockRejectedValueOnce(new TypeError("fetch failed"))
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ data: [{ id: "mlx-loopback-v1-model" }] }),
            });
        globalThis.fetch = fetchMock;

        const result = await globalThis.BrowserllamaMlxService.fetchMlxModels(
            async () => "http://localhost:8080"
        );

        expect(result).toEqual({
            isRunning: true,
            models: ["mlx-loopback-v1-model"],
            error: null,
        });
        expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
            "http://localhost:8080/models",
            "http://127.0.0.1:8080/models",
            "http://localhost:8080/v1/models",
            "http://127.0.0.1:8080/v1/models",
        ]);
    });

    it("falls back from localhost to 127.0.0.1 for model probe", async () => {
        const fetchMock = vi
            .fn()
            .mockRejectedValueOnce(new TypeError("fetch failed"))
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ data: [{ id: "mlx-community/Qwen2.5-7B-Instruct-4bit" }] }),
            });
        globalThis.fetch = fetchMock;

        const result = await globalThis.BrowserllamaMlxService.fetchMlxModels(
            async () => "http://localhost:8080/v1"
        );

        expect(result).toEqual({
            isRunning: true,
            models: ["mlx-community/Qwen2.5-7B-Instruct-4bit"],
            error: null,
        });
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:8080/v1/models");
        expect(fetchMock.mock.calls[1][0]).toBe("http://127.0.0.1:8080/v1/models");
    });

    it("falls back from localhost to 127.0.0.1 for generation", async () => {
        const fetchMock = vi
            .fn()
            .mockRejectedValueOnce(new TypeError("fetch failed"))
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [
                        {
                            message: {
                                content: "MLX mock answer",
                            },
                        },
                    ],
                }),
            });
        globalThis.fetch = fetchMock;

        const result = await globalThis.BrowserllamaMlxService.generateWithMlx(
            async () => "http://localhost:8080/v1",
            "mlx-community/Qwen2.5-7B-Instruct-4bit",
            "Hello from test"
        );

        expect(result).toEqual({ response: "MLX mock answer" });
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:8080/v1/chat/completions");
        expect(fetchMock.mock.calls[1][0]).toBe("http://127.0.0.1:8080/v1/chat/completions");
    });
});
