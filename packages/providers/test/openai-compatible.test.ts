import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AgentError } from '@forge/core';
import type { StructuredGenRequest } from '@forge/core';
import { openAICompatibleProvider, openRouterProvider, parseJsonLenient } from '@forge/providers';

const req: StructuredGenRequest = {
  system: 'you make games',
  user: 'a haunted survival game',
  jsonSchema: { type: 'object', properties: { theme: { type: 'string' } } },
  tier: 'server',
};

interface Call {
  url: string;
  body: Record<string, unknown>;
}
function fakeFetch(responses: { status: number; content?: string }[]): {
  fn: typeof fetch;
  calls: Call[];
} {
  const calls: Call[] = [];
  let i = 0;
  const fn = (async (url: string, init?: RequestInit) => {
    calls.push({ url: String(url), body: JSON.parse(String(init?.body ?? '{}')) });
    const r = responses[Math.min(i, responses.length - 1)]!;
    i++;
    return {
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      json: async () => ({ choices: [{ message: { content: r.content } }] }),
    } as Response;
  }) as unknown as typeof fetch;
  return { fn, calls };
}

test('json_schema mode sends response_format and returns parsed JSON', async () => {
  const { fn, calls } = fakeFetch([{ status: 200, content: JSON.stringify({ theme: 'haunted' }) }]);
  const p = openAICompatibleProvider({ apiKey: 'k', model: 'm', baseUrl: 'http://x/v1', fetchImpl: fn });
  const out = (await p.generateStructured(req)) as { theme: string };
  assert.equal(out.theme, 'haunted');
  assert.equal((calls[0]!.body.response_format as { type: string }).type, 'json_schema');
});

test('auto-falls back to prompt mode when the model rejects response_format (400)', async () => {
  const { fn, calls } = fakeFetch([
    { status: 400 }, // schema rejected
    { status: 200, content: JSON.stringify({ theme: 'cave' }) }, // retry succeeds
  ]);
  const p = openAICompatibleProvider({ apiKey: 'k', model: 'm', baseUrl: 'http://x/v1', fetchImpl: fn });
  const out = (await p.generateStructured(req)) as { theme: string };
  assert.equal(out.theme, 'cave');
  assert.equal(calls.length, 2);
  assert.equal(calls[1]!.body.response_format, undefined); // no response_format on the retry
  assert.match(String((calls[1]!.body.messages as { content: string }[])[0]!.content), /JSON schema/i);
});

test('lenient parsing tolerates markdown fences and surrounding prose', async () => {
  const { fn } = fakeFetch([{ status: 200, content: 'Sure!\n```json\n{"theme":"forest"}\n```\nEnjoy.' }]);
  const p = openAICompatibleProvider({
    apiKey: 'k',
    model: 'm',
    baseUrl: 'http://x/v1',
    structuredMode: 'prompt',
    fetchImpl: fn,
  });
  const out = (await p.generateStructured(req)) as { theme: string };
  assert.equal(out.theme, 'forest');
});

test('a 5xx surfaces as a retryable AgentError', async () => {
  const { fn } = fakeFetch([{ status: 503 }]);
  const p = openAICompatibleProvider({ apiKey: 'k', model: 'm', baseUrl: 'http://x/v1', fetchImpl: fn });
  await assert.rejects(
    () => p.generateStructured(req),
    (e: unknown) => e instanceof AgentError && e.code === 'PROVIDER_ERROR' && e.retryable,
  );
});

test('openRouterProvider is a preset over the generic provider', async () => {
  const { fn } = fakeFetch([{ status: 200, content: JSON.stringify({ theme: 'x' }) }]);
  const p = openRouterProvider({ apiKey: 'k', fetchImpl: fn });
  assert.ok(p.id.startsWith('openrouter:'));
  const out = (await p.generateStructured(req)) as { theme: string };
  assert.equal(out.theme, 'x');
});

test('parseJsonLenient handles bare, fenced, and prose-wrapped JSON', () => {
  assert.deepEqual(parseJsonLenient('{"a":1}'), { a: 1 });
  assert.deepEqual(parseJsonLenient('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(parseJsonLenient('here: {"a":1} ok'), { a: 1 });
  assert.equal(parseJsonLenient('not json at all'), undefined);
});
