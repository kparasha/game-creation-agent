# Company Landscape — AIGC / World-Model / AI-Entertainment

_Last updated: 2026-06-21. Sources linked at bottom._

Grouped by what they actually are, because "AI games" lumps together very different bets.

## A. Consumer vibe-game creation platforms (our direct comps)

| Company                            | What it is                                             | Distribution                      | Programmatic / API                    | Notes                                                                       |
| ---------------------------------- | ------------------------------------------------------ | --------------------------------- | ------------------------------------- | --------------------------------------------------------------------------- |
| **Astrocade**                      | TikTok-for-games; AI 2D mini-games, remix, social feed | Own web app                       | None public                           | 5M MAU, 140M plays, $56M Sequoia. Survival/tycoon/tower-defense top genres. |
| **Sekai**                          | Live-in AI worlds; pivoted to vibe game creation       | Own app                           | Hiring for coding-agent runtime       | 1M users, 15M+ games. Anime-origin.                                         |
| **Rosebud AI**                     | Text→2D/3D/voxel browser games; visual-novel/RPG/cozy  | Own web + shareable links         | Shareable links; creator monetization | Strong on **narrative/romance/RPG** (emotional agency, but lower replay).   |
| **Latitude (AI Dungeon → Voyage)** | LLM-driven RPG / story worlds                          | Web + **App Store + Google Play** | Voyage platform for custom RPGs       | First to prove an LLM can run a playable RPG (2019).                        |
| **SEELE**                          | Text→full 3D game prototype in 60–90s                  | Web                               | —                                     | Prototype-speed play.                                                       |

## B. World models (generate explorable 3D space — adjacent, "backpocket")

| Company                     | Product                                                                                    | Distribution                              | Notes                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------- | --------------------------------------------------------------------------------------------- |
| **World Labs** (Fei-Fei Li) | **Marble** — persistent, _downloadable_ 3D worlds; hybrid 3D editor (block-out → AI fills) | Web app, free→$95/mo; **export/download** | $1B raise Feb 2026 (AMD, NVIDIA, Autodesk). Autodesk anchor → CAD/3D-asset distribution path. |
| **Decart**                  | **Oasis** — real-time playable AI-generated world, very low latency                        | Free demos                                | Gaming/sim/robotics framing.                                                                  |
| **Odyssey**                 | On-the-fly explorable worlds                                                               | Free demos                                | Streamed, not persistent.                                                                     |
| _Niantic Spatial_           | Spatial/AR world model                                                                     | —                                         | **Robotics/AR use case — keep in backpocket, not relevant to game-creation slice.**           |

## C. AI middleware (NPCs / characters — API-first, not creation platforms)

| Company         | What                                      | Distribution model         |
| --------------- | ----------------------------------------- | -------------------------- |
| **Inworld AI**  | NPC personality/memory/voice as a dev API | B2B API into others' games |
| **Convai**      | Conversational NPC API                    | B2B API                    |
| **NVIDIA ACE**  | Real-time avatar voice/face/convo         | SDK into engines           |
| **Charisma AI** | Interactive-character narrative           | API/SDK                    |

## D. Walled-garden creation ecosystems (huge audience, you're a tenant)

| Platform              | Creation model                 | Programmatic path                                                                | Audience                                  |
| --------------------- | ------------------------------ | -------------------------------------------------------------------------------- | ----------------------------------------- |
| **Roblox**            | Luau in Studio                 | **Open Cloud API + native built-in MCP in Studio** (only engine with native MCP) | Massive; tycoon/sim/obby top genres       |
| **Fortnite / UEFN**   | Verse + UEFN                   | Verse APIs; no official programmatic-generation pipeline                         | Massive; 40% engagement pool + item sales |
| **TikTok Mini Games** | HTML5 mini-games inside TikTok | **Mini Games SDK (TTMinis) + Server APIs (OAuth)**                               | Massive; 4–6 wk review                    |
| **Twitch Extensions** | Overlay/panel mini-experiences | Extensions API/SDK                                                               | Streamer-driven distribution              |

## E. Engine + tooling (output targets, not distribution by themselves)

- **Unity** — biggest MCP ecosystem (e.g. unity-mcp, 25+ tools, batch execution).
- **Unreal** — deepest editor MCP integration (actors, Blueprints, viewport).
- **Godot** — most comprehensive single-server MCP (95+ tools: scene, GDScript LSP, debugger, input injection).
- **Roblox** — native built-in MCP (see D).
  > These are **runtime/output adapters**, distribution-agnostic. Relevant when we add 3D/premium genres.

## Genre rationale (why wave-survival for the slice)

Cross-platform retention + remix signal converges on the **survival / idle-grow / steal-and-defend**
loop: Astrocade #1 (survival + quirky upgrades), Roblox top-100 by visits (Steal a Brainrot,
Grow a Garden). Wave-survival is: mechanically tiny (small Blueprint, cheap to generate **and**
deterministically validate), high replay/remix-by-reskin, long sessions per generation
(best unit economics under "AIGC isn't free"). Narrative/visual-novel (Rosebud's strength) is the
opposite trade — emotionally engaging but consumed once → poor plays-per-generation.

## To verify

- **`Moonscale AI` / `Moonlake AI`** — named by user; not found in search. Possibly stealth,
  misremembered, or a different spelling (cf. **Moonvalley** = AI video model). Flag and confirm.

## Sources

World Labs/Marble: techcrunch.com/2025/11/12/fei-fei-lis-world-labs-speeds-up-the-world-model-race-with-marble · worldlabs.ai/blog/funding-2026 ·
Decart/Odyssey: techloy.com/3-startups-that-are-building-world-models-ais-next-frontier ·
Latitude/Voyage: techcrunch.com/2026/04/21/voyage-is-an-ai-rpg-platform · Inworld: nfx.com/post/ai-games ·
Roblox MCP: dev.to/grove_chatforest/game-engine-3d-development-mcp-servers · Engine MCP: thedailyworkflow.com/mcp/tutorial/best-mcp-servers-for-gaming ·
TikTok Minis: developers.tiktok.com/doc/develop-your-mini-game · Astrocade/Roblox genres: game-ace.com/blog/roblox-trends-in-gaming · naavik.co/deep-dives/the-state-of-ugc-games-2026
