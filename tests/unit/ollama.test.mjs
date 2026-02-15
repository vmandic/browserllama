import { describe, it, expect } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  cleanResponseText,
  buildGeneratePayload,
  getDefaultServer,
} = require("../../src/lib/ollama.js");

describe("ollama helpers", () => {
  it("returns the default server url", () => {
    expect(getDefaultServer()).toBe("http://localhost:11434");
  });

  it("builds a generate payload", () => {
    const payload = buildGeneratePayload({
      model: "llama2",
      prompt: "hello",
      stream: false,
    });
    expect(payload).toEqual({
      model: "llama2",
      prompt: "hello",
      stream: false,
    });
  });

  it("cleans response text", () => {
    const text = "  <think>thoughts</think>Answer  ";
    expect(cleanResponseText(text)).toBe("Answer");
  });
});
