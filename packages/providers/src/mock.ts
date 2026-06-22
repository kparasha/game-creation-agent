import type { ModelProvider, StructuredGenRequest, ModelTier } from '@forge/core';

/** Returns a canned object regardless of input. For offline tests/demos and the regression harness. */
export function mockProvider(canned: unknown, opts: { id?: string; tier?: ModelTier } = {}): ModelProvider {
  return {
    id: opts.id ?? 'mock',
    tier: opts.tier ?? 'server',
    async generateStructured(_req: StructuredGenRequest): Promise<unknown> {
      return canned;
    },
  };
}
