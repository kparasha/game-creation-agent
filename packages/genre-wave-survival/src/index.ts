import type { GenrePack, FailureTaxonomy, ValidationFinding, Planner } from '@forge/core';
import { createModelPlanner } from '@forge/core';
import type { WaveSurvivalSpec, WaveSurvivalBlueprint } from './blueprint';
import { SCHEMA_VERSION } from './blueprint';
import { validators } from './validators';
import { manifest } from './manifest';
import { templates } from './templates/index';
import { regression } from './regression/cases';
import { planning } from './planner';

/** Maps validator codes → label + repair hint fed back to the Planner/Executor. */
const failureTaxonomy: FailureTaxonomy = {
  BOOT_NO_PLAYER: { label: 'No player', repairHint: 'Set player.hp to a positive value (e.g. 100).' },
  BOOT_NO_ENEMIES: { label: 'No enemies', repairHint: 'Add at least one enemy type with hp/speed/damage.' },
  DMG_PLAYER_NOOP: {
    label: 'Player deals no damage',
    repairHint: 'Set player.damage and player.fireRate > 0.',
  },
  DMG_ENEMY_NOOP: { label: 'Enemies harmless', repairHint: 'Give at least one enemy damage > 0.' },
  WAVE_FLAT: {
    label: 'No escalation',
    repairHint: 'Raise at least one waves.escalation multiplier above 1.0.',
  },
  UPG_EMPTY: { label: 'No upgrades', repairHint: 'Add 1–3 upgrades to the pool.' },
  BAL_TOO_HARD: { label: 'Too hard', repairHint: 'Lower enemy damage/count or raise player hp.' },
  BAL_TOO_EASY: { label: 'Too easy', repairHint: 'Raise enemy damage/count or escalation multipliers.' },
};

/** Lightweight shape check before the gameplay validators run. */
function validateBlueprint(bp: WaveSurvivalBlueprint): ValidationFinding[] {
  const f: ValidationFinding[] = [];
  if (bp.genre !== 'wave-survival')
    f.push({ code: 'SCHEMA_GENRE', severity: 'error', message: "genre must be 'wave-survival'" });
  if (bp.schemaVersion !== SCHEMA_VERSION)
    f.push({ code: 'SCHEMA_VERSION', severity: 'warn', message: `expected schemaVersion ${SCHEMA_VERSION}` });
  return f;
}

export const waveSurvivalPack: GenrePack<WaveSurvivalSpec> = {
  id: 'wave-survival',
  schemaVersion: SCHEMA_VERSION,
  validateBlueprint,
  validators,
  failureTaxonomy,
  manifest,
  templates,
  regression,
  planning,
};

/**
 * The model-backed Planner for this genre — the generic core planner specialised only by a title
 * deriver. Inject a ModelRouter (e.g. OpenRouter/BYOM) at call time; offline tests use mockProvider.
 */
export const waveSurvivalPlanner: Planner<WaveSurvivalSpec> = createModelPlanner<WaveSurvivalSpec>({
  deriveTitle: (prompt, spec) => spec?.theme?.name ?? (prompt.slice(0, 40) || 'Wave Survival'),
});

export * from './blueprint';
export { validators, estimateTimeToDeathSec } from './validators';
export { manifest } from './manifest';
export { deterministicRepairer } from './repair';
export default waveSurvivalPack;
