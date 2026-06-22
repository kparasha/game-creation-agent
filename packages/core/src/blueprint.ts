/**
 * The Blueprint is the genre-agnostic intermediate representation (IR).
 * Everything downstream — codegen, validation, the editor drawer, remix — operates on it.
 * A genre supplies the concrete `TSpec` (see GenrePack).
 */

/** Which inference tier produced/edited content. Drives unit economics (see docs/05). */
export type InferenceTier = 'client-deterministic' | 'on-device' | 'server';

export interface BlueprintMeta {
  title: string;
  theme?: string;
  /** How this artifact was created — free tiers never hit a server model. */
  createdWith: InferenceTier;
  /** id of the template/blueprint this was forked from (remix lineage). */
  remixOf?: string;
}

export interface Blueprint<TSpec = unknown> {
  /** Genre id, matches a GenrePack.id (e.g. 'wave-survival'). */
  genre: string;
  schemaVersion: number;
  meta: BlueprintMeta;
  /** Genre-specific, typed configuration. */
  spec: TSpec;
}

/** A seeded, remixable starting point. Templates-first onboarding (never a blank box). */
export interface BlueprintTemplate<TSpec = unknown> {
  id: string;
  name: string;
  description: string;
  blueprint: Blueprint<TSpec>;
}
