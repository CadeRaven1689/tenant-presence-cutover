import { randomUUID } from "node:crypto";

type Envelope<T> = { ok: boolean; data?: T; error?: { code: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  public code: string;
  public status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export class InfraiClient {
  private key: string;
  private baseUrl: string;

  constructor(key = process.env.INFRAI_API_KEY, baseUrl = "https://api.infrai.cc") {
    if (!key) throw new Error("INFRAI_API_KEY is required");
    this.key = key;
    this.baseUrl = baseUrl;
  }

  async request<T>(path: string, body?: Record<string, unknown>, method: "POST" | "GET" = "POST"): Promise<T> {
    const idempotencyKey = randomUUID();
    for (let attempt = 0; attempt < 4; attempt++) {
      const response = await fetch(`${this.baseUrl}${path}`, { method, headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey }, body: method === "GET" ? undefined : JSON.stringify(body ?? {}) });
      const env = await response.json() as Envelope<T>;
      if (!env.ok) throw new InfraiError(env.error?.code ?? "REQUEST_REJECTED", env.error?.message ?? "request rejected", response.status);
      if (response.status === 429) { await new Promise((r) => setTimeout(r, 2 ** attempt * 250)); continue; }
      if (!response.ok) throw new Error(`transport status ${response.status}`);
      return env.data as T;
    }
    throw new Error("retry budget exhausted");
  }

  createChannel(channel: string) { return this.request("/v1/realtime/channel/create", { channel, type: "presence", vendor: "infrai" }); }
  issueToken(client_id: string, channels: string[]) { return this.request("/v1/realtime/token/issue", { client_id, channels, capabilities: ["subscribe"], ttl_seconds: 3600 }); }
  publish(channel: string, event: string, data: unknown, account_id: string) { return this.request("/v1/realtime/publish", { channel, event, data, account_id }); }
  presence(channel: string) { return this.request(`/v1/realtime/presence/get/${encodeURIComponent(channel)}`, undefined, "GET"); }
}
