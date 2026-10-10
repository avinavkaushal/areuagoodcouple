import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseWhatsApp,
  parseInstagramJson,
  parseChatFiles,
  applyNicknameMapping,
} from '../src/lib/parseChat.js';
import { getKeywordStats } from '../src/lib/stats.js';
import { buildSettingsMappings } from '../src/lib/nicknameConfig.js';

test('whole-word keyword search survives regex metacharacters', () => {
  const msgs = parseWhatsApp('12/05/2023, 10:00 - A: hello (hi) c++ what?\n12/05/2023, 10:01 - B: ok').messages;
  for (const kw of ['(hi', 'c++', 'what?', 'hi)', '[x', 'a\\b']) {
    assert.doesNotThrow(() => getKeywordStats(msgs, kw, { wholeWord: true }), kw);
  }
  assert.equal(getKeywordStats(msgs, 'c++', { wholeWord: true }).count, 1);
  assert.equal(getKeywordStats(msgs, 'hel', { wholeWord: true }).count, 0);
});

test('mdy dates detected even when day>12 appears after line 2000', () => {
  const lines = [];
  for (let i = 0; i < 2100; i++) lines.push(`01/05/2023, 10:00 - A: msg ${i}`);
  lines.push('01/20/2023, 10:00 - B: late');
  const { messages } = parseWhatsApp(lines.join('\n'));
  const last = messages[messages.length - 1].timestamp;
  assert.equal(last.getFullYear(), 2023);
  assert.equal(last.getMonth(), 0);
  assert.equal(last.getDate(), 20);
});

const file = (name, text) => ({ name, text: async () => text });

test('multiple WhatsApp files merge, sort, and drop cross-file overlap', async () => {
  const a = file('a.txt', '12/05/2023, 10:00 - A: one\n12/05/2023, 10:01 - B: two\n12/05/2023, 10:02 - A: ok\n12/05/2023, 10:02 - A: ok');
  const b = file('b.txt', '12/05/2023, 10:02 - A: ok\n12/05/2023, 10:02 - A: ok\n13/05/2023, 10:00 - B: three');
  const out = await parseChatFiles([b, a]);
  assert.equal(out.platform, 'whatsapp');
  assert.deepEqual(out.messages.map((m) => m.text), ['one', 'two', 'ok', 'ok', 'three']);
  assert.equal(new Set(out.messages.map((m) => m.id)).size, out.messages.length);
  assert.deepEqual([...out.rawSenders].sort(), ['A', 'B']);
});

test('settings swap flips every platform, not just the primary one', () => {
  const wa = parseWhatsApp('12/05/2023, 10:00 - Aru: hi\n12/05/2023, 10:01 - Avu: yo').messages;
  const ig = parseInstagramJson({
    participants: [{ name: 'aru_x' }, { name: 'avu_y' }],
    messages: [
      { sender_name: 'aru_x', timestamp_ms: 1700000000000, content: 'hello' },
      { sender_name: 'avu_y', timestamp_ms: 1700000060000, content: 'hey' },
    ],
  }).messages;
  const init = { Aru: 'Her', Avu: 'Him', aru_x: 'Her', avu_y: 'Him' };
  const loaded = {
    whatsapp: { rawSenders: ['Aru', 'Avu'], messages: applyNicknameMapping(wa, init) },
    instagram: { rawSenders: ['aru_x', 'avu_y'], messages: applyNicknameMapping(ig, init) },
  };

  const { perPlatform, combined } = buildSettingsMappings(loaded, { her: 'Avu', him: 'Aru', prevHer: 'Aru' });
  const waAfter = applyNicknameMapping(loaded.whatsapp.messages, perPlatform.whatsapp).map((m) => m.sender);
  const igAfter = applyNicknameMapping(loaded.instagram.messages, perPlatform.instagram).map((m) => m.sender);
  assert.deepEqual(waAfter, ['Him', 'Her']);
  assert.deepEqual(igAfter, ['Him', 'Her']);
  assert.equal(combined.aru_x, 'Him');
  assert.equal(combined.avu_y, 'Her');

  const same = buildSettingsMappings(loaded, { her: 'Aru', him: 'Avu', prevHer: 'Aru' });
  assert.deepEqual(applyNicknameMapping(loaded.instagram.messages, same.perPlatform.instagram).map((m) => m.sender), ['Her', 'Him']);
});
