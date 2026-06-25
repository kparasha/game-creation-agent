import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  runInnerLoop,
  createMemorySink,
  AgentError,
  type ModelProvider,
  type Executor,
  type Judge,
  type GenerateRequest,
  type ValidationFinding,
  type TargetAdapter,
} from '@forge/core';
import pack, { waveSurvivalPlanner, type WaveSurvivalSpec } from '@forge/genre-wave-survival';
import webCanvasAdapter from '@forge/adapter-web-canvas';
import { mockProvider, createModelRouter } from '@forge/providers';

type Spec = WaveSurvivalSpec;

const executor: Executor<Spec> = { build: (bp, adapter) => adapter.build(bp) };
const judge: Judge<Spec> = {
  async judge(bp, _b, p) {
    const findings: ValidationFinding[] = [
      ...p.validateBlueprint(bp),
      ...(await Promise.all(p.validators.map((v) => v.check(bp)))).flat(),
    ];
    return { passed: findings.every((f) => f.severity !== 'error'), findings };
  },
};
const adapter = webCanvasAdapter as TargetAdapter<Spec>;
const req: GenerateRequest = { prompt: 'a spooky haunted survival game', tier: 'server' };

test('model planner turns a provider spec into a valid, titled Blueprint', async () => {
  // The provider returns a canned valid spec (reusing a template's spec).
  const cannedSpec = structuredClone(pack.templates[0]!.blueprint.spec);
  cannedSpec.theme = { name: 'Haunted', palette: ['#222', '#a0f', '#0ff'] };
  const models = createModelRouter({ server: mockProvider(cannedSpec) });

  const { blueprint } = await waveSurvivalPlanner.plan(req, pack, models);
  assert.equal(blueprint.genre, 'wave-survival');
  assert.equal(blueprint.meta.createdWith, 'server');
  assert.equal(blueprint.meta.title, 'Haunted'); // deriveTitle read spec.theme.name

  const errs = (await Promise.all(pack.validators.map((v) => v.check(blueprint))))
    .flat()
    .filter((f) => f.severity === 'error');
  assert.equal(errs.length, 0, 'model output passes the deterministic validators');
});

test('a provider failure surfaces as a typed AgentError (PROVIDER_ERROR / plan)', async () => {
  const failing: ModelProvider = {
    id: 'boom',
    tier: 'server',
    async generateStructured() {
      throw new Error('429 rate limited');
    },
  };
  const models = createModelRouter({ server: failing });
  await assert.rejects(
    () => waveSurvivalPlanner.plan(req, pack, models),
    (e: unknown) =>
      e instanceof AgentError && e.code === 'PROVIDER_ERROR' && e.stage === 'plan' && e.retryable,
  );
});

test('inner loop fails closed on a planner error (no throw, typed error + telemetry)', async () => {
  const failing: ModelProvider = {
    id: 'boom',
    tier: 'server',
    async generateStructured() {
      throw new Error('boom');
    },
  };
  const sink = createMemorySink();
  const res = await runInnerLoop<Spec>(req, {
    pack,
    adapter,
    models: createModelRouter({ server: failing }),
    planner: waveSurvivalPlanner,
    executor,
    judge,
    repairer: {
      async repair(b) {
        return { blueprint: b, changed: false };
      },
    },
    sink,
  });

  assert.equal(res.status, 'failed');
  assert.ok(res.error instanceof AgentError);
  assert.equal(res.error?.code, 'PROVIDER_ERROR');
  assert.equal(sink.byType('error.raised').length, 1);
  assert.equal(sink.byType('run.finished').length, 1);
});
