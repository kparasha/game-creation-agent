import type { TargetAdapter, BuildOutput, Blueprint } from '@forge/core';
import { RUNTIME_JS } from './runtime';

/**
 * Web-canvas Target Adapter → emits ONE self-contained HTML file.
 *
 * Key design point (docs/05): the Blueprint spec is embedded as `window.__SPEC__` and the GENERIC
 * wave-survival runtime (runtime.ts) reads it. So "generating a game" for an existing sub-genre is
 * just producing a Blueprint (deterministic, free) — NOT new code. New code is authored only when
 * extending the runtime to a new sub-genre. The same HTML5 build also feeds TikTok / Telegram /
 * Discord / Reddit via thin adapters that add each surface's SDK (docs/02).
 */
export const webCanvasAdapter: TargetAdapter = {
  surface: 'web-canvas',
  async build(blueprint: Blueprint): Promise<BuildOutput> {
    return {
      surface: 'web-canvas',
      files: { 'index.html': renderHtml(blueprint) },
      entry: 'index.html',
    };
  },
};

function renderHtml(bp: Blueprint): string {
  // Escape `<` so a stray "</script>" inside spec data can't break out of the inline script.
  const specJson = JSON.stringify(bp.spec).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>${escapeHtml(bp.meta.title)}</title>
<style>
  html,body{margin:0;height:100%;background:#0c0c12;color:#e7e7ee;font-family:system-ui,sans-serif;overflow:hidden;touch-action:none}
  #game{display:block;width:100vw;height:100vh}
</style>
</head>
<body>
<canvas id="game"></canvas>
<script>window.__SPEC__ = ${specJson};</script>
<script>${RUNTIME_JS}</script>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string,
  );
}

export { RUNTIME_JS } from './runtime';
export default webCanvasAdapter;
