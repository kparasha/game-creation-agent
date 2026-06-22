import type { Blueprint } from './blueprint';
import type { GenrePack } from './pack';
import type { TargetAdapter, BuildOutput } from './adapter';
import type { ModelRouter } from './model';
import type { GenerateRequest, Planner, Executor, Judge, Repairer, JudgeReport, HitlHooks } from './agent';
import type { Tracer } from './trace';
import type { EventSink, AgentEvent, RunStatus } from './telemetry';
import { nullSink, newRunId } from './telemetry';

export interface OrchestratorDeps<TSpec = unknown> {
  pack: GenrePack<TSpec>;
  adapter: TargetAdapter<TSpec>;
  models: ModelRouter;
  planner: Planner<TSpec>;
  executor: Executor<TSpec>;
  judge: Judge<TSpec>;
  repairer: Repairer<TSpec>;
  hitl?: HitlHooks<TSpec>;
  /** Bounded repair attempts before giving up. */
  maxRepairs?: number;
  tracer?: Tracer;
  /** Analytics sink. Defaults to nullSink (telemetry is opt-in). */
  sink?: EventSink;
  /** Correlation id for the whole run; generated if omitted. */
  runId?: string;
}

export interface RunResult<TSpec = unknown> {
  blueprint: Blueprint<TSpec>;
  build?: BuildOutput;
  report: JudgeReport;
  published?: boolean;
  repairs: number;
  status: 'published' | 'rejected' | 'failed';
}

/**
 * The inner loop (see docs/03). This is the heart of the vertical slice:
 *   prompt → plan → [HITL #1] → generate → validate → repair* → [HITL #2] → publish
 */
export async function runInnerLoop<TSpec>(
  req: GenerateRequest,
  deps: OrchestratorDeps<TSpec>,
): Promise<RunResult<TSpec>> {
  const { pack, adapter, models, planner, executor, judge, repairer, hitl, tracer } = deps;
  const maxRepairs = deps.maxRepairs ?? 2;
  const sink = deps.sink ?? nullSink;
  const runId = deps.runId ?? newRunId();
  const t0 = Date.now();
  const span = tracer?.start('inner-loop', { runId, prompt: req.prompt, tier: req.tier });
  const emit = (e: AgentEvent) => sink.emit(e);
  const now = () => new Date().toISOString();

  await emit({
    type: 'generation.requested',
    runId,
    ts: now(),
    prompt: req.prompt,
    tier: req.tier,
    genre: pack.id,
    templateId: req.templateId,
  });

  // PLAN — prompt → typed Blueprint.
  const planStart = Date.now();
  const plan = await planner.plan(req, pack, models);
  let blueprint = plan.blueprint;
  await emit({
    type: 'plan.completed',
    runId,
    ts: now(),
    genre: blueprint.genre,
    title: blueprint.meta.title,
    rationale: plan.rationale,
    latencyMs: Date.now() - planStart,
  });

  // HITL #1 — human edits/approves the Blueprint (structured, cheap, pre-codegen).
  if (hitl?.onBlueprintReady) blueprint = await hitl.onBlueprintReady(blueprint);

  let build: BuildOutput | undefined;
  let report: JudgeReport = { passed: false, findings: [] };
  let repairs = 0;

  const finish = (status: RunStatus): void => {
    span?.end({ status, repairs });
    void emit({ type: 'run.finished', runId, ts: now(), status, repairs, latencyMs: Date.now() - t0 });
  };

  // GENERATE → JUDGE → REPAIR (bounded).
  for (;;) {
    build = await executor.build(blueprint, adapter);
    report = await judge.judge(blueprint, build, pack);
    await emit({
      type: 'judge.completed',
      runId,
      ts: now(),
      passed: report.passed,
      findingCodes: report.findings.map((f) => f.code),
      attempt: repairs,
    });
    if (report.passed || repairs >= maxRepairs) break;

    const fromCodes = report.findings.map((f) => f.code);
    const r = await repairer.repair(blueprint, report, pack, models);
    blueprint = r.blueprint;
    repairs++;
    await emit({ type: 'repair.applied', runId, ts: now(), fromCodes, changed: r.changed, attempt: repairs });
    if (!r.changed) break; // repairer made no progress — stop rather than spin.
  }

  if (!report.passed) {
    finish('failed');
    return { blueprint, build, report, repairs, status: 'failed' };
  }

  // HITL #2 — accept/reject the generated build.
  if (hitl?.onBuildReady) {
    const decision = await hitl.onBuildReady(build);
    if (decision === 'reject') {
      finish('rejected');
      return { blueprint, build, report, repairs, status: 'rejected' };
    }
  }

  // PUBLISH — only surfaces with a programmatic publish path implement this.
  let published = false;
  if (adapter.publish) {
    const p = await adapter.publish(build, {});
    published = p.ok;
    if (p.ok)
      await emit({ type: 'published', runId, ts: now(), surface: adapter.surface, externalId: p.externalId });
  }

  finish('published');
  return { blueprint, build, report, published, repairs, status: 'published' };
}
