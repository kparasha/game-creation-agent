import { test } from 'node:test';
import assert from 'node:assert/strict';
import pack, { IDLE_RUNTIME_JS } from '@forge/genre-idle-tycoon';

/** Executes the idle runtime against a minimal mocked DOM to prove it builds UI and ticks income. */
test('idle runtime boots against a mocked DOM and starts the income loop', () => {
  let created = 0;
  const make = (): Record<string, unknown> => ({
    style: {} as Record<string, string>,
    textContent: '',
    disabled: false,
    onclick: null,
    appendChild(child: unknown) {
      return child;
    },
  });
  const document = {
    createElement: () => {
      created++;
      return make();
    },
    body: make(),
  };
  let intervals = 0;
  const setInterval = (cb: () => void): number => {
    for (let i = 0; i < 5; i++) cb(); // simulate a few income ticks
    intervals++;
    return 1;
  };
  const window = { __SPEC__: pack.templates[0]!.blueprint.spec };

  const run = new Function('window', 'document', 'setInterval', IDLE_RUNTIME_JS) as (
    w: unknown,
    d: unknown,
    s: unknown,
  ) => void;

  assert.doesNotThrow(() => run(window, document, setInterval));
  assert.ok(created > 5, `built UI elements, got ${created}`);
  assert.equal(intervals, 1, 'started the income loop');
});
