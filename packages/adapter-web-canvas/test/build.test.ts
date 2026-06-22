import { test } from 'node:test';
import assert from 'node:assert/strict';
import webCanvasAdapter from '@forge/adapter-web-canvas';
import pack from '@forge/genre-wave-survival';

test('build emits a self-contained index.html with the spec embedded', async () => {
  const out = await webCanvasAdapter.build(pack.templates[0]!.blueprint);
  assert.equal(out.surface, 'web-canvas');
  assert.equal(out.entry, 'index.html');

  const html = out.files['index.html']!;
  assert.match(html, /<canvas id="game">/);
  assert.match(html, /Garden Defense/); // title rendered
  assert.match(html, /"palette"/); // spec JSON embedded
});
