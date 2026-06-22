import type { Validator, ValidationFinding } from '@forge/core';
import type { WaveSurvivalSpec } from './blueprint';

const err = (code: string, message: string): ValidationFinding => ({ code, severity: 'error', message });
const warn = (code: string, message: string): ValidationFinding => ({ code, severity: 'warn', message });

/**
 * Deterministic validators — the free "Judge floor". A constrained genre makes each of these a
 * cheap, exact check, which is exactly why a narrow target turns unstable generation into reliable
 * output (see docs/03). Codes line up with the failure taxonomy in index.ts.
 */
export const validators: Validator<WaveSurvivalSpec>[] = [
  {
    id: 'boots',
    description: 'Spec is well-formed enough to instantiate a game.',
    check(bp) {
      const f: ValidationFinding[] = [];
      const s = bp.spec;
      if (!s.player || s.player.hp <= 0) f.push(err('BOOT_NO_PLAYER', 'player.hp must be > 0'));
      if (!s.enemies?.length) f.push(err('BOOT_NO_ENEMIES', 'need at least one enemy type'));
      return f;
    },
  },
  {
    id: 'damageable',
    description: 'Player can kill enemies and enemies can threaten the player.',
    check(bp) {
      const f: ValidationFinding[] = [];
      const s = bp.spec;
      if (s.player.damage <= 0 || s.player.fireRate <= 0)
        f.push(err('DMG_PLAYER_NOOP', 'player deals no damage (damage and fireRate must be > 0)'));
      if (!s.enemies.some((e) => e.damage > 0))
        f.push(err('DMG_ENEMY_NOOP', 'no enemy can damage the player'));
      return f;
    },
  },
  {
    id: 'waves-escalate',
    description: 'Difficulty rises over time.',
    check(bp) {
      const e = bp.spec.waves.escalation;
      return e.hpMul > 1 || e.speedMul > 1 || e.countMul > 1
        ? []
        : [warn('WAVE_FLAT', 'waves do not escalate (all multipliers <= 1.0)')];
    },
  },
  {
    id: 'upgrades-reachable',
    description: 'At least one valid upgrade in the pool.',
    check(bp) {
      return bp.spec.upgrades?.length ? [] : [err('UPG_EMPTY', 'upgrade pool is empty')];
    },
  },
  {
    id: 'survivable-not-trivial',
    description: 'Rough fast-forward sim: neither instant death nor invincible.',
    check(bp) {
      const ttd = estimateTimeToDeathSec(bp.spec);
      if (ttd < 3) return [err('BAL_TOO_HARD', `player dies in ~${ttd.toFixed(1)}s (too hard)`)];
      if (ttd > 600) return [warn('BAL_TOO_EASY', `player effectively invincible (~${ttd.toFixed(0)}s)`)];
      return [];
    },
  },
];

/**
 * A deliberately rough, deterministic survivability estimate (no LLM, runs client-side too).
 * Good enough to catch degenerate balance; replace with a proper sim in the coding phase.
 */
export function estimateTimeToDeathSec(s: WaveSurvivalSpec): number {
  if (!s.enemies.length) return Infinity;
  const avgEnemyDmg = s.enemies.reduce((a, e) => a + e.damage, 0) / s.enemies.length;
  const incomingDps = (avgEnemyDmg * s.waves.baseCount) / s.waves.intervalSec;
  if (incomingDps <= 0) return Infinity;
  return s.player.hp / incomingDps;
}
