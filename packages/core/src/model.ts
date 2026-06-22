/**
 * Model routing. Two server-relevant tiers (the third, client-deterministic, never calls a model).
 *  - 'on-device' → Apple Foundation Models / small local model. Free, private. NL → toggle deltas.
 *  - 'server'    → Claude API, or BYOM via OpenRouter. Paid. Generates net-new templates / sub-genres.
 * See docs/05 for the inference-tier economics.
 */
export type ModelTier = 'on-device' | 'server';

export interface StructuredGenRequest {
  system: string;
  user: string;
  /** JSON schema the output must conform to (guided generation). */
  jsonSchema: unknown;
  tier: ModelTier;
}

export interface ModelProvider {
  /** e.g. 'anthropic', 'openrouter:anthropic/claude', 'apple-foundation'. */
  id: string;
  tier: ModelTier;
  generateStructured(req: StructuredGenRequest): Promise<unknown>;
}

/** Routes to a provider. BYOM = inject a provider built from the user's own key. */
export interface ModelRouter {
  route(tier: ModelTier): ModelProvider;
}
