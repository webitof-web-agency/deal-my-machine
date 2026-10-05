import test from 'node:test';
import assert from 'node:assert/strict';
import { getLegalEditorToolbarButtonClass } from './legalEditorToolbar.mjs';

test('marks the active legal editor command with an accessible highlighted style', () => {
  const activeClass = getLegalEditorToolbarButtonClass(true);
  const inactiveClass = getLegalEditorToolbarButtonClass(false);

  assert.match(activeClass, /bg-amber-400/);
  assert.match(activeClass, /ring-2/);
  assert.doesNotMatch(inactiveClass, /bg-amber-400/);
});
