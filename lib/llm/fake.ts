import { LlmError, type ChatJsonRequest, type ChatJsonResponse, type LlmClient } from "./client";

export type FakeReply = string | LlmError | ((req: ChatJsonRequest) => string | LlmError);

/** Scripted client for tests: returns replies in order and records every request. */
export class FakeClient implements LlmClient {
  readonly calls: ChatJsonRequest[] = [];

  constructor(
    private readonly replies: FakeReply[],
    private readonly up = true,
  ) {}

  async available(): Promise<boolean> {
    return this.up;
  }

  async chatJson(req: ChatJsonRequest): Promise<ChatJsonResponse> {
    this.calls.push(req);
    if (req.signal?.aborted) throw new LlmError("canceled", "Canceled");
    const next = this.replies.shift();
    if (next === undefined) throw new LlmError("network", "FakeClient: no reply scripted");
    const reply = typeof next === "function" ? next(req) : next;
    if (reply instanceof LlmError) throw reply;
    let json: unknown;
    try {
      json = JSON.parse(reply);
    } catch {
      throw Object.assign(new LlmError("invalid", "Response is not JSON"), { raw: reply });
    }
    return { raw: reply, json, ms: 1, model: req.model ?? "fake" };
  }
}
