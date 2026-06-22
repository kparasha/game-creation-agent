import type { RegressionCase, ValidationFinding } from '@forge/core';
import type { WaveSurvivalSpec } from '../blueprint';
import { validators } from '../validators';

/** Returns only error-severity findings across all validators. */
function errors(bp: Parameters<RegressionCase<WaveSurvivalSpec>['expect']>[0]): ValidationFinding[] {
  const all = validators.flatMap((v) => v.check(bp) as ValidationFinding[]);
  return all.filter((f) => f.severity === 'error');
}

/**
 * Seed regression corpus for the AutoResearch outer loop (docs/03). The harness runs each prompt
 * through the Planner, then asserts `expect(blueprint)` is empty. Grow this aggressively over time.
 */
export const regression: RegressionCase<WaveSurvivalSpec>[] = [
  { id: 'cozy-garden', prompt: 'a cozy garden survival game where bugs attack my flowers', expect: errors },
  { id: 'hard-meme', prompt: 'an intense meme bullet-heaven that gets brutal fast', expect: errors },
  { id: 'space', prompt: 'survive endless waves of alien ships in space', expect: errors },
];
