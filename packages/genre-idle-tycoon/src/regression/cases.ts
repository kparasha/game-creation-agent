import type { RegressionCase, ValidationFinding } from '@forge/core';
import type { IdleTycoonBlueprint, IdleTycoonSpec } from '../blueprint';
import { validators } from '../validators';

const errorsOf = (bp: IdleTycoonBlueprint): ValidationFinding[] =>
  validators.flatMap((v) => v.check(bp) as ValidationFinding[]).filter((f) => f.severity === 'error');

export const regression: RegressionCase<IdleTycoonSpec>[] = [
  { id: 'garden', prompt: 'a cozy idle garden where I grow and sell plants', expect: errorsOf },
  { id: 'factory', prompt: 'a meme factory idle tycoon racing to a million memes', expect: errorsOf },
  { id: 'space-mine', prompt: 'an idle space-mining empire with escalating drills', expect: errorsOf },
];
