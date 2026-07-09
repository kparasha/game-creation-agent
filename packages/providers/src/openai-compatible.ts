import type { ModelProvider, StructuredGenRequest } from '@forge/core';
import { AgentError } from '@forge/core';

/**
 * One provider for every OpenAI-compatible chat endpoint (OpenRouter, Zenmux, Groq, a self-hosted
 * LiteLLM gateway, …). Structured output is coaxed three ways, with an automatic fallback so weak /
 * free / open models that don't support `response_format` still work:
 *   - 'json_schema' — strict schema (best fidelity). On a 4xx that rejects it, auto-retries in 'prompt'.
 *   - 'json_object' — generic JSON mode.
 *   - 'prompt'      — embed the schema in the system message, no response_format.
 * The response is always parsed leniently (tolerates ```json fences / surrounding prose).
 */
export type StructuredMode = 'json_schema' | 'json_object' | 'prompt';

export interface OpenAICompatibleOptions {
  apiKey: string;
  model: string;
  baseUrl: string;
  /** Provider id prefix for telemetry/attribution. */
  id?: string;
  /** Extra headers (e.g. OpenRouter's HTTP-Referer / X-Title). */
  headers?: Record<string, string>;
  structuredMode?: StructuredMode;
  /** Injectable for tests; defaults to global fetch. */
  fetchImpl?: typeof fetch;
}

const SCHEMA_UNSUPPORTED = Symbol('schema-unsupported');

export function openAICompatibleProvider(opts: OpenAICompatibleOptions): ModelProvider {
  const { apiKey, model, baseUrl } = opts;
  const doFetch = opts.fetchImpl ?? fetch;
  const mode: StructuredMode = opts.structuredMode ?? 'json_schema';

  const fail = (message: string, retryable = false, cause?: unknown): never => {
    throw new AgentError({
      code: 'PROVIDER_ERROR',
      stage: 'plan',
      message: `${model}: ${message}`,
      retryable,
      cause,
    });
  };

  async function call(
    req: StructuredGenRequest,
    useResponseFormat: boolean,
  ): Promise<unknown | typeof SCHEMA_UNSUPPORTED> {
    const system = useResponseFormat
      ? req.system
      : `${req.system}\n\nReturn ONLY a single JSON object matching this JSON schema — no prose, no markdown fences:\n${JSON.stringify(req.jsonSchema)}`;

    const body: Record<string, unknown> = {
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: req.user },
      ],
    };
    if (useResponseFormat) {
      body.response_format =
        mode === 'json_object'
          ? { type: 'json_object' }
          : {
              type: 'json_schema',
              json_schema: { name: 'blueprint_spec', strict: true, schema: req.jsonSchema },
            };
    }

    let res: Response;
    try {
      res = await doFetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}`, ...opts.headers },
        body: JSON.stringify(body),
      });
    } catch (e) {
      return fail('request failed', true, e);
    }

    if (!res.ok) {
      // Many free/open models reject response_format → signal an auto-fallback to prompt mode.
      if (useResponseFormat && [400, 404, 422, 501].includes(res.status)) return SCHEMA_UNSUPPORTED;
      return fail(`responded ${res.status}`, res.status >= 500);
    }

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return fail('empty response');
    const parsed = parseJsonLenient(content);
    if (parsed === undefined) return fail('response was not valid JSON');
    return parsed;
  }

  return {
    id: opts.id ?? `openai:${model}`,
    tier: 'server',
    async generateStructured(req) {
      let out = await call(req, mode !== 'prompt');
      if (out === SCHEMA_UNSUPPORTED) out = await call(req, false); // retry without response_format
      return out;
    },
  };
}

/** Parse JSON, tolerating ```json fences or JSON embedded in surrounding prose. */
export function parseJsonLenient(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    /* try harder below */
  }
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  if (fenced) {
    try {
      return JSON.parse(fenced.trim());
    } catch {
      /* try harder below */
    }
  }
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch {
      /* give up */
    }
  }
  return undefined;
}
