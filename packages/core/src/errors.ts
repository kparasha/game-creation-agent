/**
 * Infrastructure / operational errors — DISTINCT from content `ValidationFinding`s (eval.ts).
 * A ValidationFinding means "the generated game is wrong"; an AgentError means "a stage failed to run"
 * (model timeout, provider 500, adapter crash). The orchestrator converts these into a failed
 * RunResult instead of letting them throw — i.e. the loop fails *closed*. (Review §7.6)
 */
export type AgentErrorCode =
  | 'PLANNER_FAILED'
  | 'MODEL_TIMEOUT'
  | 'PROVIDER_ERROR'
  | 'BUILD_FAILED'
  | 'PUBLISH_FAILED'
  | 'UNKNOWN';

export type AgentStage = 'plan' | 'build' | 'judge' | 'repair' | 'publish';

export interface AgentErrorInit {
  code: AgentErrorCode;
  stage: AgentStage;
  message: string;
  /** Whether a retry could plausibly succeed (timeouts, 5xx) vs. a hard failure. */
  retryable?: boolean;
  cause?: unknown;
}

export class AgentError extends Error {
  readonly code: AgentErrorCode;
  readonly stage: AgentStage;
  readonly retryable: boolean;
  override readonly cause?: unknown;

  constructor(init: AgentErrorInit) {
    super(init.message);
    this.name = 'AgentError';
    this.code = init.code;
    this.stage = init.stage;
    this.retryable = init.retryable ?? false;
    this.cause = init.cause;
  }
}

/** Wrap any thrown value as an AgentError tagged with the stage it came from. */
export function toAgentError(err: unknown, stage: AgentStage): AgentError {
  if (err instanceof AgentError) return err;
  const message = err instanceof Error ? err.message : String(err);
  return new AgentError({ code: 'UNKNOWN', stage, message, cause: err });
}
