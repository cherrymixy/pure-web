import { afterEach, describe, expect, it, vi } from "vitest";
import { OpenAiClient, toDataUrl } from "./openai";

afterEach(() => vi.unstubAllGlobals());

describe("OpenAiClient", () => {
  it("sends the schema and images, parses the JSON answer", async () => {
    const fetch = vi.fn(async () => Response.json({ choices: [{ message: { content: '{"a":1}' } }] }));
    vi.stubGlobal("fetch", fetch);
    const r = await new OpenAiClient("k", "gpt-x").chatJson({ system: "s", user: "u", images: ["/9j/abc"], schema: { type: "object" }, model: "qwen3:8b" });
    expect(r).toMatchObject({ json: { a: 1 }, model: "gpt-x" });
    const body = JSON.parse((fetch.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body.model).toBe("gpt-x");
    expect(body.response_format.json_schema.schema).toEqual({ type: "object" });
    expect(body.messages[1].content[1].image_url.url).toBe("data:image/jpeg;base64,/9j/abc");
  });

  it("maps HTTP errors and empty answers to LlmError", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("bad key", { status: 401 })));
    await expect(new OpenAiClient("k").chatJson({ system: "s", user: "u", schema: {} })).rejects.toMatchObject({ kind: "invalid" });
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ choices: [{ message: { content: null, refusal: "no" } }] })));
    await expect(new OpenAiClient("k").chatJson({ system: "s", user: "u", schema: {} })).rejects.toThrow("no");
  });

  it("is unavailable without a key; keeps data URLs as they are", async () => {
    expect(await new OpenAiClient("").available()).toBe(false);
    expect(toDataUrl("data:image/png;base64,x")).toBe("data:image/png;base64,x");
    expect(toDataUrl("iVBORw")).toBe("data:image/png;base64,iVBORw");
  });
});
