/**
 * End-to-end demo of the inner loop with STUB stages (no network). Run:
 *   npm run demo -- "a cozy garden survival game"
 *
 * The stub Planner starts from a template (Design-Mode origin) instead of calling an LLM — proving
 * the loop wiring before any model code. Swap the stubs for real Planner/Executor/Judge/Repairer in
 * the coding phase; the orchestrator and contracts stay exactly the same.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import {
  runInnerLoop,
  consoleTracer,
  type ModelRouter,
  type Planner,
  type Executor,
  type Judge,
  type GenerateRequest,
  type TargetAdapter,
  type ValidationFinding,
} from '@forge/core';
import pack, { deterministicRepairer, type WaveSurvivalSpec } from '@forge/genre-wave-survival';
import webCanvasAdapter from '@forge/adapter-web-canvas';
import { jsonlSink } from './jsonl-sink';

type Spec = WaveSurvivalSpec;

// --- STUB model router (no network). Real impl: Anthropic / OpenRouter (server), Apple FM (on-device).
const models: ModelRouter = {
  route: (tier) => ({
    id: `stub-${tier}`,
    tier,
    async generateStructured() {
      throw new Error('stub model router — wire a real provider in the coding phase');
    },
  }),
};

// --- STUB Planner: start from a template instead of an LLM call.
const planner: Planner<Spec> = {
  async plan(req, pack) {
    const t = pack.templates.find((t) => t.id === req.templateId) ?? pack.templates[0]!;
    return { blueprint: structuredClone(t.blueprint), rationale: `from template '${t.id}'` };
  },
};

// --- EXECUTOR: real (just delegates to the adapter's deterministic codegen).
const executor: Executor<Spec> = {
  build: (blueprint, adapter) => adapter.build(blueprint),
};

// --- JUDGE: real deterministic validators (the free floor).
const judge: Judge<Spec> = {
  async judge(blueprint, _build, pack) {
    const schema = pack.validateBlueprint(blueprint);
    const gameplay = (await Promise.all(pack.validators.map((v) => v.check(blueprint)))).flat();
    const findings: ValidationFinding[] = [...schema, ...gameplay];
    const passed = findings.every((f) => f.severity !== 'error');
    return { passed, findings };
  },
};

// --- REPAIRER: real deterministic repairer (client tier, no LLM). LLM repairer is a later layer.
const repairer = deterministicRepairer;

const prompt = process.argv.slice(2).join(' ').trim() || 'a cozy garden survival game';
const req: GenerateRequest = { prompt, templateId: 'garden-defense', tier: 'client-deterministic' };

const eventsPath = 'out/events.jsonl';
const result = await runInnerLoop<Spec>(req, {
  pack,
  adapter: webCanvasAdapter as TargetAdapter<Spec>,
  models,
  planner,
  executor,
  judge,
  repairer,
  tracer: consoleTracer,
  sink: jsonlSink(eventsPath),
  hitl: {
    async onBlueprintReady(bp) {
      return bp; // HITL #1: pass-through (a UI would let the human tweak the drawer here)
    },
  },
});

console.log('\n=== run result ===');
console.log('status :', result.status);
console.log('repairs:', result.repairs);
console.log('title  :', result.blueprint.meta.title);
console.log('findings:', result.report.findings.length ? result.report.findings : '(none)');

if (result.build) {
  mkdirSync('out', { recursive: true });
  const html = result.build.files[result.build.entry]!;
  writeFileSync(`out/${result.build.entry}`, html);
  console.log(`\nwrote out/${result.build.entry} — open it in a browser to see the runtime stub.`);
}
console.log(`wrote ${eventsPath} — telemetry event log (one JSON per line).`);
