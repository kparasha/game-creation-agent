import type { BlueprintTemplate } from '@forge/core';
import type { IdleTycoonSpec } from '../blueprint';
import { SCHEMA_VERSION } from '../blueprint';

export const templates: BlueprintTemplate<IdleTycoonSpec>[] = [
  {
    id: 'grow-a-garden',
    name: 'Grow a Garden',
    description: 'Cozy idle-grow: click to plant, then let sprouts, planters, and greenhouses earn for you.',
    blueprint: {
      genre: 'idle-tycoon',
      schemaVersion: SCHEMA_VERSION,
      meta: { title: 'Grow a Garden', theme: 'cozy garden', createdWith: 'client-deterministic' },
      spec: {
        currency: { name: 'Seeds', symbol: '🌱', start: 0 },
        clickPower: 1,
        generators: [
          { id: 'sprout', name: 'Sprout', baseCost: 10, costGrowth: 1.15, baseRate: 1 },
          { id: 'planter', name: 'Planter', baseCost: 120, costGrowth: 1.17, baseRate: 8 },
          { id: 'greenhouse', name: 'Greenhouse', baseCost: 1500, costGrowth: 1.2, baseRate: 55 },
        ],
        upgrades: [
          {
            id: 'fertilizer',
            label: 'Fertilizer (+100% Sprout rate)',
            cost: 500,
            effect: { target: 'sprout', kind: 'rate', mul: 2 },
          },
          {
            id: 'automation',
            label: 'Automation (+50% all rates)',
            cost: 5000,
            effect: { target: 'all', kind: 'rate', mul: 1.5 },
          },
        ],
        win: { mode: 'endless' },
        theme: { name: 'Garden', palette: ['#6db36b', '#f4d35e', '#8d5a2b'] },
      },
    },
  },
  {
    id: 'brainrot-factory',
    name: 'Brainrot Factory',
    description: 'Meme-y idle tycoon: click memes, hire interns and viral servers, race to 1M memes.',
    blueprint: {
      genre: 'idle-tycoon',
      schemaVersion: SCHEMA_VERSION,
      meta: { title: 'Brainrot Factory', theme: 'meme chaos', createdWith: 'client-deterministic' },
      spec: {
        currency: { name: 'Memes', symbol: '🧠', start: 0 },
        clickPower: 2,
        generators: [
          { id: 'intern', name: 'Intern', baseCost: 15, costGrowth: 1.16, baseRate: 1.5 },
          { id: 'machine', name: 'Meme Machine', baseCost: 200, costGrowth: 1.18, baseRate: 12 },
          { id: 'server', name: 'Viral Server', baseCost: 2500, costGrowth: 1.21, baseRate: 90 },
        ],
        upgrades: [
          {
            id: 'overclock',
            label: 'Overclock (+150% Machine rate)',
            cost: 3000,
            effect: { target: 'machine', kind: 'rate', mul: 2.5 },
          },
          {
            id: 'discount',
            label: 'Bulk Interns (−20% Intern cost)',
            cost: 800,
            effect: { target: 'intern', kind: 'cost', mul: 0.8 },
          },
        ],
        win: { mode: 'reach', amount: 1_000_000 },
        theme: { name: 'Brainrot', palette: ['#ff2e88', '#00e5ff', '#1a1a2e'] },
      },
    },
  },
];
