# Product Thesis — AI Game-Creation Coding Agent

_Last updated: 2026-06-21_

## The bet (from Sekai + Astrocade)

Everyone wants to create; almost nobody can. AI collapses the creation cost to ~zero.
When creation is free, **value moves off the artifact** and onto **taste, community, remix,
and whoever owns the moment of discovery** (Astrocade's own conclusion). So the coding agent
is table stakes; the moat is the loop around it (feed, remix, recsys, creator economy).

## Source learnings

### Astrocade (TikTok for games) — newsletter 2026-06-16

- 5M MAU, 140M game plays, $56M Sequoia, 8 months post-launch, team of 13.
- **Won by narrowing the generation space, not waiting for better models.** 2023 MVP was
  template-based, single genre (platformer). "AI couldn't generate full games, so they designed
  around the limitation." → **Core lesson: constrain output to a genre/DSL to hit a quality bar.**
- **Game-specific editors**: AI assembles a custom toolkit per genre (racing ≠ platformer).
- **Specialized agents** collaborate per domain: art, UI, narrative, audio, mechanics.
- **AI brainstorming flow** kills the blank-page problem → produces a **game blueprint** (a spec).
- **One-tap remixing**: every game is a starting point → content library compounds.
- Their hard parts are **classic consumer problems**, not model/compute/capital: rising quality
  bar, creator community, recsys (75K+ games), UX for a brand-new category (no pattern library).
- Audience: women 20–40, leisure like Instagram (not Steam gamers).

### Sekai (live inside AI worlds) — newsletter 2025-09-23

- 1M users, 1.5–2 hrs/day, $10M a16z/Mayfield. 15M+ games created post-pivot to vibe games.
- Start with **narrowest community w/ strongest unmet desire** (anime fanfic / Genshin), expand.
- **MVP magic = specificity** (exact imagination rendered faithfully).
- Users didn't want 15-sec clips → they wanted **persistent worlds**. Read true intent.
- Stated hard problems map 1:1 to a coding agent: (1) **every generation costs money** (unlike
  free UGC uploads), (2) **agents are unstable → need extensive eval systems**, (3) moderation.

### JD signal (Sekai AI Agent Engineer — Coding Agent)

The role IS the slice: build **prompt → plan → generate → run/validate → repair → publish**,
plus eval loops (harness, regression, failure taxonomy), model routing/benchmarking, observability.

## Decisions locked so far

1. **Vertical slice genre = wave-survival** (Vampire-Survivors-shaped: survive escalating waves,
   pick upgrades). Research-backed: Astrocade #1 genre + Roblox top genre (steal-and-defend /
   idle-grow). Highest play-time-per-generation → best unit economics under "AIGC isn't free."
   See `01-company-landscape.md` and the genre rationale.
2. **Web-first distribution** (own the flywheel), with walled gardens as later export channels.
   See `02-distribution-api-matrix.md`.
3. **Modular architecture**: genre-agnostic Shared Core + pluggable **Genre Packs** +
   **Target Adapters** (one per distribution/runtime surface). See `03-agent-architecture.md`.
4. **UX = templates-first, two modes**: **Design Mode** (free tweak/remix) + **Create Mode** (paid
   generate-new). Controls declared as data in the Genre Pack so the same manifest renders per platform.
   See `04-dreams-ux-learnings.md`.
5. **Three inference tiers → true F2P**: client-deterministic (free) + on-device small LLM (free,
   NL→toggles) + server LLM (paid, generate net-new templates / BYOM via OpenRouter).
   See `05-monetization-and-inference-tiers.md`.
6. **Prepaid credits**, spent only on Create Mode; creators **earn** credits via remixes (implicit UI).
   **Tool-first wedge**: connect as Claude/Cursor plugin + BYOM; expose agent as MCP server.
7. **Distribution sequencing**: Tier A own web/PWA → fan the **same HTML5 build** to Telegram/Discord/
   Reddit (seed organic demand while TikTok's ~4–6wk review pends) → MCP wedge → Roblox → ads/Twitch →
   Steam graduation. TikTok needs **no native app** (HTML5 webview). See `02-distribution-api-matrix.md`.

## Open / to finalize

- GTM surface (decides toggle/drawer vs controller layout) — intentionally not finalized.
- `Moonscale AI` / `Moonlake AI` — named by user, not yet verified; flagged in landscape doc.
- Deep-crawl of Dreams' nested menus — deferred; shell already supports hierarchical Manifest.
