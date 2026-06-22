import type { Blueprint } from './blueprint';
import type { BuildOutput } from './adapter';

export type Severity = 'error' | 'warn' | 'info';

export interface ValidationFinding {
  code: string;
  severity: Severity;
  message: string;
}

/**
 * A deterministic validator — the free "Judge floor" (no LLM). Constrained genres make this possible,
 * which is what turns "agents are unstable" into reliable output (Sekai's #2 problem).
 */
export interface Validator<TSpec = unknown> {
  id: string;
  description: string;
  check(blueprint: Blueprint<TSpec>, build?: BuildOutput): ValidationFinding[] | Promise<ValidationFinding[]>;
}

/** Maps a finding code → label + a hint the Repairer feeds back to the Planner/Executor. */
export type FailureTaxonomy = Record<string, { label: string; repairHint: string }>;

/** A regression prompt for the AutoResearch outer loop (see docs/03). */
export interface RegressionCase<TSpec = unknown> {
  id: string;
  prompt: string;
  /** Assertions over the produced blueprint; an empty array means the case passed. */
  expect(blueprint: Blueprint<TSpec>): ValidationFinding[];
}
