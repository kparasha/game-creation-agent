import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  runInnerLoop,
  type Blueprint,
  type Executor,
  type GenerateRequest,
  type Judge,
  type ModelRouter,
  type Planner,
  type TargetAdapter,
  type ValidationFinding,
} from '@forge/core';
import pack, { deterministicRepairer, type IdleTycoonSpec } from '@forge/genre-idle-tycoon';
import { createWebCanvasAdapter } from '@forge/adapter-web-canvas';

type Spec = IdleTycoonSpec;

// The whole point: a NEW genre runs the SAME inner loop with the generic adapter (runtime injected
// from the pack). Shared Core / orchestrator / providers / telemetry are untouched.
const adapter = createWebCanvasAdapter(pack.webRuntime!) as TargetAdapter<Spec>;
const models: ModelRouter = {
  route: (tier) => ({
    id: 'stub',
    tier,
    async generateStructured() {
      throw new Error('stub');
    },
  }),
};
const executor: Executor<Spec> = { build: (bp, a) => a.build(bp) };
const judge: Judge<Spec> = {
  async judge(bp) {
    const f: ValidationFinding[] = [
      ...pack.validateBlueprint(bp),
      ...(await Promise.all(pack.validators.map((v) => v.check(bp)))).flat(),
    ];
    return { passed: f.every((x) => x.severity !== 'error'), findings: f };
  },
};
const plannerFrom = (b: Blueprint<Spec>): Planner<Spec> => ({
  async plan() {
    return { blueprint: structuredClone(b) };
  },
});
const req: GenerateRequest = { prompt: 'an idle garden', tier: 'client-deterministic' };

test('idle-tycoon runs the full inner loop end-to-end and publishes a playable build', async () => {
  const res = await runInnerLoop<Spec>(req, {
    pack,
    adapter,
    models,
    executor,
    judge,
    repairer: deterministicRepairer,
    planner: plannerFrom(pack.templates[0]!.blueprint),
  });
  assert.equal(res.status, 'published');
  const html = res.build!.files[res.build!.entry]!;
  assert.match(html, /window\.__SPEC__ =/);
  assert.match(html, /setInterval/); // the idle runtime was inlined
});
