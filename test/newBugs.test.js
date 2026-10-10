import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parseWhatsApp, parseInstagramJson } from '../src/lib/parseChat.js';
import { resolveSenderMapping } from '../src/lib/nicknameConfig.js';
import {
  getEmojiStats,
  getWordCloudData,
  getLoveWordStats,
  getCalloutStats,
  getInitiatorStats,
} from '../src/lib/stats.js';

const mk = (sender, text, d = new Date(2024, 2, 12, 10, 0)) => ({
  sender, text, type: 'text', timestamp: d, platform: 'whatsapp',
});

describe('WhatsApp parser regressions', () => {
  test('US MM/DD order auto-detected', () => {
    const r = parseWhatsApp('[12/25/24, 2:05:33 PM] Aru: merry xmas\n[12/26/24, 9:00:00 AM] Avu: hi');
    assert.equal(r.messages[0].timestamp.getMonth(), 11);
    assert.equal(r.messages[0].timestamp.getDate(), 25);
    assert.equal(r.messages[1].timestamp.getDate(), 26);
  });

  test('DD/MM stays DD/MM when a day > 12 exists', () => {
    const r = parseWhatsApp('13/03/24, 10:00 - Aru: a\n05/04/24, 10:00 - Avu: b');
    assert.equal(r.messages[1].timestamp.getMonth(), 3);
    assert.equal(r.messages[1].timestamp.getDate(), 5);
  });

  test('dot date separator', () => {
    const r = parseWhatsApp('12.03.24, 14:06 - Aru: first\n12.03.24, 14:07 - Avu: second');
    assert.equal(r.messages.length, 2);
  });

  test('BOM does not eat first message', () => {
    const r = parseWhatsApp('\uFEFF12/03/24, 14:06 - Aru: first\n12/03/24, 14:07 - Avu: second');
    assert.equal(r.messages.length, 2);
    assert.equal(r.messages[0].text, 'first');
  });

  test('header-only system lines are not glued to previous message', () => {
    const txt = [
      '12/03/24, 14:06 - Aru: hello',
      '12/03/24, 14:07 - Avu: hi',
      '12/03/24, 14:08 - Missed voice call',
      '12/03/24, 14:09 - Aru added Sam',
      '12/03/24, 14:10 - Avu: next',
    ].join('\n');
    const r = parseWhatsApp(txt);
    assert.equal(r.messages.length, 3);
    assert.equal(r.messages[1].text, 'hi');
  });

  test('multiline still works after a system line', () => {
    const txt = [
      '12/03/24, 14:06 - Aru: hello',
      '12/03/24, 14:08 - Missed voice call',
      '12/03/24, 14:10 - Avu: line one',
      'line two',
    ].join('\n');
    const r = parseWhatsApp(txt);
    assert.equal(r.messages[1].text, 'line one\nline two');
  });

  test('iOS "image omitted" and Android "(file attached)" are media', () => {
    const txt = [
      '[12/03/24, 14:06:00] Aru: \u200eimage omitted',
      '[12/03/24, 14:07:00] Avu: \u200e<attached: 00001-PHOTO.jpg>',
      '12/03/24, 14:08 - Aru: IMG-20240312-WA0001.jpg (file attached)',
      '12/03/24, 14:09 - Avu: video omitted',
    ].join('\n');
    const r = parseWhatsApp(txt);
    assert.deepEqual(r.messages.map((m) => m.type), ['media', 'media', 'media', 'media']);
  });

  test('edited tag stripped', () => {
    const r = parseWhatsApp('12/03/24, 14:06 - Aru: fixed typo <This message was edited>');
    assert.equal(r.messages[0].text, 'fixed typo');
  });

  test('real sentences are not swallowed as system', () => {
    const txt = [
      '12/03/24, 14:06 - Aru: I missed a call',
      '12/03/24, 14:07 - Avu: I sent a photo',
    ].join('\n');
    const r = parseWhatsApp(txt);
    assert.deepEqual(r.messages.map((m) => m.type), ['text', 'text']);
  });
});

