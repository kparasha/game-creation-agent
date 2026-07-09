import type { GenrePack, FailureTaxonomy, ValidationFinding, Planner } from '@forge/core';
import { createModelPlanner } from '@forge/core';
import type { IdleTycoonSpec, IdleTycoonBlueprint } from './blueprint';
import { SCHEMA_VERSION } from './blueprint';
import { validators } from './validators';
import { manifest } from './manifest';
import { templates } from './templates/index';
import { regression } from './regression/cases';
import { planning } from './planner';
import { IDLE_RUNTIME_JS } from './runtime';

const failureTaxonomy: FailureTaxonomy = {
  BOOT_NO_CURRENCY: { label: 'No currency', repairHint: 'Define currency {name, symbol, start}.' },
  BOOT_NO_GENERATORS: {
    label: 'No generators',
    repairHint: 'Add at least one generator with baseCost/baseRate.',
  },
  GEN_BAD: { label: 'Bad generator', repairHint: 'Set generator baseCost and baseRate > 0.' },
  SOFTLOCK_NO_INCOME: {
    label: 'Soft-locked',
    repairHint: 'Set clickPower > 0 or make a generator affordable at start.',
  },
  COST_FLAT: { label: 'Costs do not grow', repairHint: 'Set each generator costGrowth above 1.0.' },
  UPG_BAD_TARGET: {
    label: 'Upgrade targets unknown generator',
    repairHint: 'Point upgrade.effect.target at a real generator id or "all".',
  },
  UPG_BAD_VALUE: { label: 'Bad upgrade value', repairHint: 'Set upgrade cost and effect.mul > 0.' },
  GOAL_TRIVIAL: { label: 'Trivial goal', repairHint: 'Raise the reach goal above the starting amount.' },
};

/** Shape check before the economy validators run (gate; mirrors the wave-survival pattern). */
function validateBlueprint(bp: IdleTycoonBlueprint): ValidationFinding[] {
  const f: ValidationFinding[] = [];
  if (bp.genre !== 'idle-tycoon')
    f.push({ code: 'SCHEMA_GENRE', severity: 'error', message: "genre must be 'idle-tycoon'" });
  const spec: unknown = (bp as { spec?: unknown }).spec;
  if (spec === null || typeof spec !== 'object')
    f.push({
      code: 'SCHEMA_NO_SPEC',
      severity: 'error',
      message: 'blueprint.spec is missing or not an object',
    });
  if (bp.schemaVersion !== SCHEMA_VERSION)
    f.push({ code: 'SCHEMA_VERSION', severity: 'warn', message: `expected schemaVersion ${SCHEMA_VERSION}` });
  return f;
}

export const idleTycoonPack: GenrePack<IdleTycoonSpec> = {
  id: 'idle-tycoon',
  schemaVersion: SCHEMA_VERSION,
  validateBlueprint,
  validators,
  failureTaxonomy,
  manifest,
  templates,
  regression,
  planning,
  webRuntime: IDLE_RUNTIME_JS,
};

/** Model-backed Planner for this genre — the generic core planner + a title deriver. */
export const idleTycoonPlanner: Planner<IdleTycoonSpec> = createModelPlanner<IdleTycoonSpec>({
  deriveTitle: (prompt, spec) => spec?.theme?.name ?? (prompt.slice(0, 40) || 'Idle Tycoon'),
});

export * from './blueprint';
export { validators, estimateTimeToFirstBuySec } from './validators';
export { manifest } from './manifest';
export { deterministicRepairer } from './repair';
export { IDLE_RUNTIME_JS } from './runtime';
export default idleTycoonPack;
