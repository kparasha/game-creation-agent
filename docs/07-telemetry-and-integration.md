# Telemetry & Integration Layering

_Last updated: 2026-06-21._

Disentangles two things that look like one question ("MCP server vs a local helper"):
**(A) how callers reach the agent** and **(B) how we record what happened**. They're orthogonal.

## A. Integration is layered — it's not "MCP _or_ a helper"

```
        callers                      entry adapters (thin)             the agent (where work + telemetry live)
  ┌───────────────┐            ┌──────────────────────────┐        ┌────────────────────────────────────┐
  │ Claude / Cursor│──MCP────▶ │ @forge/mcp-server (~shim) │──────▶ │  @forge/core  runInnerLoop(...)      │
  │ our own tooling│──direct─▶ │ @forge/cli               │──────▶ │  Planner/Executor/Judge/Repair       │
  │ web/PWA, H5    │──HTTP───▶ │ (future) http-gateway    │──────▶ │  + EventSink → event store           │
  └───────────────┘            └──────────────────────────┘        └────────────────────────────────────┘
                                                                              │ JSONL / SQLite / ClickHouse
                                                                              ▼
                                                                   analytics consumers (SQL / Python / notebooks)
```

- **The "GrowthBook-style local helper" = `@forge/core` as a service.** It does the work and emits
  events. That's the substance.
- **MCP server is a thin adapter (~50 lines) over that core**, not a separate brain. For the
  **Claude-plugin route you can't skip it** — MCP _is_ how Claude/Cursor plugins expose tools — but it
  carries no logic, so "we don't need an MCP server" really means "we don't need logic _in_ the MCP
  server," which is already true.
- Same core is reachable via CLI today and an HTTP gateway later. One implementation, many doors.

### Language: keep the agent single-language; let analytics be polyglot

Our core is TypeScript. **Don't fork the agent into Python** — that splits the logic. The GrowthBook
split done right: the **SDK/agent emits events** (our TS core), and **analytics _consumes_** them — and
that consumer can absolutely be Python/SQL/notebooks reading the event store. So: TS for the agent +
MCP shim; Python welcome on the analysis side. No polyglot agent.

### Note on the Claude route + telemetry

On the MCP/plugin path the **host model (Claude) is the planner** (docs/05). What we log there are the
tool calls we receive and the Blueprints/validation results we return — still rich analytics. On the
web/PWA path we log the full prompt→response. Either way the sink lives in **core**, so every entry
point is instrumented for free. That's the argument for putting telemetry in core, not in the shim.

## B. Telemetry — this is a design decision to make NOW (cheap seam), full stack LATER

**Decide now. Flying blind on an LLM product is not an option** — evals, regression, cost tracking,
and the AutoResearch outer loop (docs/03) all consume logged `prompt → response → outcome` data. This
is exactly Sekai's #2 problem (unstable agents → need eval systems) and Astrocade's rising quality bar;
note Astrocade ran on an **Amplitude** dashboard. Retrofitting telemetry later means losing all early
data and re-threading every call site.

### Now (minimal, ~one module + wiring) — ✅ SHIPPED (Phase 0+)

Built: `EventSink` + `AgentEvent` types + `nullSink`/`consoleSink`/`createMemorySink`/`newRunId` in
core (`packages/core/src/telemetry.ts`, browser-safe); Node `jsonlSink` in the CLI; wired into
`runInnerLoop` with a `runId` on every event; 3 tests assert the event sequence + runId propagation.
`npm run demo` writes `out/events.jsonl`. Original spec retained below for reference:

- `EventSink` interface in core + a default **JSONL file sink** (zero infra) and a `nullSink`.
- Structured `AgentEvent`s, each tagged with a `runId`/`traceId` so a session is reconstructable:
  - `generation.requested` { prompt, tier, templateId, runId }
  - `plan.completed` { blueprint, rationale, tokens?, latencyMs, costUsd?, modelId? }
  - `judge.completed` { passed, findings[] }
  - `repair.applied` { fromCodes[], changed }
  - `run.finished` { status, repairs, latencyMs }
  - `edit.applied` { controlId, path, tier } ← Design-Mode tweaks (free-tier usage signal)
  - `published` { surface, externalId? }
- Wire it into `runInnerLoop` alongside the existing `Tracer` (Tracer = timing; EventSink = analytics).

### Later

- Swap JSONL → SQLite → Postgres/ClickHouse; dashboards (Amplitude-style); the AutoResearch harness
  reads the event store; cost/$-per-generation rollups; PII/moderation on logged prompts; experiment
  assignment (which prompt/template/manifest variant wins — GrowthBook-style flags could literally
  drive this later).

## Sequencing decision

**Phase 0 (before the runtime):** land the review's safety net (tests + lint/CI, see `06`) **plus the
telemetry seam** (EventSink + JSONL + run/trace ids). Small, high-leverage, and it means every later
experiment is measured from day one. Then build the canvas runtime / real Planner.

## Sources

WebGPU/on-device (context): see `05`. GrowthBook pattern (SDK emits, backend consumes): general.
Astrocade Amplitude usage: newsletter 2026-06-16 (see `00`).
