import type { Repairer, RepairResult } from '@forge/core';
import type { WaveSurvivalSpec } from './blueprint';

/**
 * Deterministic, client-tier repairer: maps validator failure codes → concrete spec mutations.
 * Free (no LLM), so it makes the repair loop real *today* (answers the JD's "repair" stage). The
 * LLM-based repairer is a later enhancement layer for failures this can't mechanically fix.
 * Codes mirror validators.ts / the pack's failureTaxonomy.
 */
export const deterministicRepairer: Repairer<WaveSurvivalSpec> = {
  async repair(blueprint, report): Promise<RepairResult<WaveSurvivalSpec>> {
    const bp = structuredClone(blueprint);
    const s = bp.spec;
    const codes = new Set(report.findings.map((f) => f.code));
    let changed = false;

    if (codes.has('BOOT_NO_PLAYER')) {
      s.player = { hp: 100, speed: 3, fireRate: 4, damage: 10 };
      changed = true;
    }
    if (codes.has('BOOT_NO_ENEMIES')) {
      s.enemies = [{ id: 'grunt', hp: 20, speed: 1.5, damage: 5, spawnWeight: 1 }];
      changed = true;
    }
    if (codes.has('DMG_PLAYER_NOOP')) {
      s.player.damage = Math.max(1, s.player.damage);
      s.player.fireRate = Math.max(1, s.player.fireRate);
      changed = true;
    }
    if (codes.has('DMG_ENEMY_NOOP') && s.enemies[0]) {
      s.enemies[0].damage = Math.max(1, s.enemies[0].damage || 5);
      changed = true;
    }
    if (codes.has('UPG_EMPTY')) {
      s.upgrades = [{ id: 'dmg', label: '+25% Damage', effect: { stat: 'playerDamage', mul: 1.25 } }];
      changed = true;
    }
    if (codes.has('WAVE_FLAT')) {
      s.waves.escalation.hpMul = Math.max(1.15, s.waves.escalation.hpMul);
      s.waves.escalation.countMul = Math.max(1.15, s.waves.escalation.countMul);
      changed = true;
    }
    if (codes.has('BAL_TOO_HARD')) {
      s.player.hp = Math.round(s.player.hp * 2);
      s.waves.baseCount = Math.max(1, Math.floor(s.waves.baseCount / 2));
      changed = true;
    }
    if (codes.has('BAL_TOO_EASY')) {
      for (const e of s.enemies) e.damage += 2;
      changed = true;
    }

    return {
      blueprint: bp,
      changed,
      notes: changed ? `applied repairs for: ${[...codes].join(', ')}` : 'no applicable deterministic repair',
    };
  },
};
