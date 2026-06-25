import type { Blueprint, InferenceTier } from './blueprint';
import type { Planner, PlanResult, GenerateRequest } from './agent';
import type { GenrePack } from './pack';
import type { ModelRouter, ModelTier } from './model';
import { AgentError } from './errors';

export interface ModelPlannerOptions<TSpec> {
  /** Derive a human title from the prompt + generated spec (genre-specific). */
  deriveTitle?: (prompt: string, spec: TSpec) => string;
}

function toModelTier(tier: InferenceTier): ModelTier {
  return tier === 'on-device' ? 'on-device' : 'server';
}

function defaultTitle(prompt: string): string {
  const words = prompt.trim().split(/\s+/).slice(0, 5).join(' ');
  if (!words) return 'Untitled';
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Genre-AGNOSTIC Planner backed by a ModelProvider. Reused by every genre — only the `planning`
 * schema (from the pack) and an optional title deriver differ. No model SDK here: the provider is
 * injected via ModelRouter, so server (Anthropic/OpenRouter/BYOM) and on-device share one code path.
 * The Judge validates the model's output afterward, so the Planner trusts shape and lets the loop
 * repair/fail-close as needed.
 */
export function createModelPlanner<TSpec>(opts: ModelPlannerOptions<TSpec> = {}): Planner<TSpec> {
  return {
    async plan(
      req: GenerateRequest,
      pack: GenrePack<TSpec>,
      models: ModelRouter,
    ): Promise<PlanResult<TSpec>> {
      const tier = toModelTier(req.tier);
      const provider = models.route(tier);

      let spec: TSpec;
      try {
        spec = (await provider.generateStructured({
          system: pack.planning.systemPrompt,
          user: req.prompt,
          jsonSchema: pack.planning.jsonSchema,
          tier,
        })) as TSpec;
      } catch (e) {
        if (e instanceof AgentError) throw e;
        throw new AgentError({
          code: 'PROVIDER_ERROR',
          stage: 'plan',
          message: `planner provider failed: ${e instanceof Error ? e.message : String(e)}`,
          retryable: true,
          cause: e,
        });
      }

      const title = opts.deriveTitle?.(req.prompt, spec) ?? defaultTitle(req.prompt);
      const blueprint: Blueprint<TSpec> = {
        genre: pack.id,
        schemaVersion: pack.schemaVersion,
        meta: { title, createdWith: req.tier, remixOf: req.remixOf?.meta.title },
        spec,
      };
      return { blueprint, rationale: `model-generated from prompt: "${req.prompt}"` };
    },
  };
}
