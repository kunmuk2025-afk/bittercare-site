type D1Result<T> = { results: T[] };

type D1Statement = {
  bind(...values: unknown[]): D1Statement;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<unknown>;
};

type D1Binding = {
  prepare(query: string): D1Statement;
  batch(statements: D1Statement[]): Promise<unknown>;
};

type R2ObjectBody = {
  body: ReadableStream;
  httpMetadata?: { contentType?: string };
};

type R2Binding = {
  put(key: string, value: ArrayBuffer, options?: unknown): Promise<unknown>;
  get(key: string): Promise<R2ObjectBody | null>;
  delete(key: string): Promise<unknown>;
};

export type RuntimeBindings = {
  DB: D1Binding;
  BUCKET: R2Binding;
  ADMIN_PASSWORD?: string;
};

type RuntimeGlobal = typeof globalThis & {
  __BITTERCARE_ENV?: RuntimeBindings;
};

export function setRuntimeEnv(env: RuntimeBindings) {
  (globalThis as RuntimeGlobal).__BITTERCARE_ENV = env;
}

export function getRuntimeEnv(): RuntimeBindings {
  const env = (globalThis as RuntimeGlobal).__BITTERCARE_ENV;

  if (!env?.DB || !env?.BUCKET) {
    throw new Error("BitterCare storage bindings are unavailable.");
  }

  return env;
}
