/**
 * End-to-end demo of the inner loop. Run:
 *   npm run demo -- "a cozy garden survival game"
 *
 * Planner selection:
 *   - OPENROUTER_API_KEY set → REAL model-backed Planner (BYOM via OpenRouter), tier 'server'.
 *   - otherwise            → offline template Planner (no network), tier 'client-deterministic'.
 * Executor/Judge/Repairer are real either way. The orchestrator and contracts are unchanged.
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
import pack, {
  deterministicRepairer,
  waveSurvivalPlanner,
  type WaveSurvivalSpec,
} from '@forge/genre-wave-survival';
import webCanvasAdapter from '@forge/adapter-web-canvas';
import { openRouterProvider, createModelRouter } from '@forge/providers';
import { jsonlSink } from './jsonl-sink';

type Spec = WaveSurvivalSpec;

// --- EXECUTOR: real (delegates to the adapter's deterministic codegen).
const executor: Executor<Spec> = { build: (blueprint, adapter) => adapter.build(blueprint) };

// --- JUDGE: real deterministic validators (the free floor).
const judge: Judge<Spec> = {
  async judge(blueprint, _build, pack) {
    const schema = pack.validateBlueprint(blueprint);
    const gameplay = (await Promise.all(pack.validators.map((v) => v.check(blueprint)))).flat();
    const findings: ValidationFinding[] = [...schema, ...gameplay];
    return { passed: findings.every((f) => f.severity !== 'error'), findings };
  },
};

// --- PLANNER + ROUTER: real model path if a key is present, else offline templates.
const apiKey = process.env.OPENROUTER_API_KEY;
let planner: Planner<Spec>;
let models: ModelRouter;
let req: GenerateRequest;
const prompt = process.argv.slice(2).join(' ').trim() || 'a cozy garden survival game';

if (apiKey) {
  const provider = openRouterProvider({ apiKey, model: process.env.OPENROUTER_MODEL });
  models = createModelRouter({ server: provider });
  planner = waveSurvivalPlanner;
  req = { prompt, tier: 'server' };
  console.log(`(using OpenRouter model planner: ${provider.id})`);
} else {
  models = {
    route: (tier) => ({
      id: `stub-${tier}`,
      tier,
      async generateStructured() {
        throw new Error('no model configured — set OPENROUTER_API_KEY for the real planner');
      },
    }),
  };
  planner = {
    async plan(req, pack) {
      const t = pack.templates.find((t) => t.id === req.templateId) ?? pack.templates[0]!;
      return { blueprint: structuredClone(t.blueprint), rationale: `from template '${t.id}'` };
    },
  };
  req = { prompt, templateId: 'garden-defense', tier: 'client-deterministic' };
  console.log('(no OPENROUTER_API_KEY — using offline template planner)');
}

const eventsPath = 'out/events.jsonl';
const result = await runInnerLoop<Spec>(req, {
  pack,
  adapter: webCanvasAdapter as TargetAdapter<Spec>,
  models,
  planner,
  executor,
  judge,
  repairer: deterministicRepairer,
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
console.log('title  :', result.blueprint?.meta.title ?? '(none — planning failed)');
console.log('findings:', result.report.findings.length ? result.report.findings : '(none)');
if (result.error)
  console.log('error  :', `${result.error.stage}/${result.error.code}: ${result.error.message}`);

if (result.build) {
  mkdirSync('out', { recursive: true });
  const html = result.build.files[result.build.entry]!;
  writeFileSync(`out/${result.build.entry}`, html);
  console.log(`\nwrote out/${result.build.entry} — open it in a browser to play.`);
}
console.log(`wrote ${eventsPath} — telemetry event log (one JSON per line).`);
