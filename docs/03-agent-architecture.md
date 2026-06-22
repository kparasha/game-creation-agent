# Agent Architecture — Planner / Executor / Judge + AutoResearch

_Last updated: 2026-06-21._

## Short answer

Yes to the roles — but there are **two loops at different timescales**, and conflating them is the
classic mistake. Don't over-decompose the runtime (latency + cost = Sekai's #1 problem); do invest
in the offline eval loop early (the JD demands it; Astrocade: "quality bar constantly rising").

## Loop 1 — Inner loop (per user request, runtime). THIS IS THE SLICE.

```
 user prompt / template pick
        │
   ┌────▼─────┐   ┌──────────┐   ┌───────────────┐   ┌────────┐   ┌─────────┐
   │ PLANNER  │──▶│ EXECUTOR │──▶│ JUDGE          │──▶│ REPAIR │──▶│ PUBLISH │
   │ chat →   │   │ Blueprint│   │ deterministic  │   │ feed   │   │ remix-  │
   │ Blueprint│   │ → codegen│   │ validators +   │   │ fails  │   │ able    │
   │ (the IR) │   │ (adapter)│   │ LLM-as-judge   │   │ back   │   │ artifact│
   └────▲─────┘   └──────────┘   └───────────────┘   └────────┘   └─────────┘
        │  HITL: human edits/approves Blueprint        │ HITL: human can reject a build
        └──────────────────────────────────────────────┘
```

- **Planner**: chat → typed **Blueprint** (genre IR). Beats the blank page. HITL #1 = human edits
  the Blueprint (best place for human control: structured, cheap, pre-codegen).
- **Executor**: Blueprint → runtime code via the genre's codegen templates + Target Adapter.
  Optionally fan out to **specialized sub-agents** (mechanics / art / narrative / audio) — but ONLY
  where Blueprint sections are genuinely independent + parallelizable (Astrocade's approach). Default
  to a single strong model; split only when it pays for itself.
- **Judge**: mostly **deterministic validators** (boots? damageable? waves escalate? upgrades
  reachable? survivable-not-trivial via fast-forward sim? FPS ok?) + **LLM-as-judge** for subjective
  quality (fun/coherence/theme match). Cheap-first: deterministic gates before any LLM judging.
- **Repair**: feed the failure taxonomy back into Planner/Executor; bounded retries.
- HITL #2 = human rejects/accepts the generated build (Executor output).

### Decomposition discipline (cost/latency)

- One model does plan+generate where possible. Separate Judge = cheap validators + occasional LLM-judge.
- Specialized sub-agents are an **optimization**, not a default. Each extra agent = latency + tokens.
- Keep deterministic validation as the first gate — it's free and catches most failures (Sekai's
  "agents are unstable" → make the _target_ constrained so validation is deterministic).

## Loop 2 — Outer loop (offline, self-improvement). The Karpathy AutoResearch analogy.

This is **NOT** per-user. It improves the **Genre Pack itself** (prompts, templates, validators).
Maps to AutoResearch's Generator / Executor / **Evaluator (judge)** / Memory, and to the JD's
"evaluation loops, regression testing, failure taxonomy."

```
  propose change to Pack (prompt/template/validator)        ← Planner-as-RESEARCHER
        │
   run regression prompt-set  (BATCH EXECUTION)             ← Executor over the eval corpus
        │
   measure pass-rate / quality / cost deltas                ← AGENT-AS-JUDGE over aggregate
        │
   keep if better, roll back if worse, log to memory        ← Memory / synthesis
        │
   HITL: human reviews proposed Pack change before merge    ← HITL #3
```

- **Planner doubles as Researcher**: per-request it plans one game; offline it plans experiments.
- **Agent-as-Judge appears in both loops**: inner = judge one artifact; outer = judge aggregate
  regression results.
- This is what compounds quality over time and directly attacks "what was good last quarter isn't
  good enough now."

## What's in the vertical slice vs. fast-follow

| Component                                                 | Slice (v1)        | Fast-follow             |
| --------------------------------------------------------- | ----------------- | ----------------------- |
| Inner loop Planner→Executor→Judge→Repair                  | ✅                | —                       |
| HITL on Blueprint (#1) + build accept/reject (#2)         | ✅                | —                       |
| Deterministic validators + small failure taxonomy         | ✅                | —                       |
| Regression prompt-set + eval harness                      | ✅ (seed corpus)  | grow corpus             |
| LLM-as-judge for subjective quality                       | 🟡 minimal        | expand                  |
| Specialized sub-agents (art/mechanics/...)                | ❌ (single model) | add when parallelizable |
| **AutoResearch outer loop (autonomous Pack improvement)** | ❌                | ✅ Phase 2              |
| Model router / cost-latency benchmarking                  | 🟡 basic          | full routing            |
| Tracing / metrics / observability                         | ✅ basic          | full                    |

## How this maps onto the modular design (see also 04 UX, 00 thesis)

- **Shared Core** owns: orchestrator, both loops' plumbing, model router, eval harness, tracing,
  Blueprint engine, editor shell, remix/versioning. Built once, genre-agnostic.
- **Genre Pack** (per genre) owns: Blueprint schema, Planner prompts/few-shots, validators +
  taxonomy, **Editor Control Manifest**, template gallery + regression set.
- **Target Adapter** (per surface) owns: Blueprint → runtime code (web now; Roblox MCP / Unity /
  Unreal / Godot / TikTok later). Distribution is just another adapter.
- Adding a genre = author a Pack. Adding a channel = author an Adapter. Core never changes.

## Sources

Karpathy AutoResearch / planner-executor: fortune.com/2026/03/17/andrej-karpathy-loop-autonomous-ai-agents-future ·
verdent.ai/guides/what-is-autoresearch-karpathy · datacamp.com/tutorial/guide-to-autoresearch ·
kingy.ai/ai/autoresearch-karpathys-minimal-agent-loop
