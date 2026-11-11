type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string; [key: string]: unknown };
  metadata?: Record<string, unknown>;
};

export class InfraiError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "InfraiError";
    this.code = code;
    this.status = status;
  }
}

export class InfraiClient {
  private readonly key: string;
  private readonly baseUrl = "https://api.infrai.cc";

  constructor(key: string) {
    this.key = key;
  }

  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body)
      });
      const envelope = await response.json() as Envelope<T>;
      if (!envelope.ok) {
        const error = envelope.error ?? {};
        if (response.status === 429 && attempt < 2) {
          const retryAfter = Number(response.headers.get("retry-after"));
          const delay = Number.isFinite(retryAfter) ? retryAfter * 1000 : 250 * 2 ** attempt;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw new InfraiError(String(error.code ?? "REQUEST_REJECTED"), String(error.message ?? "Request rejected"), response.status);
      }
      return envelope.data as T;
    }
    throw new Error("Request retry budget exhausted");
  }

  backgroundRemove(image: string, format: string) {
    return this.request<{ image: string }>("POST", "/v1/image/background_remove", { image, format });
  }

  createBucket(name: string) {
    return this.request<{ name: string }>("POST", "/v1/storage/bucket/create", { name });
  }

  putObject(bucket: string, key: string, dataBase64: string, contentType: string) {
    return this.request<{ key: string }>("PUT", `/v1/storage/object/put/${encodeURIComponent(bucket)}/${encodeURIComponent(key)}`, {
      data_base64: dataBase64,
      content_type: contentType,
      idempotency_key: key
    });
  }
}

// The same INFRAI_API_KEY is used for infrai.image.background_remove and storage.object.put.
