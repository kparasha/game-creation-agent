import type { Blueprint, BlueprintTemplate, InferenceTier } from './blueprint';
import type { Validator, FailureTaxonomy, RegressionCase, ValidationFinding } from './eval';

/** ---- Editor Control Manifest (the data-driven Design-Mode drawer) ---- */

export type ControlType = 'slider' | 'toggle' | 'select' | 'color' | 'text';

/** One editable control. Bound to a dot-path in blueprint.spec. Rendering is platform-decided. */
export interface Control {
  id: string;
  label: string;
  type: ControlType;
  /** dot-path into blueprint.spec, e.g. "player.speed" or "waves.escalation.hpMul". */
  path: string;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: string | number }[];
  /**
   * Which tier may change this. Most tweaks are 'client-deterministic' (free, no LLM) — that is the
   * F2P unlock. 'on-device' = needs NL→toggle translation. (see docs/05)
   */
  tier: InferenceTier;
}

/** Hierarchical groups → nested sub-drawers / collapsible sections (kept shallow for v1). */
export interface ControlGroup {
  id: string;
  label: string;
  icon?: string;
  controls: Control[];
  groups?: ControlGroup[];
}

export interface EditorControlManifest {
  groups: ControlGroup[];
}

/** Structured-generation contract shared by on-device (NL→toggles) and server (new template). */
export interface PlanningSpec {
  systemPrompt: string;
  jsonSchema: unknown;
  fewShots?: { user: string; blueprintJson: unknown }[];
}

/**
 * A genre is fully described by a Pack. Adding a genre = authoring one of these; the Shared Core
 * loop, eval harness, editor shell, and Target Adapters are all reused unchanged.
 */
export interface GenrePack<TSpec = unknown> {
  id: string;
  schemaVersion: number;
  /** Schema-level validation (shape/ranges). */
  validateBlueprint(blueprint: Blueprint<TSpec>): ValidationFinding[];
  /** Deterministic gameplay validators (the free Judge floor). */
  validators: Validator<TSpec>[];
  failureTaxonomy: FailureTaxonomy;
  /** Data-driven Design-Mode editor surface. */
  manifest: EditorControlManifest;
  /** Templates-first onboarding. */
  templates: BlueprintTemplate<TSpec>[];
  /** Regression corpus for the AutoResearch outer loop. */
  regression: RegressionCase<TSpec>[];
  planning: PlanningSpec;
  /**
   * The genre's web-canvas runtime (a JS string). The adapter is genre-agnostic packaging; the
   * runtime is genre knowledge, so it travels with the pack: `createWebCanvasAdapter(pack.webRuntime)`.
   */
  webRuntime?: string;
}
