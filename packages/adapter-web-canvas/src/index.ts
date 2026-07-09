import type { TargetAdapter, BuildOutput, Blueprint } from '@forge/core';
import { RUNTIME_JS } from './runtime';

/**
 * Web-canvas Target Adapter → emits ONE self-contained HTML file. It is GENRE-AGNOSTIC packaging: it
 * embeds the Blueprint spec as `window.__SPEC__` and inlines whatever runtime it's given. The runtime
 * is genre knowledge (a wave-survival loop, an idle-tycoon UI, …) that travels with the Genre Pack —
 * so a new genre needs no adapter change: `createWebCanvasAdapter(pack.webRuntime)`.
 */
export function createWebCanvasAdapter(runtime: string): TargetAdapter {
  return {
    surface: 'web-canvas',
    async build(blueprint: Blueprint): Promise<BuildOutput> {
      return {
        surface: 'web-canvas',
        files: { 'index.html': renderHtml(blueprint, runtime) },
        entry: 'index.html',
      };
    },
  };
}

function renderHtml(bp: Blueprint, runtime: string): string {
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
<script>${runtime}</script>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string,
  );
}

/** Default instance for the wave-survival runtime (kept for existing call sites). */
export const webCanvasAdapter = createWebCanvasAdapter(RUNTIME_JS);

export { RUNTIME_JS } from './runtime';
export default webCanvasAdapter;
