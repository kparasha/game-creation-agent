# Architecture Review — for EM / Agent-Architect sign-off

_Last updated: 2026-06-21. Reviewer's guide to the scaffold. No fluff; gaps called out honestly._

## 1. Verdict up front

The scaffold is **sound and minimal**. Dependency direction is correct (core depends on nothing),
the contracts are the right ones, and it compiles + runs (`tsc --noEmit` 0 errors; `npm run demo`
publishes an artifact). It is **a skeleton, not a product** — runtime, real models, editor, and tests
are intentionally absent. Sign-off recommended **for the scaffold scope**, with the risks in §7 tracked.

## 2. Pattern: Hexagonal (Ports & Adapters) + Pipeline — and how MVC maps

We did **not** use MVC, because this is an agent runtime, not a CRUD web app. The honest mapping:

| Hexagonal concept      | Here                                                         | MVC analogue (for intuition only)                      |
| ---------------------- | ------------------------------------------------------------ | ------------------------------------------------------ |
| **Domain core**        | `Blueprint` (IR) + `runInnerLoop`                            | **Model** = `Blueprint`; **Controller** = orchestrator |
| **Ports (interfaces)** | `GenrePack`, `TargetAdapter`, `ModelProvider`, agent stages  | —                                                      |
| **Adapters (impls)**   | `genre-wave-survival`, `adapter-web-canvas`, model providers | —                                                      |
| **View**               | `editor-web` (renders the manifest) + generated game         | **View** (not built yet)                               |

So MVC's separation _is_ honored (state vs. orchestration vs. presentation are distinct), but the
governing pattern is **Ports & Adapters** because the whole point is swappable genres/surfaces/models.
The request path is a **Pipeline** (plan → generate → judge → repair → publish).

## 3. Dependency graph (direction is the review's #1 check — it passes)

```
        ┌─────────────────────────── @forge/core ───────────────────────────┐
        │  (zero external deps, zero sibling deps — verified)                 │
        │  Blueprint · agent stages · runInnerLoop · GenrePack · Adapter ·    │
        │  ModelRouter · eval · trace · registry                             │
        └───────▲───────────────▲───────────────▲───────────────▲────────────┘
                │ implements     │ implements    │ consumes      │ exposes
   genre-wave-survival   adapter-web-canvas      cli          mcp-server
   (GenrePack)           (TargetAdapter)     (wires loop)   (tool contract)
```

- **All arrows point inward to core.** No package imports a sibling except through core's interfaces.
- Verified: `grep @forge/ packages/core/src` → only comments; core has no runtime coupling outward.
- This is the **Dependency Inversion Principle** in practice: core defines ports; leaves implement them.

## 4. Module inventory (size = honesty check against "fluff")

| Package               | LOC | Responsibility                                                                            | Verdict                                                |
| --------------------- | --: | ----------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `core`                | 424 | Contracts + orchestrator + registries + trace                                             | Right-sized; all interface, little logic               |
| `genre-wave-survival` | 413 | The one genre, fully specified (schema/validators/manifest/templates/regression/planning) | Largest by design — the genre is where substance lives |
| `adapter-web-canvas`  |  70 | Blueprint → HTML5 (runtime stubbed)                                                       | Thin, as intended                                      |
| `cli`                 |  99 | End-to-end loop demo with stubs                                                           | Thin                                                   |
| `mcp-server`          |  65 | Tool contract only                                                                        | Contract, no impl yet                                  |

No dead code, no speculative abstractions beyond the three seams (genre / surface / model) the product
demonstrably needs. **No fluff found.**

## 5. SOLID & guideline checklist

