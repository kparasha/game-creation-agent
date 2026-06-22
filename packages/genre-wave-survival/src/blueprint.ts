import type { Blueprint } from '@forge/core';

/** The typed spec for the wave-survival genre (Vampire-Survivors-shaped). */

export interface EnemyType {
  id: string;
  hp: number;
  speed: number;
  damage: number;
  /** relative spawn frequency. */
  spawnWeight: number;
}

export type UpgradeStat = 'playerDamage' | 'playerSpeed' | 'playerHp' | 'fireRate';

export interface Upgrade {
  id: string;
  label: string;
  effect: { stat: UpgradeStat; mul: number };
}

export type WinCondition = { mode: 'endless' } | { mode: 'survive'; seconds: number };

export interface WaveSurvivalSpec {
  player: { hp: number; speed: number; fireRate: number; damage: number };
  enemies: EnemyType[];
  waves: {
    intervalSec: number;
    baseCount: number;
    /** per-wave multipliers — escalation is what keeps a run tense. */
    escalation: { hpMul: number; speedMul: number; countMul: number };
  };
  upgrades: Upgrade[];
  win: WinCondition;
  theme: { name: string; palette: string[] };
}

export type WaveSurvivalBlueprint = Blueprint<WaveSurvivalSpec>;

export const SCHEMA_VERSION = 1;
