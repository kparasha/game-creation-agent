import type { PlanningSpec } from '@forge/core';

/** Structured-generation contract for authoring an idle-tycoon spec (server + on-device). */
export const planning: PlanningSpec = {
  systemPrompt: [
    'You design idle/incremental "tycoon" games (like Grow a Garden / a meme factory).',
    'Output ONLY a JSON object matching the IdleTycoonSpec schema: currency {name, symbol, start},',
    'clickPower, generators[] {id, name, baseCost, costGrowth (>1), baseRate}, upgrades[] {id, label,',
    'cost, effect {target (a generator id or "all"), kind ("rate"|"cost"), mul}}, win ({mode:"endless"}',
    'or {mode:"reach", amount}), theme {name, palette (3 hex colors)}. Ensure the player can start',
    'earning (clickPower > 0), costs grow (costGrowth > 1), and generators produce (baseRate > 0).',
  ].join(' '),
  jsonSchema: {
    type: 'object',
    required: ['currency', 'clickPower', 'generators', 'upgrades', 'win', 'theme'],
    properties: {
      currency: {
        type: 'object',
        required: ['name', 'symbol', 'start'],
        properties: { name: { type: 'string' }, symbol: { type: 'string' }, start: { type: 'number' } },
      },
      clickPower: { type: 'number' },
      generators: {
        type: 'array',
        items: {
          type: 'object',
          required: ['id', 'name', 'baseCost', 'costGrowth', 'baseRate'],
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            baseCost: { type: 'number' },
            costGrowth: { type: 'number' },
            baseRate: { type: 'number' },
          },
        },
      },
      upgrades: {
        type: 'array',
        items: {
          type: 'object',
          required: ['id', 'label', 'cost', 'effect'],
          properties: {
            id: { type: 'string' },
            label: { type: 'string' },
            cost: { type: 'number' },
            effect: {
              type: 'object',
              required: ['target', 'kind', 'mul'],
              properties: {
                target: { type: 'string' },
                kind: { type: 'string', enum: ['rate', 'cost'] },
                mul: { type: 'number' },
              },
            },
          },
        },
      },
      win: {
        type: 'object',
        properties: { mode: { type: 'string' }, amount: { type: 'number' } },
        required: ['mode'],
      },
      theme: {
        type: 'object',
        required: ['name', 'palette'],
        properties: { name: { type: 'string' }, palette: { type: 'array', items: { type: 'string' } } },
      },
    },
  },
};