| Principle / guideline     | Status       | Evidence                                                                     |
| ------------------------- | ------------ | ---------------------------------------------------------------------------- |
| **S**ingle responsibility | ✅           | One file per concern in core; pack split by concern                          |
| **O**pen/closed           | ✅           | Add genre/surface/model without touching core                                |
| **L**iskov                | ✅           | All adapters honor their port contracts                                      |
| **I**nterface segregation | ✅           | Planner/Executor/Judge/Repairer are separate small interfaces                |
| **D**ependency inversion  | ✅           | Core defines ports; leaves depend on core only                               |
| Separation of concerns    | ✅           | IR vs. orchestration vs. codegen vs. presentation all distinct               |
| Data-driven config        | ✅           | `EditorControlManifest` is data → renders per platform                       |
| Typed boundaries          | ✅           | `strict: true`, generics carry `TSpec` end-to-end                            |
| Deterministic-first       | ✅           | Validators run before any model (free Judge floor)                           |
| Observability seam        | ✅           | `Tracer`/`Span` (timing) + `EventSink`/`AgentEvent` (analytics, JSONL); swap for OTel/DB later |
| Error handling            | ✅           | Typed `AgentError` (infra) separate from `ValidationFinding` (content); loop fails closed + emits `error.raised` |
| Tests                     | ✅           | 14 tests (validators, templates, repair, adapter, inner-loop happy/repair/fail-closed) |
| Lint / format / CI        | ✅           | ESLint flat config + Prettier + GitHub Actions (typecheck→lint→test)         |

## 6. Inner-loop correctness (trace it in `orchestrator.ts`)

`plan → HITL#1 → (build → judge → repair)* bounded by maxRepairs → HITL#2 → publish`.

- Terminates: loop breaks on pass, on repair budget, or on no-progress repair. ✅
- Fails closed: unpassed judge ⇒ `status:'failed'`, never publishes. ✅
- HITL hooks optional and correctly placed (Blueprint pre-codegen; Build pre-publish). ✅

## 7. Risks / gaps an EM should track

1. ~~No tests.~~ **DONE (Phase 0).** 14 tests: validators, templates+manifest paths, deterministic
   repair, adapter build, and inner-loop happy/repair/fail-closed. Regression-corpus runner with a
   real Planner lands with the Planner.
2. ~~No lint/CI.~~ **DONE (Phase 0).** ESLint flat config + Prettier + GitHub Actions.
3. **Validators are heuristic.** `estimateTimeToDeathSec` is a rough proxy; fine as a gate, labelled
   as such; replace with a real headless sim when the runtime exists. _Medium._
4. **Generics rely on method bivariance** where adapter (`TargetAdapter<unknown>`) is passed as
   `TargetAdapter<Spec>` (one cast in `cli`/tests). Acceptable; documented. _Low._
5. **Stub coverage** is now small: **runtime is real** (headless boot test), **Planner is real**
   (`createModelPlanner` + OpenRouter/BYOM, mock-tested), **repairer real**. Remaining stubs: MCP
   transport, on-device provider, editor-web. _Note:_ `openRouterProvider` is unit-tested via injected
   fetch but **not yet validated against the live API** (no key in CI). _Tracking._
6. ~~No error taxonomy for infra.~~ **DONE.** Typed `AgentError` (code/stage/retryable), separate from
   `ValidationFinding`; loop fails closed + emits `error.raised`. Tested.
7. **Telemetry seam shipped** ([docs/07](07-telemetry-and-integration.md)): `EventSink` + JSONL, runId
   on every event. _Remaining:_ token/$/latency fields populate when the **server tier** is wired
   (`plan.completed` already has the `modelId`/`tokens`/`costUsd` slots). _Medium._

## 8. What to verify when reviewing (tick-list)

- [ ] `npm install && npm run typecheck` → 0 errors.
- [ ] `npm run lint` → 0 errors; `npm test` → 14 passing.
- [ ] `npm run demo -- "..."` → `status: published`, writes `out/index.html`.
- [ ] `grep -rn "@forge/" packages/core/src` → comments only (no inward dep violations).
- [ ] Open `core/src/orchestrator.ts` — confirm loop termination + fail-closed.
- [ ] Open `genre-wave-survival/src/index.ts` — confirm validator codes ↔ failureTaxonomy keys align.
- [ ] Confirm `manifest.ts` control `tier` fields match the F2P intent (tweaks = client-deterministic).

## 9. Recommendation

Scaffold **approved**, and **Phase 0 landed** (§7.1 tests + §7.2 lint/CI ✅; repair loop made real at
the client-deterministic tier). Safety net is in place. Next: the telemetry `EventSink` seam (docs/07),
then the generic canvas runtime and the real (model-backed) Planner.
