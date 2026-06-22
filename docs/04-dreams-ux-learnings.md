# Dreams (Media Molecule) — UX Learnings to Steal

_Last updated: 2026-06-21. Screenshots analyzed in `assets/dreams/`._

## Why Dreams matters as a reference

Dreams was arguably the most powerful consumer creation tool ever shipped — and it **under-reached**
("the universe shrugged"). The failure was UX, not capability: the toolset was "like learning a
musical instrument," and **templates were bolted on later to rescue it**. Our edge is the chat 0→1
that removes that mastery curve. So: **steal Dreams' direct-manipulation editing, reject its
blank-canvas mastery requirement.**

## Screenshot 1 — Create-mode radial tool palette (`assets/dreams/ps_createmode.jpg`)

What's on screen: the **"imp" cursor** (the green pom-pom) is the single pointer for everything;
a **floating grid of mode/tool chips** (search, tweak/wrench, move, audio, clip, sculpt "S",
effects, gameplay, etc.); contextual labels ("Effects Mode") appear on hover; a compact
**transport/undo bar** sits bottom-right.

Lessons:

- **One cursor metaphor for all actions** (select, grab, place, possess). Low cognitive load.
- **Modes as a hoverable palette**, not nested menus. Discoverable, label-on-focus.
- **Direct manipulation in the scene** — you grab and pull objects, you don't fill forms.
- Persistent, tiny **undo/redo/transport** — creation feels reversible and safe.

## Screenshots 2 & 3 — The "Tweak Menu" slider stacks (`puppet_tweak1.png`, `puppet_tweak3.png`)

What's on screen: select an object → a **floating panel of labeled sliders** appears.

- Header names the object + the current sub-tab ("Basic Puppet — Overall Movement" /
  "Upper Body Movement"); a **row of tab icons** switches between facets.
- Each row = an **icon + value + slider** (e.g. "2.3 m/s", "5.4 m/s", "114.6°/s", percentages).
- A **Quick Edit** row of preset buttons at the bottom for one-tap common configs.

Lessons (this is the gold the user flagged):

- **Tuning = labeled sliders/toggles on the selected entity**, grouped into tabs. Nobody types
  "make it 12% faster" — they drag. This is the **drawer of tunables** we want.
- **Quick-Edit presets** = templates at the parameter level (one tap to a known-good config).
- **Tabbed facets** keep a deep object approachable (movement / upper body / audio / logic).

## How this maps to our two-mode editor

| Dreams pattern                    | Our equivalent                                                  | Where it's defined                                     |
| --------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------ |
| Imp cursor + radial tool palette  | Scene canvas + mode palette                                     | Editor shell (Shared Core)                             |
| Tweak Menu slider stacks          | **Direct-manipulation drawer** (sliders/toggles)                | rendered from **Genre Pack's Editor Control Manifest** |
| Tabbed facets of an object        | Tabs per Blueprint section (waves / enemies / upgrades / theme) | Blueprint schema                                       |
| Quick-Edit presets                | Parameter-level presets / "feeling" knobs                       | Genre Pack template gallery                            |
| Templates added to rescue reach   | **Land on a template gallery, never a blank box**               | Shared Core onboarding                                 |
| Steep mastery curve (the failure) | **Chat handles 0→1**, drawer handles iterate                    | split by job                                           |

## Design principles for our editor

1. **Templates-first.** Open into a gallery of working, remixable wave-survival games. Pick → playing
   in seconds → tweak. (Dreams' rescue + Astrocade's brainstorm unlock.)
2. **Two modes, split by job.** Chat = create / big structural changes (Dreams couldn't do this).
   Direct-manipulation drawer = tune (Dreams' strength).
3. **Controls are data, not code.** The Genre Pack ships an **Editor Control Manifest** (list of
   tunables: type, range, label, icon, default, which Blueprint field it binds). The shell renders it
   as: web side-drawer of sliders/toggles **or** a controller radial/tweak-menu **or** touch sheet —
   chosen per GTM. **This is why we don't finalize toggle/drawer/controller layout now.**
4. **Edits mutate the Blueprint, not the generated code.** Keeps remix/versioning clean and lets the
   same edit re-target any distribution surface via Target Adapters.
5. **Reversible + safe.** Persistent undo/redo; every state is a forkable version (remix = fork).

## Sources

Dreams overview/imp/DreamShaping: docs.indreams.me/en/game-info/what-is-dreams · en.wikipedia.org/wiki/Dreams\_(video_game) ·
Templates rescue: pushsquare.com/news/2021/11/major-dreams-update-makes-creation-easier-with-templates ·
"universe shrugged": inverse.com/gaming/dreams-anniversary-five-years-playstation-media-molecule ·
Tweak-menu screenshots: dreamskool.wordpress.com (Logic Gadgets: Blank Puppet) · create-mode: pushsquare.com (Dreams 2.44)
