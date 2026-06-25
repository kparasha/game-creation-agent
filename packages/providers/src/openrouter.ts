import type { ModelProvider, StructuredGenRequest } from '@forge/core';
import { AgentError } from '@forge/core';

export interface OpenRouterOptions {
  apiKey: string;
  /** OpenRouter model slug, e.g. 'anthropic/claude-sonnet-4.6'. */
  model?: string;
  baseUrl?: string;
  /** Injectable for tests; defaults to global fetch. */
  fetchImpl?: typeof fetch;
}

/**
 * BYOM via OpenRouter — plain HTTP (no SDK), so it runs in Node and the browser. Uses guided
 * generation (response_format json_schema) against the pack's planning schema. Throws AgentError
 * (PROVIDER_ERROR) on any failure so the orchestrator fails closed.
 *
 * NOTE: not yet validated against the live API (no key in CI). Unit-tested via fetchImpl injection.
 */
export function openRouterProvider(opts: OpenRouterOptions): ModelProvider {
  const model = opts.model ?? 'anthropic/claude-sonnet-4.6';
  const baseUrl = opts.baseUrl ?? 'https://openrouter.ai/api/v1';
  const doFetch = opts.fetchImpl ?? fetch;

  return {
    id: `openrouter:${model}`,
    tier: 'server',
    async generateStructured(req: StructuredGenRequest): Promise<unknown> {
      const fail = (message: string, retryable = false, cause?: unknown): never => {
        throw new AgentError({ code: 'PROVIDER_ERROR', stage: 'plan', message, retryable, cause });
      };

      let res: Response;
      try {
        res = await doFetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${opts.apiKey}` },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: req.system },
              { role: 'user', content: req.user },
            ],
            response_format: {
              type: 'json_schema',
              json_schema: { name: 'blueprint_spec', strict: true, schema: req.jsonSchema },
            },
          }),
        });
      } catch (e) {
        return fail('openrouter request failed', true, e);
      }

      if (!res.ok) return fail(`openrouter responded ${res.status}`, res.status >= 500);

      const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const content = data.choices?.[0]?.message?.content;
      if (!content) return fail('openrouter returned an empty response');

      try {
        return JSON.parse(content) as unknown;
      } catch (e) {
        return fail('model returned invalid JSON', false, e);
      }
    },
  };
}
