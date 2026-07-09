import type { Repairer, RepairResult } from '@forge/core';
import type { IdleTycoonSpec } from './blueprint';

/** Deterministic, client-tier repairer for idle-tycoon (mirrors validators.ts codes; free, no LLM). */
export const deterministicRepairer: Repairer<IdleTycoonSpec> = {
  async repair(blueprint, report): Promise<RepairResult<IdleTycoonSpec>> {
    const bp = structuredClone(blueprint);
    const s = bp.spec;
    const codes = new Set(report.findings.map((f) => f.code));
    let changed = false;

    if (codes.has('BOOT_NO_CURRENCY')) {
      s.currency = { name: 'Coins', symbol: '🪙', start: 0 };
      changed = true;
    }
    if (codes.has('BOOT_NO_GENERATORS')) {
      s.generators = [{ id: 'gen1', name: 'Worker', baseCost: 10, costGrowth: 1.15, baseRate: 1 }];
      changed = true;
    }
    if (codes.has('GEN_BAD')) {
      for (const g of s.generators) {
        if (g.baseCost <= 0) g.baseCost = 10;
        if (g.baseRate <= 0) g.baseRate = 1;
      }
      changed = true;
    }
    if (codes.has('SOFTLOCK_NO_INCOME')) {
      s.clickPower = Math.max(1, s.clickPower);
      changed = true;
    }
    if (codes.has('COST_FLAT')) {
      for (const g of s.generators) g.costGrowth = Math.max(1.15, g.costGrowth);
      changed = true;
    }
    if (codes.has('UPG_BAD_TARGET')) {
      const ids = new Set(s.generators.map((g) => g.id));
      s.upgrades = s.upgrades.filter((u) => u.effect.target === 'all' || ids.has(u.effect.target));
      changed = true;
    }
    if (codes.has('GOAL_TRIVIAL') && s.win.mode === 'reach') {
      s.win.amount = Math.max(s.win.amount, (s.currency.start || 0) * 100 + 1000);
      changed = true;
    }

    return {
      blueprint: bp,
      changed,
      notes: changed ? `applied repairs for: ${[...codes].join(', ')}` : 'no applicable deterministic repair',
    };
  },
};
