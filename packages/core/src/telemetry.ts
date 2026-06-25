import type { InferenceTier } from './blueprint';

/**
 * Structured analytics events — the substrate for evals, regression, cost tracking, and the
 * AutoResearch loop (see docs/07). Distinct from `Tracer` (which is timing/spans): the EventSink is
 * the "don't fly blind" record of prompt → response → outcome.
 *
 * This module is BROWSER-SAFE on purpose (the web path runs core client-side): only the interface,
 * event types, and in-memory/console/null sinks live here. The Node `fs` JSONL sink lives in the CLI;
 * a future HTTP sink will POST to the event store.
 */
export type RunStatus = 'published' | 'rejected' | 'failed';

interface AgentEventBase {
  /** correlates every event in one run/session. */
  runId: string;
  /** ISO timestamp. */
  ts: string;
}

export interface GenerationRequestedEvent extends AgentEventBase {
  type: 'generation.requested';
  prompt: string;
  tier: InferenceTier;
  genre: string;
  templateId?: string;
}
export interface PlanCompletedEvent extends AgentEventBase {
  type: 'plan.completed';
  genre: string;
  title: string;
  rationale?: string;
  latencyMs: number;
  /** model attribution + cost land here once the server tier is wired. */
  modelId?: string;
  tokens?: number;
  costUsd?: number;
}
export interface JudgeCompletedEvent extends AgentEventBase {
  type: 'judge.completed';
  passed: boolean;
  findingCodes: string[];
  attempt: number;
}
export interface RepairAppliedEvent extends AgentEventBase {
  type: 'repair.applied';
  fromCodes: string[];
  changed: boolean;
  attempt: number;
}
export interface PublishedEvent extends AgentEventBase {
  type: 'published';
  surface: string;
  externalId?: string;
}
export interface RunFinishedEvent extends AgentEventBase {
  type: 'run.finished';
  status: RunStatus;
  repairs: number;
  latencyMs: number;
}
export interface ErrorRaisedEvent extends AgentEventBase {
  type: 'error.raised';
  stage: string;
  code: string;
  message: string;
  retryable: boolean;
}

export type AgentEvent =
  | GenerationRequestedEvent
  | PlanCompletedEvent
  | JudgeCompletedEvent
  | RepairAppliedEvent
  | PublishedEvent
  | RunFinishedEvent
  | ErrorRaisedEvent;

/** Where events go. Implementations: nullSink, memorySink (here); jsonlSink (CLI); HTTP (later). */
export interface EventSink {
  emit(event: AgentEvent): void | Promise<void>;
}

/** Discards everything (default — telemetry is opt-in). */
export const nullSink: EventSink = { emit() {} };

/** Pretty-prints to stderr; handy in dev. Browser-safe (console exists everywhere). */
export const consoleSink: EventSink = {
  emit(event) {
    console.error(`[event] ${event.type}`, event);
  },
};

/** Collects events in memory — for tests and quick inspection. */
export interface MemorySink extends EventSink {
  events: AgentEvent[];
  byType(type: AgentEvent['type']): AgentEvent[];
  clear(): void;
}

export function createMemorySink(): MemorySink {
  const events: AgentEvent[] = [];
  return {
    events,
    emit(event) {
      events.push(event);
    },
    byType(type) {
      return events.filter((e) => e.type === type);
    },
    clear() {
      events.length = 0;
    },
  };
}

/** Generates a run id. `crypto.randomUUID` exists in both Node 24 and modern browsers. */
export function newRunId(): string {
  return globalThis.crypto.randomUUID();
}
