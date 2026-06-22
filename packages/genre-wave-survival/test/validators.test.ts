import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validators, estimateTimeToDeathSec } from '@forge/genre-wave-survival';
import type { WaveSurvivalBlueprint, WaveSurvivalSpec } from '@forge/genre-wave-survival';
import type { ValidationFinding } from '@forge/core';

function blueprint(spec: WaveSurvivalSpec): WaveSurvivalBlueprint {
  return {
    genre: 'wave-survival',
    schemaVersion: 1,
    meta: { title: 't', createdWith: 'client-deterministic' },
    spec,
  };
}

const good = (): WaveSurvivalBlueprint =>
  blueprint({
    player: { hp: 100, speed: 3, fireRate: 4, damage: 10 },
    enemies: [{ id: 'g', hp: 20, speed: 1.5, damage: 5, spawnWeight: 1 }],
    waves: { intervalSec: 8, baseCount: 5, escalation: { hpMul: 1.15, speedMul: 1.05, countMul: 1.2 } },
    upgrades: [{ id: 'd', label: '+dmg', effect: { stat: 'playerDamage', mul: 1.25 } }],
    win: { mode: 'endless' },
    theme: { name: 'X', palette: ['#1', '#2', '#3'] },
  });

const run = (b: WaveSurvivalBlueprint): ValidationFinding[] =>
  validators.flatMap((v) => v.check(b) as ValidationFinding[]);

test('a good blueprint produces no error-severity findings', () => {
  assert.equal(run(good()).filter((f) => f.severity === 'error').length, 0);
});

test('no enemies → BOOT_NO_ENEMIES', () => {
  const b = good();
  b.spec.enemies = [];
  assert.ok(run(b).some((f) => f.code === 'BOOT_NO_ENEMIES'));
});

test('player deals no damage → DMG_PLAYER_NOOP', () => {
  const b = good();
  b.spec.player.damage = 0;
  assert.ok(run(b).some((f) => f.code === 'DMG_PLAYER_NOOP'));
});

test('flat escalation → WAVE_FLAT (warning)', () => {
  const b = good();
  b.spec.waves.escalation = { hpMul: 1, speedMul: 1, countMul: 1 };
  assert.ok(run(b).some((f) => f.code === 'WAVE_FLAT'));
});

test('overwhelming enemies → BAL_TOO_HARD', () => {
  const b = good();
  b.spec.enemies = [{ id: 'g', hp: 20, speed: 1.5, damage: 1000, spawnWeight: 1 }];
  assert.ok(run(b).some((f) => f.code === 'BAL_TOO_HARD'));
});

test('estimateTimeToDeathSec is finite when enemies can damage the player', () => {
  assert.ok(Number.isFinite(estimateTimeToDeathSec(good().spec)));
});
