import type { ModelProvider, ModelRouter, ModelTier } from '@forge/core';

/** Build a ModelRouter from per-tier providers. BYOM = pass a provider built from the user's key. */
export function createModelRouter(providers: Partial<Record<ModelTier, ModelProvider>>): ModelRouter {
  return {
    route(tier) {
      const provider = providers[tier];
      if (!provider) throw new Error(`no model provider configured for tier '${tier}'`);
      return provider;
    },
  };
}
