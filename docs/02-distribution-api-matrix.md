# Distribution × Programmatic Matrix

_Last updated: 2026-06-21._

Goal the user set: **distribution AND programmatic access at the same time.** The key is that
"where it runs," "where it's discovered," and "how we push to it" are separable. Our architecture's
**Target Adapter** layer is exactly the seam that lets one Blueprint fan out to many surfaces.

## The matrix

Legend — Programmatic: 🟢 full API/MCP to publish · 🟡 partial/manual-assisted · 🔴 per-app/manual only.

| Surface                     | Distribution reach  | Programmatic publish                                          | AIGC allowed?                                                                                               | Owns flywheel?             | Tier                                                                               |
| --------------------------- | ------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------- | ---------------------------------------------------------------------------------- |
| **Own web app / PWA**       | You build it        | 🟢 it's yours                                                 | Yes                                                                                                         | **You**                    | **A — home base**                                                                  |
| **Roblox**                  | Massive             | 🟢 Open Cloud API + **native MCP in Studio**                  | Yes (Studio = final moderation authority)                                                                   | Roblox                     | **B — best both-worlds**                                                           |
| **TikTok Mini Games**       | Massive             | 🟢 Mini Games SDK (TTMinis) + Server APIs (OAuth)             | Yes (HTML5)                                                                                                 | TikTok                     | **B** (4–6 wk review)                                                              |
| **Telegram Mini Apps**      | Massive (chat)      | 🟢 Bot API + HTML5 Mini App, **no app-store install**         | Yes (HTML5)                                                                                                 | Telegram                   | **B — fastest to ship** (no heavy review; Stars currency; crypto/TON-skewed)       |
| **Discord Activities**      | Large (communities) | 🟢 Embedded App SDK (web app in iframe)                       | Yes (HTML5)                                                                                                 | Discord                    | **B — social/co-play** (GDC'26 added Game Shop + Social Commerce)                  |
| **Reddit Games (Devvit)**   | Large (subreddits)  | 🟢 Devvit Web (React/Phaser/three.js/Godot) interactive posts | Yes                                                                                                         | Reddit                     | **B — community-native** (App Review; Dev Funds 2026 pays creators)                |
| **Twitch Extensions**       | Streamer-led        | 🟢 Extensions API/SDK                                         | Yes                                                                                                         | Twitch                     | **C — needs seeding** (streamers = the vector; post-PMF amplifier, not cold-start) |
| **Facebook Instant Games**  | Declining           | 🟡 HTML5 SDK                                                  | Yes                                                                                                         | Meta                       | **D — waning, deprioritize**                                                       |
| **App Store / Google Play** | Massive             | 🟢 your creator app ships here (AI Dungeon precedent)         | Yes (your app)                                                                                              | You (app), store (billing) | **A′ — wrap own app**                                                              |
| **Fortnite / UEFN**         | Massive             | 🟡 Verse APIs, no gen pipeline                                | Yes (build in UEFN)                                                                                         | Epic                       | **C — later/partnership** (40% pool, 100% promo thru 2026)                         |
| **Meta Quest / Horizon**    | Mid (VR)            | 🟡 unified store, API review required                         | Yes w/ review                                                                                               | Meta                       | **C — VR niche**                                                                   |
| **Steam**                   | Massive             | 🔴 per-app, $100, review                                      | Yes **with disclosure** (Jan 2026 rewrite: player-facing only; dev tools exempt; live-gen needs guardrails) | Valve                      | **D — graduation channel**                                                         |
| **Epic Games Store**        | Large               | 🔴 per-app curation                                           | Yes                                                                                                         | Epic                       | **D**                                                                              |
| **Amazon Luna**             | Small               | 🔴 no UGC surface (cut external subs/purchases)               | —                                                                                                           | Amazon                     | **D — not relevant**                                                               |
| **PlayStation / Xbox**      | Massive             | 🔴 cert-gated, restrictive                                    | Restrictive                                                                                                 | Sony/MS                    | **D — not v1**                                                                     |
| Unity / Unreal / Godot      | n/a (engines)       | 🟢 MCP servers (output target)                                | n/a                                                                                                         | —                          | **Output adapter, not distribution**                                               |

## Strategic reading

- **Tier A (own web/PWA):** primary. Full programmatic control, you own discovery/recsys/remix/
  payments — the actual moat. Wrap the _creator app_ into App Store / Google Play (Tier A′) for reach.
- **Tier B (programmatic + audience):** the genuine "distribution AND programmatic" winners.
  - **Roblox** is the standout: Open Cloud API _and_ a **native MCP server in Studio** — our agent
    can target it through the same Target-Adapter seam we use for engines. Borrow huge audience.
  - **TikTok Mini Games**: HTML5 + SDK + server APIs → our web Blueprint can ship nearly as-is into
    the single biggest discovery engine on earth. Review latency is the cost.
  - **Twitch Extensions**: streamer-as-distribution; good for co-play / interactive overlays.
- **Tier C (walled gardens, weak/partial programmatic):** UEFN biggest money, most closed; Meta VR niche.
- **Tier D (finished-game stores):** distribution only, per-app, manual → use to **graduate** a
  breakout title (premium SKU) with AI disclosure; never the flywheel.

## The MCP insight (two directions)

1. **Consume platform MCPs as Target Adapters** — Roblox built-in MCP, Unity/Unreal/Godot MCP.
   Our agent emits a Blueprint, the adapter drives the platform's MCP to assemble + publish.
2. **Expose our agent AS an MCP server / API** — then any creator tool (or Claude/Cursor user) can
   "generate a game" through us. The agent itself becomes distributable as a developer/creator tool;
   it can upload on the creator's behalf (creator-of-record stays the human).
   → Net: "distribution + programmatic at once" is **architectural**, not a single-surface choice.
   Build the Target-Adapter seam once; speak MCP/API on both sides.

## H5 "no app required" insight — they all eat the same build

**TikTok Mini Games does NOT need a native mobile app.** HTML runtime = a web build runs in TikTok's
in-app webview (HTML5/JS/CSS, ≤50MB recommended, load the Mini Games SDK). Native runtime
(Cocos/Laya/Unity export) is the _performance_ option, not a requirement. The same is true of
**Telegram, Discord Activities, Reddit Games, Facebook Instant** — all are **HTML5 surfaces**. So
our **one web Blueprint → one HTML5 build** fans out across all of them via thin Target Adapters
(each just adds that surface's SDK + auth + payments shim). Build once, distribute many.

### The "iterate while TikTok reviews" play

TikTok review is ~4–6 weeks. Don't idle. Ship the **same HTML5 build** to the **low-friction H5
surfaces** in parallel to seed organic demand and iterate:

- **Telegram Mini Apps** — fastest (bot-based, no app-store review gate), viral mechanics. ⚠ audience
  is crypto/TON-skewed; tap-to-earn churns hard (Hamster Kombat 185M→13M MAU). Use for speed, watch retention quality.
- **Discord Activities** — social/co-play, roster + voice; becoming a real channel (Game Shop @ GDC'26).
- **Reddit Games (Devvit)** — community-native, and **matches Sekai/Astrocade's Reddit-origin growth
  playbook** (seed in the exact subreddits your genre lives in). Has App Review + creator Dev Funds.
  → Net: **Tier A (own web) is the home base; bundle the Tier B H5 surfaces to test organic demand;
  then turn on ads once a build proves out.** Twitch is Tier C — turn on after seeding (needs streamers).

## Exposing our agent AS an MCP server — discovery & competition reality

- **Category is novel** (few "generate-a-game" MCPs) but **discovery is brutally fragmented**:
  Glama (6k+), mcp.so (20k+), PulseMCP (18k+), Smithery (8k+), mcpservers.org (4k+). People build
  tools (mcp-submit) just to spam-list across 10+ registries. **MCP discovery alone won't drive
  consumer growth.**
- **Smithery** = the "Docker Hub of MCP" (CLI publish + managed OAuth via agent.pw) → primary listing.
- **Installation friction kills it**; trust is a moat (scans found 36.7% SSRF / 43% unsafe exec /
  41% no-auth across servers) — ship clean + authed.
- **So:** exposing as MCP = the **tool-first / developer wedge** (BYOM, OpenRouter, "connect as a
  Claude/Cursor plugin"), NOT the consumer flywheel. The two aren't isolated: **bundle the Tier B
  H5 distribution adapters behind one MCP/tool** so "build + test demand" is a single surface.

## Recommended sequencing

1. **Web/PWA** (own flywheel) — slice ships here. [Tier A]
2. **Fan out the same HTML5 build** to **Telegram → Discord Activities → Reddit Games** to seed
   organic demand while **TikTok Mini Games** review pends. [Tier B]
3. **Expose our MCP/API** (Smithery + BYOM/OpenRouter) — developer wedge, bundled with the Tier B adapters.
4. **Roblox adapter** (Open Cloud / native MCP) — borrow the biggest UGC audience.
5. **Ads on** once a build proves retention; **Twitch** as post-seed amplifier. [Tier C]
6. **Steam graduation** for breakout titles; UEFN / Quest / consoles — partnership-led, later. [Tier D]

## Sources

Steam AI policy (Jan 2026): pcgamer.com/software/ai/steam-updates-ai-disclosure-form · store.steampowered.com/news/group/4145017 ·
Roblox Open Cloud + MCP: create.roblox.com/docs/cloud · promptblox.ai/blog/publish-roblox-game-without-studio · dev.to/grove_chatforest ·
TikTok Minis: developers.tiktok.com/doc/develop-your-mini-game · UEFN economy: thecreativeblok.com/fortnite-developers-can-sell-in-game-items-via-uefn-starting-december-2025 ·
Meta Quest: developers.meta.com/horizon/policy/distribution-options · Amazon Luna: en.wikipedia.org/wiki/Amazon_Luna
