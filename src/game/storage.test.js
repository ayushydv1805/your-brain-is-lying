import test from 'node:test';
import assert from 'node:assert/strict';
import { appendRunHistory, getPlayerStorageStatus, loadPlayer, savePlayer } from './storage.js';

function makeStorage() {
  const data = new Map();
  return {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(String(key), String(value)); },
    removeItem(key) { data.delete(key); },
    key(index) { return [...data.keys()][index] ?? null; },
    get length() { return data.size; },
    keys() { return [...data.keys()]; },
  };
}

test('savePlayer stores and reloads a validated player for the active local profile', () => {
  const original = globalThis.localStorage;
  globalThis.localStorage = makeStorage();
  try {
    localStorage.setItem('your-brain-is-lying-active-profile', 'profile-test');
    const player = { ...loadPlayer(), xp: 140, level: 2, runHistory: [], activityDates: [] };
    assert.equal(savePlayer(player), true);
    const loaded = loadPlayer();
    assert.equal(loaded.xp, 140);
    assert.equal(loaded.level, 2);
    assert.equal(loaded.schemaVersion, 2);
    assert.ok(loaded.savedAt);
    const status = getPlayerStorageStatus();
    assert.equal(status.available, true);
    assert.equal(status.hasSavedData, true);
    assert.ok(status.bytes > 0);
    assert.match(status.key, /profile-test/);
  } finally {
    if (original === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = original;
  }
});

test('run history stores numeric metrics used by coaching and weekly report', () => {
  const original = globalThis.localStorage;
  globalThis.localStorage = makeStorage();
  try {
    const player = loadPlayer();
    const updated = appendRunHistory(player, {
      type: 'memory', score: 4, rounds: 5, accuracy: 80, xp: 25,
      roundHistory: [{ correct: true }, { correct: false }],
      at: '2026-10-23T10:00:00.000Z',
    });
    assert.equal(updated.runHistory[0].accuracy, 80);
    assert.equal(updated.runHistory[0].score, 4);
    assert.equal(updated.runHistory[0].mistakes, 1);
    assert.equal(updated.runHistory[0].roundCount, 2);
  } finally {
    if (original === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = original;
  }
});

test('corrupt progress is preserved in a recovery copy instead of overwritten silently', () => {
  const original = globalThis.localStorage;
  globalThis.localStorage = makeStorage();
  try {
    const key = 'your-brain-is-lying-player:profile-corrupt';
    localStorage.setItem('your-brain-is-lying-active-profile', 'profile-corrupt');
    localStorage.setItem(key, '{not valid json');
    const loaded = loadPlayer();
    assert.equal(loaded.xp, 0);
    assert.ok(localStorage.keys().some((entry) => entry.startsWith(key + ':corrupt-backup-')));
    assert.equal(localStorage.getItem(key), '{not valid json');
  } finally {
    if (original === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = original;
  }
});
