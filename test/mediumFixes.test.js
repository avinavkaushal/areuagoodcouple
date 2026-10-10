import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseWhatsApp,
  parseTelegramJson,
  parseInstagramJson,
  applyNicknameMapping,
  detectPlatform,
} from '../src/lib/parseChat.js';

test('system line with a colon inside quotes does not create a fake sender', () => {
  const r = parseWhatsApp(
    '12/05/2023, 10:00 - A created group "Foo: bar"\n12/05/2023, 10:01 - A: hi\n12/05/2023, 10:02 - B: yo'
  );
  assert.deepEqual(r.rawSenders.sort(), ['A', 'B']);
  assert.equal(r.messages.length, 2);
});

test('ISO-dated WhatsApp exports parse and are detected', () => {
  const txt = '2023-05-12, 10:00 - A: hi\n2023-05-12, 10:01 - B: yo\ncontinued line\n[2023-05-13 09:30:15] A: bracket style';
  const r = parseWhatsApp(txt);
  assert.equal(r.messages.length, 3);
  assert.equal(r.messages[0].timestamp.getFullYear(), 2023);
  assert.equal(r.messages[0].timestamp.getMonth(), 4);
  assert.equal(r.messages[0].timestamp.getDate(), 12);
  assert.equal(r.messages[1].text, 'yo\ncontinued line');
  assert.equal(detectPlatform(txt).platform, 'whatsapp');
});

test('Telegram reactions can be re-mapped repeatedly (swap Her/Him)', () => {
  const tg = {
    messages: [
      { id: 1, type: 'message', date: '2023-05-12T10:00:00', from: 'x', text: 'hello there',
        reactions: [{ emoji: '❤', count: 1, recent: [{ from: 'y' }] }] },
      { id: 2, type: 'message', date: '2023-05-12T10:02:00', from: 'y', text: 'yo' },
    ],
  };
  const p = parseTelegramJson(tg, {});
  const m1 = applyNicknameMapping(p.messages, { x: 'Her', y: 'Him' });
  const m2 = applyNicknameMapping(m1, { x: 'Him', y: 'Her' });
  assert.equal(m1[0].meta.reactions[0].actor, 'Him');
  assert.equal(m2[0].meta.reactions[0].actor, 'Her');
  assert.equal(m2[0].sender, 'Him');
});

test('Telegram message without a date inherits the previous valid time, not "now"', () => {
  const tg = {
    messages: [
      { id: 1, type: 'message', date: '2023-05-12T10:00:00', from: 'x', text: 'one' },
      { id: 2, type: 'message', from: 'y', text: 'no date' },
      { id: 3, type: 'message', date: 'garbage', from: 'x', text: 'bad date' },
    ],
  };
  const r = parseTelegramJson(tg);
  const t0 = r.messages[0].timestamp.getTime();
  assert.equal(r.messages[1].timestamp.getTime(), t0);
  assert.equal(r.messages[2].timestamp.getTime(), t0);
  assert.throws(() => parseTelegramJson({ messages: [{ id: 1, from: 'x', text: 'hi' }] }), /no message has a valid date/);
});

test('Instagram message without timestamp_ms is skipped, not placed in 1970', () => {
  const r = parseInstagramJson({
    participants: [{ name: 'a' }, { name: 'b' }],
    messages: [
      { sender_name: 'a', timestamp_ms: 1700000000000, content: 'ok' },
      { sender_name: 'b', content: 'ghost' },
      { sender_name: 'b', timestamp_ms: 0, content: 'zero' },
    ],
  });
  assert.equal(r.messages.length, 1);
  assert.equal(r.messages[0].text, 'ok');
});
