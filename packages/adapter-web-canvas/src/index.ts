import type { TargetAdapter, BuildOutput, Blueprint } from '@forge/core';

/**
 * Web-canvas Target Adapter → emits ONE self-contained HTML file.
 *
 * Key design point (docs/05): the Blueprint spec is embedded as JSON and a GENERIC wave-survival
 * runtime reads it. So "generating a game" for an existing sub-genre is just producing a Blueprint
 * (deterministic, free) — NOT new code. New code is authored only when extending the runtime to a
 * new sub-genre (server tier). The same HTML5 build also feeds TikTok / Telegram / Discord / Reddit
 * via thin adapters that add each surface's SDK (docs/02).
 *
 * The runtime itself is a STUB here — this is the scaffold; the game loop lands in the coding phase.
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
  const specJson = JSON.stringify(bp.spec, null, 2);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>${escapeHtml(bp.meta.title)}</title>
<style>
  html,body{margin:0;height:100%;background:#0c0c12;color:#e7e7ee;font-family:system-ui,sans-serif;overflow:hidden}
  #game{display:block;width:100vw;height:100vh}
  #hud{position:fixed;top:10px;left:10px;font:12px ui-monospace,monospace;white-space:pre;opacity:.85}
  #banner{position:fixed;inset:0;display:grid;place-items:center;text-align:center;pointer-events:none}
  #banner div{background:rgba(0,0,0,.45);padding:14px 18px;border-radius:12px;font:14px system-ui}
</style>
</head>
<body>
<canvas id="game"></canvas>
<div id="hud"></div>
<div id="banner"><div>⚙️ <b>Runtime stub</b><br/>Generic wave-survival runtime renders this Blueprint here.<br/>(scaffold — game loop arrives in the coding phase)</div></div>
<script type="application/json" id="spec">${specJson}</script>
<script>
  // GENERIC WAVE-SURVIVAL RUNTIME — STUB.
  // TODO(coding phase): read #spec and run the canvas loop (player, waves, escalation, upgrades, win).
  const spec = JSON.parse(document.getElementById('spec').textContent);
  const c = document.getElementById('game');
  const ctx = c.getContext('2d');
  function resize(){ c.width = innerWidth; c.height = innerHeight; }
  addEventListener('resize', resize); resize();
  const pal = (spec.theme && spec.theme.palette) || ['#6db36b','#f4d35e','#8d5a2b'];
  ctx.fillStyle = pal[2] || '#222'; ctx.fillRect(0,0,c.width,c.height);
  document.getElementById('hud').textContent =
    'theme: ' + ((spec.theme && spec.theme.name) || '?') +
    '\\nplayer hp: ' + (spec.player && spec.player.hp) +
    '\\nenemies: ' + ((spec.enemies||[]).map(function(e){return e.id}).join(', ')) +
    '\\nwave every ' + (spec.waves && spec.waves.intervalSec) + 's';
</script>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string,
  );
}

export default webCanvasAdapter;
