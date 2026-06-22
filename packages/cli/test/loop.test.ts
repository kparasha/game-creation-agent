import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  runInnerLoop,
  type Planner,
  type Executor,
  type Judge,
  type ModelRouter,
  type GenerateRequest,
  type ValidationFinding,
  type TargetAdapter,
  type Blueprint,
} from '@forge/core';
import pack, { deterministicRepairer, type WaveSurvivalSpec } from '@forge/genre-wave-survival';
import webCanvasAdapter from '@forge/adapter-web-canvas';

type Spec = WaveSurvivalSpec;

const models: ModelRouter = {
  route: (tier) => ({
    id: 'stub',
    tier,
    async generateStructured() {
      throw new Error('stub');
    },
  }),
};
const executor: Executor<Spec> = { build: (bp, adapter) => adapter.build(bp) };
const judge: Judge<Spec> = {
  async judge(bp, _build, p) {
    const findings: ValidationFinding[] = [
      ...p.validateBlueprint(bp),
      ...(await Promise.all(p.validators.map((v) => v.check(bp)))).flat(),
    ];
    return { passed: findings.every((f) => f.severity !== 'error'), findings };
  },
};
const adapter = webCanvasAdapter as TargetAdapter<Spec>;
const plannerReturning = (b: Blueprint<Spec>): Planner<Spec> => ({
  async plan() {
    return { blueprint: structuredClone(b) };
  },
});
const req: GenerateRequest = { prompt: 'x', tier: 'client-deterministic' };

test('happy path: a valid template publishes with zero repairs', async () => {
  const res = await runInnerLoop<Spec>(req, {
    pack,
    adapter,
    models,
    executor,
    judge,
    repairer: deterministicRepairer,
    planner: plannerReturning(pack.templates[0]!.blueprint),
  });
  assert.equal(res.status, 'published');
  assert.equal(res.repairs, 0);
});

test('repair path: a degenerate blueprint is repaired, then published', async () => {
  const broken = structuredClone(pack.templates[0]!.blueprint);
  broken.spec.upgrades = []; // UPG_EMPTY error
  const res = await runInnerLoop<Spec>(req, {
    pack,
    adapter,
    models,
    executor,
    judge,
    repairer: deterministicRepairer,
    maxRepairs: 3,
    planner: plannerReturning(broken),
  });
  assert.equal(res.status, 'published');
  assert.ok(res.repairs >= 1);
});

test('fail-closed: an unrepairable blueprint never publishes', async () => {
  const bad = structuredClone(pack.templates[0]!.blueprint);
  (bad as { genre: string }).genre = 'not-wave-survival'; // SCHEMA_GENRE: not deterministically repairable
  const res = await runInnerLoop<Spec>(req, {
    pack,
    adapter,
    models,
    executor,
    judge,
    repairer: deterministicRepairer,
    maxRepairs: 2,
    planner: plannerReturning(bad),
  });
  assert.equal(res.status, 'failed');
  assert.notEqual(res.published, true);
});
