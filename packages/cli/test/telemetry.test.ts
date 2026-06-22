import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  runInnerLoop,
  createMemorySink,
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
const req: GenerateRequest = { prompt: 'log me', tier: 'client-deterministic' };

test('happy path emits requested → plan → judge(pass) → run.finished, sharing one runId', async () => {
  const sink = createMemorySink();
  await runInnerLoop<Spec>(req, {
    pack,
    adapter,
    models,
    executor,
    judge,
    repairer: deterministicRepairer,
    sink,
    planner: plannerReturning(pack.templates[0]!.blueprint),
  });

  const types = sink.events.map((e) => e.type);
  assert.deepEqual(types, ['generation.requested', 'plan.completed', 'judge.completed', 'run.finished']);

  const runIds = new Set(sink.events.map((e) => e.runId));
  assert.equal(runIds.size, 1, 'all events share one runId');

  const finished = sink.byType('run.finished')[0]!;
  assert.equal((finished as { status: string }).status, 'published');
});

test('repair path emits a repair.applied event and a second judge attempt', async () => {
  const broken = structuredClone(pack.templates[0]!.blueprint);
  broken.spec.upgrades = []; // UPG_EMPTY → triggers a repair
  const sink = createMemorySink();
  await runInnerLoop<Spec>(req, {
    pack,
    adapter,
    models,
    executor,
    judge,
    repairer: deterministicRepairer,
    maxRepairs: 3,
    sink,
    planner: plannerReturning(broken),
  });

  assert.equal(sink.byType('repair.applied').length, 1);
  assert.equal(sink.byType('judge.completed').length, 2); // before + after repair
  const repair = sink.byType('repair.applied')[0]! as { fromCodes: string[]; changed: boolean };
  assert.ok(repair.fromCodes.includes('UPG_EMPTY'));
  assert.equal(repair.changed, true);
});

test('provided runId is propagated to every event', async () => {
  const sink = createMemorySink();
  await runInnerLoop<Spec>(req, {
    pack,
    adapter,
    models,
    executor,
    judge,
    repairer: deterministicRepairer,
    sink,
    runId: 'fixed-run-id',
    planner: plannerReturning(pack.templates[0]!.blueprint),
  });
  assert.ok(sink.events.every((e) => e.runId === 'fixed-run-id'));
});
