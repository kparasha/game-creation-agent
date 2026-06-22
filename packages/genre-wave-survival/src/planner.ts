import type { PlanningSpec } from '@forge/core';

/**
 * Structured-generation contract for this genre. The SAME schema serves both inference tiers:
 *  - on-device → translate an NL tweak into a partial spec / toggle deltas (free)
 *  - server    → generate a whole net-new spec for a new theme/sub-genre (paid / BYOM)
 * The actual model call lives in the Shared Core ModelRouter; the Pack only supplies prompt + schema.
 */
export const planning: PlanningSpec = {
  systemPrompt: [
    'You design wave-survival games (Vampire-Survivors-like).',
    'Given a short idea, output ONLY a JSON object matching the WaveSurvivalSpec schema.',
    'Keep it playable: player can damage enemies, at least one enemy can damage the player,',
    'waves escalate over time, and the run is survivable for ~30s+ but not trivial.',
    'Pick a theme + 3-colour palette that matches the idea.',
  ].join(' '),
  jsonSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['player', 'enemies', 'waves', 'upgrades', 'win', 'theme'],
    properties: {
      player: {
        type: 'object',
        required: ['hp', 'speed', 'fireRate', 'damage'],
        properties: {
          hp: { type: 'number', minimum: 1 },
          speed: { type: 'number', minimum: 0.5 },
          fireRate: { type: 'number', minimum: 0.5 },
          damage: { type: 'number', minimum: 1 },
        },
      },
      enemies: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          required: ['id', 'hp', 'speed', 'damage', 'spawnWeight'],
          properties: {
            id: { type: 'string' },
            hp: { type: 'number', minimum: 1 },
            speed: { type: 'number', minimum: 0.1 },
            damage: { type: 'number', minimum: 0 },
            spawnWeight: { type: 'number', minimum: 0.1 },
          },
        },
      },
      waves: {
        type: 'object',
        required: ['intervalSec', 'baseCount', 'escalation'],
        properties: {
          intervalSec: { type: 'number', minimum: 1 },
          baseCount: { type: 'number', minimum: 1 },
          escalation: {
            type: 'object',
            required: ['hpMul', 'speedMul', 'countMul'],
            properties: {
              hpMul: { type: 'number', minimum: 1 },
              speedMul: { type: 'number', minimum: 1 },
              countMul: { type: 'number', minimum: 1 },
            },
          },
        },
      },
      upgrades: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          required: ['id', 'label', 'effect'],
          properties: {
            id: { type: 'string' },
            label: { type: 'string' },
            effect: {
              type: 'object',
              required: ['stat', 'mul'],
              properties: {
                stat: { enum: ['playerDamage', 'playerSpeed', 'playerHp', 'fireRate'] },
                mul: { type: 'number', minimum: 1 },
              },
            },
          },
        },
      },
      win: {
        oneOf: [
          { type: 'object', required: ['mode'], properties: { mode: { const: 'endless' } } },
          {
            type: 'object',
            required: ['mode', 'seconds'],
            properties: { mode: { const: 'survive' }, seconds: { type: 'number', minimum: 10 } },
          },
        ],
      },
      theme: {
        type: 'object',
        required: ['name', 'palette'],
        properties: {
          name: { type: 'string' },
          palette: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 3 },
        },
      },
    },
  },
};
