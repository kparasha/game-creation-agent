import { test } from 'node:test';
import assert from 'node:assert/strict';
import webCanvasAdapter, { RUNTIME_JS } from '@forge/adapter-web-canvas';
import pack from '@forge/genre-wave-survival';

test('build emits a self-contained index.html with the spec + runtime embedded', async () => {
  const out = await webCanvasAdapter.build(pack.templates[0]!.blueprint);
  assert.equal(out.surface, 'web-canvas');
  assert.equal(out.entry, 'index.html');

  const html = out.files['index.html']!;
  assert.match(html, /<canvas id="game">/);
  assert.match(html, /Garden Defense/); // title rendered
  assert.match(html, /window\.__SPEC__ =/); // spec injected as a global
  assert.match(html, /"palette"/); // spec JSON embedded
  assert.ok(html.includes(RUNTIME_JS), 'runtime is inlined into the page');
});

test('the runtime source is syntactically valid JS', () => {
  // Parses the runtime without executing it (no DOM here). Throws on a syntax error.
  assert.doesNotThrow(() => new Function(RUNTIME_JS));
});
