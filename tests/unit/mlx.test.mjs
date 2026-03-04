import { describe, it, expect } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { getDefaultMlxServer } = require("../../src/lib/browserllama.js");

describe("mlx helpers", () => {
  it("returns the default MLX server url", () => {
    expect(getDefaultMlxServer()).toBe("http://localhost:8080/v1");
  });
});
