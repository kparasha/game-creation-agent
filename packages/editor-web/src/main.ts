import './style.css';
import pack, {
  deterministicRepairer,
  waveSurvivalPlanner,
  type WaveSurvivalSpec,
} from '@forge/genre-wave-survival';
import webCanvasAdapter from '@forge/adapter-web-canvas';
import {
  runInnerLoop,
  createMemorySink,
  type Blueprint,
  type BlueprintTemplate,
  type Control,
  type ControlGroup,
  type Executor,
  type Judge,
  type TargetAdapter,
  type ValidationFinding,
} from '@forge/core';
import { openRouterProvider, createModelRouter } from '@forge/providers';
import { getByPath, setByPath } from './util';

type Spec = WaveSurvivalSpec;

// The single source of truth the whole UI edits. Edits mutate the Blueprint, never the generated code.
let blueprint: Blueprint<Spec> = structuredClone(pack.templates[0]!.blueprint);

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <header>
    <h1>🎮 Forge — <span>Wave Survival Studio</span></h1>
    <div class="create">
      <input id="prompt" placeholder="Describe a new game…  e.g. a spooky haunted survival" />
      <button id="gen">Generate</button>
      <details class="model">
        <summary>model ▸</summary>
        <input id="key" type="password" placeholder="OpenRouter key (in-memory only)" />
        <input id="model" placeholder="anthropic/claude-sonnet-4.6" />
      </details>
    </div>
  </header>
  <main>
    <aside id="gallery" class="panel"><h2>Templates</h2><div id="cards"></div></aside>
    <section id="stage"><iframe id="preview" title="game preview"></iframe><div id="findings"></div></section>
    <aside id="drawer" class="panel"><h2>Design — tune (free, offline)</h2><div id="controls"></div></aside>
  </main>
  <footer id="status">Pick a template, then tune with the Design drawer →  (tuning is free & offline; Generate needs a model key).</footer>
