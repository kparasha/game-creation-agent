import type { Validator, ValidationFinding } from '@forge/core';
import type { IdleTycoonSpec } from './blueprint';

const err = (code: string, message: string): ValidationFinding => ({ code, severity: 'error', message });
const warn = (code: string, message: string): ValidationFinding => ({ code, severity: 'warn', message });

/**
 * Deterministic validators for the idle-tycoon economy — a different shape from the wave-survival
 * action checks (this is what proves the Genre Pack abstraction is real). All synchronous.
 */
export const validators: Validator<IdleTycoonSpec>[] = [
  {
    id: 'boots',
    description: 'Currency + at least one well-formed generator exist.',
    check(bp) {
      const f: ValidationFinding[] = [];
      const s = bp.spec;
      if (!s.currency) f.push(err('BOOT_NO_CURRENCY', 'currency is missing'));
      if (!s.generators?.length) f.push(err('BOOT_NO_GENERATORS', 'need at least one generator'));
      for (const g of s.generators ?? []) {
        if (g.baseCost <= 0 || g.baseRate <= 0)
          f.push(err('GEN_BAD', `generator '${g.id}' needs baseCost and baseRate > 0`));
      }
      return f;
    },
  },
  {
    id: 'no-softlock',
    description: 'The player can actually start earning (click income or affordable first generator).',
    check(bp) {
      const s = bp.spec;
      const cheapest = Math.min(...(s.generators ?? []).map((g) => g.baseCost));
      if (s.clickPower > 0 || s.currency?.start >= cheapest) return [];
      return [err('SOFTLOCK_NO_INCOME', 'no click income and cannot afford any generator — soft-locked')];
    },
  },
  {
    id: 'costs-grow',
    description: 'Generator costs escalate so the loop stays engaging.',
    check(bp) {
      return (bp.spec.generators ?? []).some((g) => g.costGrowth <= 1)
        ? [warn('COST_FLAT', 'a generator has costGrowth <= 1 (economy trivializes)')]
        : [];
    },
  },
  {
    id: 'upgrades-valid',
    description: 'Upgrades are affordable-shaped and target a real generator (or all).',
    check(bp) {
      const f: ValidationFinding[] = [];
      const ids = new Set((bp.spec.generators ?? []).map((g) => g.id));
      for (const u of bp.spec.upgrades ?? []) {
        if (u.effect.target !== 'all' && !ids.has(u.effect.target))
          f.push(err('UPG_BAD_TARGET', `upgrade '${u.id}' targets unknown generator '${u.effect.target}'`));
        if (u.cost <= 0 || u.effect.mul <= 0)
          f.push(warn('UPG_BAD_VALUE', `upgrade '${u.id}' has non-positive cost or mul`));
      }
      return f;
    },
  },
  {
    id: 'goal-reachable',
    description: 'A "reach" goal is above the starting amount (non-trivial).',
    check(bp) {
      const w = bp.spec.win;
      if (w.mode === 'reach' && w.amount <= (bp.spec.currency?.start ?? 0))
        return [warn('GOAL_TRIVIAL', 'reach goal is at or below the starting amount')];
      return [];
    },
  },
];

/** Rough, deterministic estimate of seconds to afford the cheapest generator by clicking (~3 cps). */
export function estimateTimeToFirstBuySec(s: IdleTycoonSpec): number {
  if (!s.generators.length) return Infinity;
  const cheapest = Math.min(...s.generators.map((g) => g.baseCost));
  if (s.currency.start >= cheapest) return 0;
  if (s.clickPower <= 0) return Infinity;
  return (cheapest - s.currency.start) / (s.clickPower * 3);
}
