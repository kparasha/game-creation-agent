import type { Blueprint, InferenceTier } from './blueprint';
import type { GenrePack } from './pack';
import type { TargetAdapter, BuildOutput } from './adapter';
import type { ModelRouter } from './model';
import type { ValidationFinding } from './eval';

/**
 * Inner-loop stages: prompt → PLAN → [HITL] → GENERATE → JUDGE → REPAIR* → [HITL] → PUBLISH.
 * Each is an interface so it can be a single model call, a deterministic util, or a sub-agent fan-out.
 * Keep decomposition minimal — every extra agent costs latency + tokens (Sekai's #1 problem).
 */

export interface GenerateRequest {
  prompt: string;
  /** Start from a template (Design-Mode origin). */
  templateId?: string;
  /** Remix an existing blueprint. */
  remixOf?: Blueprint;
  /** Routes which inference tier handles this request. */
  tier: InferenceTier;
}

export interface PlanResult<TSpec = unknown> {
  blueprint: Blueprint<TSpec>;
  rationale?: string;
}

export interface JudgeReport {
  passed: boolean;
  findings: ValidationFinding[];
  /** optional subjective quality score from an LLM-as-judge (0..1). */
  score?: number;
}

export interface RepairResult<TSpec = unknown> {
  blueprint: Blueprint<TSpec>;
  changed: boolean;
  notes?: string;
}

/** PLANNER: prompt → typed Blueprint. (server tier = new; on-device = NL→toggle deltas) */
export interface Planner<TSpec = unknown> {
  plan(req: GenerateRequest, pack: GenrePack<TSpec>, models: ModelRouter): Promise<PlanResult<TSpec>>;
}

/** EXECUTOR: Blueprint → runnable build via a Target Adapter. */
export interface Executor<TSpec = unknown> {
  build(blueprint: Blueprint<TSpec>, adapter: TargetAdapter<TSpec>): Promise<BuildOutput>;
}

/** JUDGE: deterministic validators first; optional LLM-as-judge for subjective quality. */
export interface Judge<TSpec = unknown> {
  judge(blueprint: Blueprint<TSpec>, build: BuildOutput, pack: GenrePack<TSpec>): Promise<JudgeReport>;
}

/** REPAIR: feed the failure taxonomy back to fix the Blueprint. */
export interface Repairer<TSpec = unknown> {
  repair(
    blueprint: Blueprint<TSpec>,
    report: JudgeReport,
    pack: GenrePack<TSpec>,
    models: ModelRouter,
  ): Promise<RepairResult<TSpec>>;
}

/** Human-in-the-loop hooks — HITL #1 on the Blueprint (cheap, pre-codegen), HITL #2 on the Build. */
export interface HitlHooks<TSpec = unknown> {
  onBlueprintReady?(blueprint: Blueprint<TSpec>): Promise<Blueprint<TSpec>>;
  onBuildReady?(build: BuildOutput): Promise<'accept' | 'reject'>;
}
