# Architecture

Code scaffold for the AI game-creation coding agent. Strategy/context lives in [`docs/`](docs/README.md);
this file maps that strategy onto the code.

## Shape

```
packages/
  core/                 @forge/core                 Shared Core — genre/platform-agnostic contracts + inner loop
  genre-wave-survival/  @forge/genre-wave-survival  First Genre Pack (the only thing you author per genre)
  adapter-web-canvas/   @forge/adapter-web-canvas   First Target Adapter (the only thing you author per surface)
  mcp-server/           @forge/mcp-server           Dogfood surface — agent-as-MCP tool contract (you = user #1)
  cli/                  @forge/cli                   Runnable end-to-end demo of the inner loop
```

## The three seams (this is the whole design)

1. **Shared Core** (`@forge/core`) owns what never changes per genre or platform:
   - `blueprint.ts` — the Blueprint IR + inference tiers.
   - `agent.ts` — Planner / Executor / Judge / Repairer stage interfaces + HITL hooks.
   - `orchestrator.ts` — `runInnerLoop()`: prompt → plan → [HITL] → generate → validate → repair\* → [HITL] → publish.
   - `pack.ts` — the `GenrePack` + `EditorControlManifest` (data-driven editor).
   - `adapter.ts` — the `TargetAdapter` (one per distribution surface).
   - `model.ts` — `ModelRouter` (on-device vs server; BYOM via OpenRouter).
   - `eval.ts`, `trace.ts`, `registry.ts`.
2. **Genre Pack** = author one per genre. Wave-Survival ships: typed `WaveSurvivalSpec`, deterministic
   `validators` (with a survivability sim), `failureTaxonomy`, the `manifest` (Design-Mode drawer),
   `templates`, a `regression` corpus, and the `planning` schema. **The core loop is reused unchanged.**
3. **Target Adapter** = author one per distribution surface. `web-canvas` emits one self-contained
   HTML5 file; the same build feeds TikTok/Telegram/Discord/Reddit via thin adapters (docs/02).

## Two loops (docs/03)

- **Inner loop** (runtime, per request) = `runInnerLoop()`. THIS is the vertical slice.
- **Outer loop** (offline AutoResearch) = improve a Pack against its `regression` corpus. Phase 2.

## Inference tiers → F2P (docs/05)

- **client-deterministic** ($0): drawer edits via the `manifest` (no model). ~80% of edits. **Design Mode.**
- **on-device** ($0): small local model turns NL → toggle deltas. Still **Design Mode**.
- **server** (paid / BYOM): generate net-new templates / sub-genres. **Create Mode** (spends credits).

## Adding things later

- **A genre** → new `@forge/genre-*` package implementing `GenrePack`. Register it; the loop just works.
- **A distribution surface** → new `@forge/adapter-*` implementing `TargetAdapter` (+ optional `publish`).
- **A model provider** → implement `ModelProvider`; inject via `ModelRouter` (BYOM = user's key).

## Run it

```bash
npm install
npm run typecheck
npm run demo -- "a cozy garden survival game"   # writes out/index.html (runtime is a stub)
```

## Status: scaffold (pre-coding)

### Built (web path)

- `adapter-web-canvas`: **real generic canvas runtime** — a playable wave-survival loop driven entirely
  by the embedded Blueprint (`window.__SPEC__`): movement (WASD/pointer/touch), auto-fire, wave spawn +
  escalation, collisions, upgrades, win/endless, HUD, restart. Headless boot test included.
- **Real model-backed Planner** (`createModelPlanner`, genre-agnostic) + `@forge/providers`
  (`openRouterProvider` BYOM via HTTP, `mockProvider`, `createModelRouter`). Deterministic repairer real.
- **Typed infra-error taxonomy** (`AgentError`): the loop fails *closed* — stage failures become a typed
  error on a `status:'failed'` result + an `error.raised` telemetry event, never an unhandled throw.
- **`editor-web`** (Vite): the templates-first, two-mode editor. Template gallery + live-tuning **Design
  drawer** rendered from the genre's `EditorControlManifest` (data-driven), with a live game preview
  (deterministic codegen runs client-side → tuning is free/offline). "Generate" runs the full inner
  loop in-browser via the model Planner when an OpenRouter key is supplied.

### Not yet built (next)

- On-device (WebGPU) provider for the free Tier-2 NL→toggle path.
- `mcp-server` transport wiring (`@modelcontextprotocol/sdk`) + Smithery listing (Claude path).
- Live validation of `openRouterProvider` against the real API (needs a key).
