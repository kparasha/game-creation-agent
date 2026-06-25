import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RUNTIME_JS } from '@forge/adapter-web-canvas';
import pack from '@forge/genre-wave-survival';

/**
 * Executes the runtime headlessly against a minimal mocked DOM/canvas to prove it actually runs the
 * game loop (spawns, moves, draws) — a stronger "boots" guarantee than a syntax check. requestAnimation
 * Frame is bounded so the recursive loop terminates.
 */
test('runtime boots and runs frames against a mocked canvas', () => {
  const draws = { arc: 0, fillRect: 0, fillText: 0 };
  const ctx = {
    beginPath() {},
    arc() {
      draws.arc++;
    },
    fill() {},
    fillRect() {
      draws.fillRect++;
    },
    fillText() {
      draws.fillText++;
    },
  };
  const canvas = { width: 0, height: 0, getContext: () => ctx, addEventListener() {} };
  const performance = { now: () => 0 };
  const window: Record<string, unknown> = {
    innerWidth: 800,
    innerHeight: 600,
    addEventListener() {},
    performance,
    __SPEC__: pack.templates[0]!.blueprint.spec,
  };
  const document = { getElementById: () => canvas };

  let frames = 0;
  const requestAnimationFrame = (cb: (t: number) => void): void => {
    if (frames++ < 120) cb(frames * 16); // ~2s of simulated play, then stop
  };

  const run = new Function('window', 'document', 'requestAnimationFrame', 'performance', RUNTIME_JS) as (
    w: unknown,
    d: unknown,
    r: unknown,
    p: unknown,
  ) => void;

  assert.doesNotThrow(() => run(window, document, requestAnimationFrame, performance));
  // The player + spawned enemies are drawn as circles every frame → many arc() calls.
  assert.ok(draws.arc > 50, `expected many draw calls, got ${draws.arc}`);
  assert.ok(draws.fillText > 0, 'HUD text was drawn');
});
