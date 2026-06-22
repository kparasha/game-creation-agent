import type { BlueprintTemplate } from '@forge/core';
import type { WaveSurvivalSpec } from '../blueprint';
import { SCHEMA_VERSION } from '../blueprint';

/** Shared baseline so templates only declare what differs. */
function base(over: Partial<WaveSurvivalSpec> & Pick<WaveSurvivalSpec, 'theme'>): WaveSurvivalSpec {
  return {
    player: { hp: 100, speed: 3, fireRate: 4, damage: 10 },
    enemies: [{ id: 'grunt', hp: 20, speed: 1.5, damage: 5, spawnWeight: 1 }],
    waves: { intervalSec: 8, baseCount: 5, escalation: { hpMul: 1.15, speedMul: 1.05, countMul: 1.2 } },
    upgrades: [{ id: 'dmg', label: '+25% Damage', effect: { stat: 'playerDamage', mul: 1.25 } }],
    win: { mode: 'endless' },
    ...over,
  };
}

/** Templates-first onboarding: land here, never on a blank box. Each is one-tap remixable. */
export const templates: BlueprintTemplate<WaveSurvivalSpec>[] = [
  {
    id: 'garden-defense',
    name: 'Garden Defense',
    description: 'Cozy survival — protect your garden from escalating bug waves.',
    blueprint: {
      genre: 'wave-survival',
      schemaVersion: SCHEMA_VERSION,
      meta: { title: 'Garden Defense', theme: 'cozy garden', createdWith: 'client-deterministic' },
      spec: base({
        theme: { name: 'Garden', palette: ['#6db36b', '#f4d35e', '#8d5a2b'] },
        enemies: [
          { id: 'aphid', hp: 15, speed: 1.3, damage: 4, spawnWeight: 2 },
          { id: 'beetle', hp: 40, speed: 1.0, damage: 8, spawnWeight: 1 },
        ],
      }),
    },
  },
  {
    id: 'brainrot-survivors',
    name: 'Brainrot Survivors',
    description: 'Meme-y bullet-heaven — survive escalating swarms that get brutal fast.',
    blueprint: {
      genre: 'wave-survival',
      schemaVersion: SCHEMA_VERSION,
      meta: { title: 'Brainrot Survivors', theme: 'meme chaos', createdWith: 'client-deterministic' },
      spec: base({
        theme: { name: 'Brainrot', palette: ['#ff2e88', '#00e5ff', '#1a1a2e'] },
        player: { hp: 80, speed: 3.5, fireRate: 6, damage: 8 },
        waves: { intervalSec: 6, baseCount: 8, escalation: { hpMul: 1.2, speedMul: 1.08, countMul: 1.25 } },
        upgrades: [
          { id: 'dmg', label: '+25% Damage', effect: { stat: 'playerDamage', mul: 1.25 } },
          { id: 'spd', label: '+15% Speed', effect: { stat: 'playerSpeed', mul: 1.15 } },
          { id: 'fr', label: '+30% Fire Rate', effect: { stat: 'fireRate', mul: 1.3 } },
        ],
      }),
    },
  },
];
