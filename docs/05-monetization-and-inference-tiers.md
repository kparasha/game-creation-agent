# Monetization + Inference Tiers — the F2P unlock

_Last updated: 2026-06-21._

## The core insight (user's, sharpened)

Most edits in a Dreams-style editor are **parameter tweaks on an existing template** — they don't
need an LLM at all. If we route work by cost, we get **true Free-to-Play for play+tweak** and reserve
paid server inference for the genuinely expensive act: **generating net-new templates**. This is the
single biggest lever on unit economics (Sekai's #1 problem: "every generation costs money").

## Three inference tiers

| Tier                             | Who runs it                                                                               | Cost           | Used for                                                                                                                                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Client-side deterministic** | The app (no model)                                                                        | $0             | Direct toggle/slider edits on a template via the **Editor Control Manifest**. ~80% of edits.                                                                                              |
| **2. On-device small LLM**       | Phone/Mac (Apple Foundation Models / Core AI, ~3B, guided generation; or Qwen-0.6B-class) | $0, private    | Translate fuzzy NL ("make it harder, more enemies") → **structured toggle deltas** bound to Manifest fields. Zero token cost.                                                             |
| **3. Server LLM**                | Cloud (Claude API, or **BYOM via OpenRouter**)                                            | $0.10–0.50/req | The expensive creative work only: **generate net-new templates** to seed the remix library, and **author/extend the editor** (new Editor Control Manifest + codegen) for a new sub-genre. |

> Apple's **Foundation Models framework / Core AI (WWDC26)** gives free on-device inference with
> **`@Generable` guided generation** → structured Swift output that maps 1:1 onto our Manifest
> controls. That's exactly Tier 2: NL intent → typed toggle changes, on-device, zero cost.

## Tier 2 delivery — does on-device need a native app? (No.)

Three ways to run the on-device translator, in order of reach:
| Option | Native app? | Notes |
|---|---|---|
| **WebGPU in-browser** (WebLLM / Transformers.js v4) | **No** | Runs a quantized model **in the browser tab**, no server/keys, data stays local. WebGPU ships by default in Chrome/Firefox/Edge/Safari (~83% of traffic). ~71–80% of native speed. **Best fit — works inside the same web/PWA + the H5 surfaces.** Cost: a one-time model download (tens–hundreds of MB). |
| **Chrome built-in Prompt API** (Gemini Nano) | **No** | `LanguageModel.create()` in-browser, zero infra, ~4B model. But **Chrome-desktop only** (no Android/iOS Safari yet) → treat as a fast-path enhancement, not the baseline. |
| **Apple Foundation Models** | **Yes (native)** | Swift-only; **not exposed to Safari/JS**. Free + best integrated, but needs a native iOS/Mac app (or a WKWebView bridge). Reserve for an eventual native client. |

**Decision:** baseline Tier 2 = **WebGPU (WebLLM/Transformers.js)** so it works in the browser and all
H5 surfaces with no native app. Layer Chrome Prompt API as a free fast-path on Chrome desktop, and
Apple Foundation Models only if/when we ship a native client. Graceful fallback: if no on-device path
is available, a fuzzy NL tweak falls through to the server tier (and is the one place it would cost).

## Claude-plugin path — the host _is_ the model (no local model needed there)

When the agent is consumed as an MCP server inside Claude (Code/Desktop) or Cursor, **the host already
provides the model** — the user's Claude does the inference, we provide the game-gen tools. So in the
tool-first/BYOM wedge there's no on-device model to ship at all; "BYOM" is satisfied by the host. The
on-device tier matters for the **consumer web/PWA** path, where there's no host LLM. The two paths are
complementary (see `02`): MCP/plugin = developer wedge (host model); web/PWA = consumer flywheel (WebGPU on-device + server credits).

## Two modes (names the UX)

- **Design Mode** = Tier 1 + Tier 2. Tweak/remix existing templates via the drawer (sliders, toggles,
  nested sub-drawers). **Free.** This is the "kinda design mode" the user described — client-side utils
  edit the Blueprint directly; the on-device LLM only translates words into those same edits.
- **Create Mode** = Tier 3. Generate a brand-new template/sub-genre from a prompt. **Costs credits**
  (or runs on the user's own key via BYOM/OpenRouter). This is the pay-to-play action.

> Nested drawers: each top-level mode opens a drawer, and a selection can open a **sub-drawer**
> (Dreams' "Effects Mode" pattern). The **Editor Control Manifest is hierarchical** (group → tab →
> control → sub-control) so we can deep-crawl Dreams' menu depth later without reworking the shell.
> Keep it shallow for v1.

## Monetization model

- **Prepaid credits** (industry default for AI in 2026; usage-based beats flat). Credits are spent on
  **Create Mode** (server generation) only — Design Mode is free.
- **UI signals "pay to play" implicitly**: a credit meter that draws down on _generate-new_, while
  _play/tweak/remix_ is visibly free. Don't gate fun; gate net-new generation.
- **Creators can earn (implicit, not spelled out)**: earn credits when others remix your template
  (creator-fund style, à la Astrocade's $10M fund). Surface as "your game was remixed → +credits,"
  not as a lecture.
- **BYOM / tool-first wedge**: power users **connect as a Claude/Cursor plugin** and **bring their own
  model** (OpenRouter key) → they bypass our credits for server generation. This is the developer
  acquisition path and pairs with exposing the agent as an MCP server (see `02`).

## Why this is defensible

- **F2P that actually survives**: the free tier costs us ~$0 because it never hits a server model.
- **Costs scale with _creation_, not _consumption_**: 1 paid generation → unlimited free plays/tweaks/
  remixes. That's the opposite of Sekai's "every piece of content costs money."
- **Privacy + latency**: on-device tweaks are instant and private (no round-trip), which makes the
  iterate loop feel native — exactly where Dreams' direct-manipulation shines.

## Architecture hooks (see `03`)

- Tier 1 reads/writes the **Blueprint** directly through the **Editor Control Manifest** (Genre Pack).
- Tier 2 is a thin on-device adapter: NL → Manifest delta (guided generation schema = the Manifest).
- Tier 3 is the **inner-loop server agent** (Planner→Executor→Judge→Repair) that emits new templates;
  the **outer AutoResearch loop** improves the Packs/Manifests that Tier 1/2 then run for free.

## Sources

TikTok HTML runtime / no-app: developers.tiktok.com/doc/develop-your-mini-game ·
Apple on-device models / guided generation: machinelearning.apple.com/research/apple-foundation-models-2025-updates ·
developer.apple.com/videos/play/wwdc2026/326 · AI credits/usage pricing: bvp.com/atlas/the-ai-pricing-and-monetization-playbook
