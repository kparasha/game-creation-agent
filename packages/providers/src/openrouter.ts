import type { ModelProvider } from '@forge/core';
import { openAICompatibleProvider } from './openai-compatible';

export interface OpenRouterOptions {
  apiKey: string;
  /** OpenRouter model slug, e.g. 'anthropic/claude-sonnet-4.6'. */
  model?: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

/**
 * BYOM via OpenRouter — a thin preset over `openAICompatibleProvider` (strict json_schema, with the
 * built-in auto-fallback to prompt mode for models that reject it). Runs in Node and the browser.
 * NOTE: not yet validated against the live API; unit-tested via fetchImpl injection.
 */
export function openRouterProvider(opts: OpenRouterOptions): ModelProvider {
  const model = opts.model ?? 'anthropic/claude-sonnet-4.6';
  return openAICompatibleProvider({
    apiKey: opts.apiKey,
    model,
    baseUrl: opts.baseUrl ?? 'https://openrouter.ai/api/v1',
    id: `openrouter:${model}`,
    structuredMode: 'json_schema',
    fetchImpl: opts.fetchImpl,
  });
}
