# Context Docs — AI Game-Creation Coding Agent

Living context for building a no-code game-creation coding agent (Astrocade/Sekai-style,
horizontal-tooling like Lovable/Replit but vertical for games).

## Index

- [`00-product-thesis.md`](00-product-thesis.md) — the bet, Sekai + Astrocade learnings, JD signal, locked decisions.
- [`01-company-landscape.md`](01-company-landscape.md) — comps, world models, middleware, walled gardens; genre rationale.
- [`02-distribution-api-matrix.md`](02-distribution-api-matrix.md) — distribution × programmatic matrix; the MCP "both at once" insight.
- [`03-agent-architecture.md`](03-agent-architecture.md) — Planner/Executor/Judge inner loop + Karpathy AutoResearch outer loop; HITL; what's in the slice.
- UX reference notes (prior-art creation-tool patterns; templates-first two-mode editor) are kept **locally** in `docs/_local/` (gitignored).
- [`05-monetization-and-inference-tiers.md`](05-monetization-and-inference-tiers.md) — 3 inference tiers, Design vs Create mode, prepaid+earn, BYOM, F2P unlock, on-device delivery (WebGPU vs native).
- [`06-architecture-review.md`](06-architecture-review.md) — EM/architect review of the code scaffold: pattern, dep graph, SOLID checklist, risks, sign-off tick-list. See also [`../ARCHITECTURE.md`](../ARCHITECTURE.md).
- [`07-telemetry-and-integration.md`](07-telemetry-and-integration.md) — MCP shim vs core service layering; telemetry (EventSink) as a now-decision; Phase 0 sequencing.

## TL;DR decisions

1. Vertical slice genre = **wave-survival** (research-backed, best unit economics).
2. **Web-first** (Tier A); fan the **same HTML5 build** to Telegram/Discord/Reddit while TikTok reviews; Steam to graduate breakouts.
3. **Modular**: Shared Core + pluggable **Genre Packs** + **Target Adapters** (HTML5 surfaces all eat one build).
4. UX = **templates-first, two modes**: **Design Mode** (free tweak) + **Create Mode** (paid generate). GTM-flexible.
5. Agent = **inner loop in v1** (Planner→Executor→Judge→Repair + HITL); **AutoResearch outer loop Phase 2**.
6. **3 inference tiers → true F2P**: client-deterministic + on-device LLM (free) vs server LLM (paid/BYOM).
7. **Prepaid credits** on Create Mode only; creators earn via remixes; **tool-first MCP/BYOM wedge** alongside consumer flywheel.

## Open

- GTM surface (gates control layout). Deeper nested-menu crawl (deferred).
- Verify `Moonscale AI` / `Moonlake AI` (named by user, not found — see 01).
