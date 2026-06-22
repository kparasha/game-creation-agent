import { test } from 'node:test';
import assert from 'node:assert/strict';
import pack, { deterministicRepairer, validators } from '@forge/genre-wave-survival';
import type { WaveSurvivalBlueprint } from '@forge/genre-wave-survival';
import type { JudgeReport, ValidationFinding } from '@forge/core';

const errorsOf = async (b: WaveSurvivalBlueprint): Promise<ValidationFinding[]> =>
  (await Promise.all(validators.map((v) => v.check(b)))).flat().filter((f) => f.severity === 'error');

const reportFor = (b: WaveSurvivalBlueprint): JudgeReport => ({
  passed: false,
  findings: validators.flatMap((v) => v.check(b) as ValidationFinding[]),
});

test('repairer fills an empty upgrade pool', async () => {
  const b = structuredClone(pack.templates[0]!.blueprint);
  b.spec.upgrades = [];
  const r = await deterministicRepairer.repair(b, reportFor(b), pack, null as never);
  assert.equal(r.changed, true);
  assert.ok(r.blueprint.spec.upgrades.length > 0);
});

test('repairer makes a too-hard game survivable within a few passes', async () => {
  let b = structuredClone(pack.templates[0]!.blueprint);
  b.spec.enemies = [{ id: 'g', hp: 20, speed: 1.5, damage: 1000, spawnWeight: 1 }];

  let passes = 0;
  while ((await errorsOf(b)).length > 0 && passes < 5) {
    const r = await deterministicRepairer.repair(b, reportFor(b), pack, null as never);
    if (!r.changed) break;
    b = r.blueprint;
    passes++;
  }

  assert.equal((await errorsOf(b)).length, 0, 'still has errors after repair');
  assert.ok(passes >= 1, 'expected at least one repair pass');
});