`;

const pick = <T extends HTMLElement>(sel: string): T => app.querySelector<T>(sel)!;
const preview = pick<HTMLIFrameElement>('#preview');
const cardsEl = pick('#cards');
const controlsEl = pick('#controls');
const findingsEl = pick('#findings');
const statusEl = pick('#status');

function setStatus(msg: string, kind: 'info' | 'error' = 'info'): void {
  statusEl.textContent = msg;
  statusEl.dataset.kind = kind;
}

// ---- preview (deterministic codegen — runs entirely client-side, no model) ----
let previewTimer: number | undefined;
async function refreshPreview(): Promise<void> {
  const out = await webCanvasAdapter.build(blueprint);
  preview.srcdoc = out.files[out.entry]!;
}
function schedulePreview(): void {
  window.clearTimeout(previewTimer);
  previewTimer = window.setTimeout(() => void refreshPreview(), 200);
}

function validateAndShow(): void {
  const findings: ValidationFinding[] = [
    ...pack.validateBlueprint(blueprint),
    ...pack.validators.flatMap((v) => v.check(blueprint) as ValidationFinding[]),
  ];
  findingsEl.innerHTML = '';
  if (findings.length === 0) {
    const ok = document.createElement('span');
    ok.className = 'finding info';
    ok.textContent = 'all checks pass';
    findingsEl.appendChild(ok);
    return;
  }
  for (const f of findings) {
    const el = document.createElement('span');
    el.className = `finding ${f.severity}`;
    el.textContent = `${f.severity}: ${f.message}`;
    findingsEl.appendChild(el);
  }
}

// ---- template gallery ----
function renderGallery(): void {
  cardsEl.innerHTML = '';
  for (const t of pack.templates) {
    const card = document.createElement('button');
    card.className = 'card';
    card.innerHTML = `<strong></strong><span></span>`;
    card.querySelector('strong')!.textContent = t.name;
    card.querySelector('span')!.textContent = t.description;
    card.onclick = () => loadTemplate(t);
    cardsEl.appendChild(card);
  }
}
function loadTemplate(t: BlueprintTemplate<Spec>): void {
  blueprint = structuredClone(t.blueprint);
  renderEditor();
  setStatus(`Loaded “${t.name}”. Tune it on the right, or remix via Generate.`);
}

// ---- design drawer (renders the genre's EditorControlManifest as data) ----
function renderEditor(): void {
  controlsEl.innerHTML = '';
  for (const g of pack.manifest.groups) controlsEl.appendChild(renderGroup(g));
  void refreshPreview();
  validateAndShow();
}
function renderGroup(g: ControlGroup): HTMLElement {
  const fs = document.createElement('fieldset');
  const lg = document.createElement('legend');
  lg.textContent = `${g.icon ?? ''} ${g.label}`.trim();
  fs.appendChild(lg);
  for (const c of g.controls) fs.appendChild(renderControl(c));
  for (const sub of g.groups ?? []) fs.appendChild(renderGroup(sub));
  return fs;
}
function commit(path: string, value: unknown): void {
  setByPath(blueprint.spec as unknown as Record<string, unknown>, path, value);
  schedulePreview();
  validateAndShow();
}
function renderControl(c: Control): HTMLElement {
  const row = document.createElement('label');
  row.className = 'control';
  const name = document.createElement('span');
  name.className = 'label';
  name.textContent = c.label;
  const valueEl = document.createElement('span');
  valueEl.className = 'value';
  const current = getByPath(blueprint.spec, c.path);

  if (c.type === 'slider') {
    const i = document.createElement('input');
    i.type = 'range';
    if (c.min != null) i.min = String(c.min);
    if (c.max != null) i.max = String(c.max);
    if (c.step != null) i.step = String(c.step);
    i.value = String((current as number) ?? c.min ?? 0);
    valueEl.textContent = i.value;
    i.oninput = () => {
      valueEl.textContent = i.value;
      commit(c.path, Number(i.value));
    };
    row.append(name, valueEl, i);
  } else if (c.type === 'select') {
    const s = document.createElement('select');
    for (const o of c.options ?? []) {
      const opt = document.createElement('option');
      opt.value = String(o.value);
      opt.textContent = o.label;
      if (String(current) === String(o.value)) opt.selected = true;
      s.appendChild(opt);
    }
    s.onchange = () => commit(c.path, s.value);
    row.append(name, s);
  } else if (c.type === 'toggle') {
    const i = document.createElement('input');
    i.type = 'checkbox';
    i.checked = Boolean(current);
    i.onchange = () => commit(c.path, i.checked);
    row.append(name, i);
  } else {
    const i = document.createElement('input');
    i.type = c.type === 'color' ? 'color' : 'text';
    i.value = String(current ?? '');
    i.oninput = () => commit(c.path, i.value);
    row.append(name, i);
  }
  return row;
}

// ---- create / remix via the model-backed Planner (needs a key) ----
const executor: Executor<Spec> = { build: (bp, adapter) => adapter.build(bp) };
const judge: Judge<Spec> = {
  async judge(bp, _build, p) {
    const findings = [
      ...p.validateBlueprint(bp),
      ...(await Promise.all(p.validators.map((v) => v.check(bp)))).flat(),
    ];
    return { passed: findings.every((f) => f.severity !== 'error'), findings };
  },
};

async function generate(): Promise<void> {
  const prompt = pick<HTMLInputElement>('#prompt').value.trim();
  const key = pick<HTMLInputElement>('#key').value.trim();
  const model = pick<HTMLInputElement>('#model').value.trim() || undefined;
  if (!prompt) return setStatus('Type a description first.', 'error');
  if (!key)
    return setStatus('Add an OpenRouter key (model ▸) to generate. Tuning still works offline.', 'error');

  setStatus('Generating…');
  const models = createModelRouter({ server: openRouterProvider({ apiKey: key, model }) });
  const res = await runInnerLoop<Spec>(
    { prompt, tier: 'server' },
    {
      pack,
      adapter: webCanvasAdapter as TargetAdapter<Spec>,
      models,
      planner: waveSurvivalPlanner,
      executor,
      judge,
      repairer: deterministicRepairer,
      sink: createMemorySink(),
    },
  );
  if (res.status === 'published' && res.blueprint) {
    blueprint = res.blueprint;
    renderEditor();
    setStatus(`Generated “${res.blueprint.meta.title}” (repairs: ${res.repairs}).`);
  } else {
    setStatus(`Generation ${res.status}${res.error ? `: ${res.error.message}` : ''}.`, 'error');
  }
}

pick<HTMLButtonElement>('#gen').onclick = () => void generate();
pick<HTMLInputElement>('#prompt').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') void generate();
});

renderGallery();
renderEditor();