describe('Instagram share caption', () => {
  test('reel caption not kept as text', () => {
    const r = parseInstagramJson({
      participants: [{ name: 'Aru' }, { name: 'Avu' }],
      messages: [{
        sender_name: 'Aru', timestamp_ms: 1729500000000,
        content: 'love love love this song',
        share: { link: 'https://www.instagram.com/reel/abc/' },
      }],
    });
    assert.equal(r.messages[0].type, 'reel_share');
    assert.equal(r.messages[0].text, '');
  });
});

describe('Stats false positives', () => {
  test('love words: no substring hits, no double count', () => {
    const msgs = [
      mk('A', 'my family is great daily'),
      mk('B', 'lovely glove'),
      mk('A', 'babyyy'),
      mk('A', 'babe'),
      mk('A', 'jaanu'),
    ];
    const r = getLoveWordStats(msgs, ['A', 'B']);
    const get = (w) => r.leaderboard.find((x) => x.word === w)?.total || 0;
    assert.equal(get('ily'), 0);
    assert.equal(get('love'), 0);
    assert.equal(get('babyyy'), 1);
    assert.equal(get('baby'), 0);
    assert.equal(get('babyy'), 0);
    assert.equal(get('babe'), 1);
    assert.equal(get('jaanu'), 1);
    assert.equal(get('jaan'), 0);
    assert.equal(r.totals.overall, 3);
  });

  test('love words still match real uses', () => {
    const r = getLoveWordStats([mk('A', 'I love you, baby!'), mk('B', 'miss you ❤️')], ['A', 'B']);
    assert.equal(r.totals.overall, 4);
  });

  test('callouts: gm/gn/nite need to be whole words', () => {
    const msgs = [mk('A', 'design the sign for the segment, infinite granite')];
    const r = getCalloutStats(msgs, ['A', 'B']);
    assert.equal(r.night.counts.total, 0);
    assert.equal(r.morning.counts.total, 0);
  });

  test('callouts: real gm / gn match', () => {
    const msgs = [mk('A', 'gm!'), mk('B', 'gn babe'), mk('A', 'Good Night')];
    const r = getCalloutStats(msgs, ['A', 'B']);
    assert.equal(r.morning.counts.total, 1);
    assert.equal(r.night.counts.total, 2);
  });

  test('emoji: heart variants merge, symbols ignored', () => {
    const r = getEmojiStats([mk('A', '❤ ❤️ © ® ™ 😘')]);
    const top = Object.fromEntries(r.A);
    assert.equal(top['❤️'], 2);
    assert.equal(top['😘'], 1);
    assert.equal(Object.keys(top).length, 2);
  });

  test('word cloud: urls stripped, non-latin kept', () => {
    const wc = getWordCloudData([
      mk('A', 'https://www.instagram.com/reel/abc hello'),
      mk('A', 'நான் வருகிறேன் привет привет'),
    ]).map((x) => x.text);
    assert.ok(wc.includes('hello'));
    assert.ok(wc.includes('привет'));
    assert.ok(wc.includes('நான்'));
    for (const junk of ['www', 'instagram', 'com', 'reel', 'abc']) {
      assert.ok(!wc.includes(junk), junk);
    }
  });

  test('initiator: midnight spillover not credited as new day start', () => {
    const msgs = [
      mk('Her', 'late', new Date(2024, 2, 11, 23, 50)),
      mk('Him', 'still up', new Date(2024, 2, 12, 0, 5)),
      mk('Her', 'morning', new Date(2024, 2, 12, 9, 0)),
    ];
    const r = getInitiatorStats(msgs, ['Her', 'Him']);
    assert.equal(r.p1.count, 2);
    assert.equal(r.p2.count, 0);
  });
});

describe('Nickname heuristics', () => {
  test('substring names do not misfire', () => {
    const r = resolveSenderMapping(['Sherlock', 'Aru'], { mapping: {} });
    assert.equal(r.her, 'Aru');
    assert.equal(r.him, 'Sherlock');
  });
  test('whole word still works', () => {
    const r = resolveSenderMapping(['Boy (Him)', 'Girl (Her)'], { mapping: {} });
    assert.equal(r.her, 'Girl (Her)');
  });
});
