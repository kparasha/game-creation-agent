import type { ModelProvider } from '@forge/core';
import { openAICompatibleProvider } from './openai-compatible';

export interface ZenmuxOptions {
  apiKey: string;
  /** Defaults to the free GLM tier. */
  model?: string;
  fetchImpl?: typeof fetch;
}

/**
 * Zenmux preset (free GLM tier: `z-ai/glm-5.2-free`). Defaults to 'prompt' structured mode since free
 * / open models often don't honor `response_format`; lenient parsing handles fenced/prose JSON.
 * NOTE: routes through a third-party (Z.ai) — avoid for sensitive prompts.
 */
export function zenmuxProvider(opts: ZenmuxOptions): ModelProvider {
  const model = opts.model ?? 'z-ai/glm-5.2-free';
  return openAICompatibleProvider({
    apiKey: opts.apiKey,
    model,
    baseUrl: 'https://zenmux.ai/api/v1',
    id: `zenmux:${model}`,
    structuredMode: 'prompt',
    fetchImpl: opts.fetchImpl,
  });
}
