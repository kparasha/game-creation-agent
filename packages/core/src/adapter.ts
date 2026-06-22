import type { Blueprint } from './blueprint';

/** A distribution/runtime surface. Most H5 surfaces share one HTML5 build (see docs/02). */
export type TargetSurface =
  | 'web-canvas'
  | 'tiktok-mini'
  | 'telegram'
  | 'discord'
  | 'reddit'
  | 'roblox'
  | 'unity'
  | 'unreal'
  | 'godot'
  | 'steam-wrap';

export interface BuildOutput {
  surface: TargetSurface;
  /** path → file contents (HTML/JS/Luau/etc.). */
  files: Record<string, string>;
  /** entry file key within `files`. */
  entry: string;
}

export interface PublishContext {
  /** BYO surface auth (Roblox OAuth, TikTok, Telegram bot token, ...). */
  credentials?: Record<string, string>;
  /** The human stays creator-of-record; the agent uploads on their behalf. */
  creatorOfRecord?: string;
}

export interface PublishResult {
  ok: boolean;
  url?: string;
  externalId?: string;
  message?: string;
}

/**
 * Blueprint → runnable build for one surface. Adding a distribution channel = authoring one of these.
 * Surfaces with a programmatic publish path (Roblox/TikTok/Telegram/Discord/Reddit) implement `publish`.
 */
export interface TargetAdapter<TSpec = unknown> {
  surface: TargetSurface;
  build(blueprint: Blueprint<TSpec>): Promise<BuildOutput>;
  publish?(output: BuildOutput, ctx: PublishContext): Promise<PublishResult>;
}
