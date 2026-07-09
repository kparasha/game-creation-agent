import type { Blueprint } from '@forge/core';

/** Typed spec for the idle-tycoon genre (idle/incremental "grow-a-X" clicker + tycoon). */

export interface Generator {
  id: string;
  name: string;
  /** cost of the first unit. */
  baseCost: number;
  /** cost multiplier per owned unit (>1 keeps the economy interesting). */
  costGrowth: number;
  /** currency/sec produced per owned unit. */
  baseRate: number;
}

export interface Upgrade {
  id: string;
  label: string;
  cost: number;
  /** target: a generator id or 'all'; kind: multiply that generator's rate or reduce its cost. */
  effect: { target: string; kind: 'rate' | 'cost'; mul: number };
}

export type WinCondition = { mode: 'endless' } | { mode: 'reach'; amount: number };

export interface IdleTycoonSpec {
  currency: { name: string; symbol: string; start: number };
  /** currency gained per manual click (the early-game bootstrap). */
  clickPower: number;
  generators: Generator[];
  upgrades: Upgrade[];
  win: WinCondition;
  theme: { name: string; palette: string[] };
}

export type IdleTycoonBlueprint = Blueprint<IdleTycoonSpec>;

export const SCHEMA_VERSION = 1;
