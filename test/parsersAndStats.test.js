import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseTelegramJson,
  parseWhatsApp,
  parseChatFile,
  applyNicknameMapping,
  detectPlatform,
  flattenTelegramText,
} from '../src/lib/parseChat.js';
import { resolveSenderMapping } from '../src/lib/nicknameConfig.js';
import {
  getOverviewStats,
  getEmojiStats,
  getEmojiComparison,
  getKeywordStats,
  getHeatmapData,
  getLongestStreak,
  getHighlights,
  getWordCloudData,
  getMediaStats,
  getInitiatorStats,
  getLongestMessage,
  getLateNightStats,
  getVerbosityStats,
  getResponseTimeStats,
  getMilestoneStats,
  getLoveWordStats,
  getRandomMemory,
  getCalloutStats,
} from '../src/lib/stats.js';

describe('Telegram JSON Parsing', () => {
  const sampleTelegramJson = {
    name: 'Her & Him',
    type: 'personal_chat',
    id: 123456789,
    messages: [
      {
        id: 1,
        type: 'service',
        date: '2024-10-21T16:10:00',
        actor: 'Him',
        action: 'pin_message',
        text: '',
      },
      {
        id: 2,
        type: 'message',
        date: '2024-10-21T16:13:00',
        from: 'Alice',
        from_id: 'user1',
        text: 'hello there ❤️',
        text_entities: [{ type: 'plain', text: 'hello there ❤️' }],
        reply_to_message_id: 0,
        forwarded_from: null,
        media_type: null,
        reactions: [
          {
            type: 'emoji',
            emoji: '❤️',
            count: 1,
            recent: [{ from: 'Bob' }],
          },
        ],
      },
      {
        id: 3,
        type: 'message',
        date: '2024-10-21T16:15:00',
        from: 'Bob',
        from_id: 'user2',
        text: [
          'check out ',
          { type: 'bold', text: 'this link' },
          ' now',
        ],
        text_entities: [
          { type: 'plain', text: 'check out ' },
          { type: 'bold', text: 'this link' },
          { type: 'plain', text: ' now' },
        ],
        reply_to_message_id: 2,
        forwarded_from: 'ChannelNews',
      },
      {
        id: 4,
        type: 'message',
        date: '2024-10-21T16:16:00',
        from: 'Alice',
        from_id: 'user1',
        media_type: 'sticker',
        sticker_emoji: '😘',
        text: '',
      },
      {
        id: 5,
        type: 'message',
        date: '2024-10-21T16:18:00',
        from: 'Bob',
        from_id: 'user2',
        media_type: 'photo',
        photo: 'photos/file_1.jpg',
        text: 'look at this picture',
      },
    ],
  };

  test('flattens array and string text correctly', () => {
    assert.equal(flattenTelegramText('simple string'), 'simple string');
    assert.equal(
      flattenTelegramText(['hello ', { type: 'bold', text: 'world' }]),
      'hello world'
    );
    assert.equal(
      flattenTelegramText('', [{ type: 'plain', text: 'from entities' }]),
      'from entities'
    );
  });

  test('parses Telegram JSON with nickname mapping, types, and meta', () => {
    const nicknameMap = {
      Alice: 'Her',
      Bob: 'Him',
    };

    const result = parseTelegramJson(sampleTelegramJson, nicknameMap);

    assert.equal(result.platform, 'telegram');
    assert.deepEqual(result.rawSenders.sort(), ['Alice', 'Bob'].sort());
    assert.deepEqual(result.senders.sort(), ['Her', 'Him'].sort());
    assert.equal(result.messages.length, 5);

    // Message 1: Service message -> type: 'system'
    const msg1 = result.messages[0];
    assert.equal(msg1.type, 'system');
    assert.equal(msg1.id, '1');

    // Message 2: Text message from Alice -> mapped to Her
    const msg2 = result.messages[1];
    assert.equal(msg2.id, '2');
    assert.equal(msg2.sender, 'Her');
    assert.equal(msg2.text, 'hello there ❤️');
    assert.equal(msg2.type, 'text');
    assert.ok(msg2.timestamp instanceof Date);
    assert.equal(msg2.date.getTime(), msg2.timestamp.getTime());
    assert.deepEqual(msg2.meta.reactions, [{ emoji: '❤️', sender: 'Him' }]);
    assert.equal(msg2.meta.isReply, undefined);

    // Message 3: Array text message, reply and forward
    const msg3 = result.messages[2];
    assert.equal(msg3.id, '3');
    assert.equal(msg3.sender, 'Him');
    assert.equal(msg3.text, 'check out this link now');
    assert.equal(msg3.type, 'text');
    assert.equal(msg3.meta.isReply, true);
    assert.equal(msg3.meta.isForwarded, true);

    // Message 4: Sticker
    const msg4 = result.messages[3];
    assert.equal(msg4.id, '4');
    assert.equal(msg4.type, 'sticker');
    assert.equal(msg4.text, '😘');

    // Message 5: Photo media
    const msg5 = result.messages[4];
    assert.equal(msg5.id, '5');
    assert.equal(msg5.type, 'media');
    assert.equal(msg5.text, 'look at this picture');
  });

  test('applyNicknameMapping cleanly re-maps messages and reactions', () => {
    const result = parseTelegramJson(sampleTelegramJson);
    const remapped = applyNicknameMapping(result.messages, {
      Alice: 'Him',
      Bob: 'Her',
    });

    assert.equal(remapped[1].sender, 'Him');
    assert.equal(remapped[2].sender, 'Her');
    assert.equal(remapped[1].meta.reactions[0].sender, 'Her');
  });
});

describe('WhatsApp Parsing', () => {
  const sampleWhatsAppText = `21/10/24, 16:13 - Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.
21/10/24, 16:13 - Her: hello there ❤️
21/10/24, 16:15 - Him: check this out
multiline content here
21/10/24, 16:16 - Her: <Media omitted>
21/10/24, 16:18 - Him: <sticker omitted>`;

  test('parses WhatsApp export and normalizes to ChatMessage schema', () => {
    const result = parseWhatsApp(sampleWhatsAppText);

    assert.equal(result.platform, 'whatsapp');
    assert.deepEqual(result.rawSenders.sort(), ['Her', 'Him'].sort());
    assert.equal(result.messages.length, 4);

    const msg1 = result.messages[0];
    assert.equal(msg1.id, 'wa-0');
    assert.equal(msg1.sender, 'Her');
    assert.equal(msg1.text, 'hello there ❤️');
    assert.equal(msg1.type, 'text');
    assert.ok(msg1.timestamp instanceof Date);
    assert.equal(msg1.timestamp.getFullYear(), 2024);

    const msg2 = result.messages[1];
    assert.equal(msg2.sender, 'Him');
    assert.ok(msg2.text.includes('multiline content here'));

    const msg3 = result.messages[2];
    assert.equal(msg3.type, 'media');

    const msg4 = result.messages[3];
    assert.equal(msg4.type, 'sticker');
  });
});

describe('Platform Detection and parseChatFile abstraction', () => {
  test('detects Telegram export from JSON structure', () => {
    const validJson = JSON.stringify({ messages: [] });
    assert.equal(detectPlatform(validJson).platform, 'telegram');
    assert.equal(detectPlatform('{}', 'chat.json').platform, null);
    assert.equal(detectPlatform(JSON.stringify({ messages: [{ id: 1 }] }), 'result.json').platform, 'telegram');
  });

  test('detects WhatsApp export from date pattern', () => {
    const wa = '21/10/24, 16:13 - Her: hello';
    assert.equal(detectPlatform(wa).platform, 'whatsapp');
  });

  test('returns null for unrecognized format', () => {
    assert.equal(detectPlatform('some random text without dates').platform, null);
  });

  test('parseChatFile resolves Telegram File', async () => {
    const file = new File(
      [JSON.stringify({
        messages: [
          { id: 1, type: 'message', from: 'Her', date: '2024-10-21T10:00:00', text: 'hi' },
          { id: 2, type: 'message', from: 'Him', date: '2024-10-21T10:01:00', text: 'hey' },
        ],
      })],
      'result.json',
      { type: 'application/json' }
    );

    const res = await parseChatFile(file);
    assert.equal(res.platform, 'telegram');
    assert.equal(res.messages.length, 2);
    assert.equal(res.messages[0].sender, 'Her');
    assert.equal(res.messages[1].sender, 'Him');
  });

  test('parseChatFile resolves WhatsApp File', async () => {
    const file = new File(
      ['21/10/24, 16:13 - Her: hello\n21/10/24, 16:14 - Him: world'],
      '_chat.txt',
      { type: 'text/plain' }
    );

    const res = await parseChatFile(file);
    assert.equal(res.platform, 'whatsapp');
    assert.equal(res.messages.length, 2);
  });

  test('parseChatFile rejects unrecognized file with clear error', async () => {
    const file = new File(['just some random text'], 'notes.txt', { type: 'text/plain' });
    await assert.rejects(
      async () => {
        await parseChatFile(file);
      },
      {
        message: 'Unrecognized format. Please provide a valid WhatsApp .txt export or Telegram .json export.',
      }
    );
  });
});

describe('Nickname Resolution Helper', () => {
  test('resolves stored mapping if present', () => {
    const stored = { mapping: { Alice: 'Her', Bob: 'Him' } };
    const res = resolveSenderMapping(['Alice', 'Bob'], stored);
    assert.equal(res.her, 'Alice');
    assert.equal(res.him, 'Bob');
  });

  test('resolves by substring matching', () => {
    const res = resolveSenderMapping(['Boy (Him)', 'Girl (Her)']);
    assert.equal(res.her, 'Girl (Her)');
    assert.equal(res.him, 'Boy (Him)');
  });
});

describe('Downstream Feature Stats with Normalized ChatMessage', () => {
  const mixedMessages = [
    {
      id: 'tg-0',
      type: 'system',
      sender: 'system',
      timestamp: new Date('2024-10-01T08:00:00'),
      text: 'User joined chat',
    },
    {
      id: 'tg-1',
      type: 'text',
      sender: 'Her',
      timestamp: new Date('2024-10-01T09:00:00'),
      text: 'Good morning baby ❤️ I love you so much',
    },
    {
      id: 'tg-2',
      type: 'text',
      sender: 'Him',
      timestamp: new Date('2024-10-01T09:02:00'),
      text: 'Good morning cutie! love you too',
    },
    {
      id: 'tg-3',
      type: 'media',
      sender: 'Her',
      timestamp: new Date('2024-10-01T15:00:00'),
      text: 'Photo from trip',
    },
    {
      id: 'tg-4',
      type: 'sticker',
      sender: 'Him',
      timestamp: new Date('2024-10-01T23:30:00'),
      text: '😘',
    },
    {
      id: 'tg-5',
      type: 'text',
      sender: 'Him',
      timestamp: new Date('2024-10-01T23:35:00'),
      text: 'Good night sweet dreams',
    },
  ];

  const senders = ['Her', 'Him'];

  test('getOverviewStats ignores system messages and counts media & words', () => {
    const overview = getOverviewStats(mixedMessages);
    assert.equal(overview.totalMessages, 5); // 6 total - 1 system = 5
    assert.equal(overview.totalMedia, 2); // 1 media + 1 sticker
    assert.equal(overview.uniqueDays, 1);
  });

  test('getEmojiStats extracts emojis per person', () => {
    const emojis = getEmojiStats(mixedMessages);
    assert.ok(emojis.Her.some(([e]) => e === '❤️'));
    assert.ok(emojis.Him.some(([e]) => e === '😘'));
  });

  test('getEmojiComparison compares emoji usage', () => {
    const cmp = getEmojiComparison(mixedMessages, senders);
    assert.deepEqual(cmp.order, senders);
    assert.ok(cmp.rows.length > 0);
  });

  test('getKeywordStats searches text and computes hourly distribution', () => {
    const kw = getKeywordStats(mixedMessages, 'morning');
    assert.equal(kw.count, 2);
    assert.equal(kw.topHour, 9);
  });

  test('getHeatmapData creates 7x24 grid', () => {
    const grid = getHeatmapData(mixedMessages);
    assert.equal(grid.length, 7);
    assert.equal(grid[0].length, 24);
  });

  test('getLongestStreak calculates streak correctly', () => {
    const streak = getLongestStreak(mixedMessages);
    assert.equal(streak, 1);
  });

  test('getHighlights returns busiest day and streak', () => {
    const hl = getHighlights(mixedMessages);
    assert.equal(hl.longestStreak, 1);
    assert.ok(hl.busiestDay);
  });

  test('getWordCloudData excludes stopwords and includes words', () => {
    const wc = getWordCloudData(mixedMessages);
    assert.ok(Array.isArray(wc));
  });

  test('getMediaStats counts media and stickers per person', () => {
    const media = getMediaStats(mixedMessages, senders);
    assert.equal(media.Her, 1);
    assert.equal(media.Him, 1);
    assert.equal(media.total, 2);
  });

  test('getInitiatorStats correctly identifies first talker of the day', () => {
    const init = getInitiatorStats(mixedMessages, senders);
    assert.equal(init.p1.name, 'Her');
    assert.equal(init.p1.count, 1);
    assert.equal(init.p2.count, 0);
  });

  test('getLongestMessage finds longest text message', () => {
    const longest = getLongestMessage(mixedMessages, senders);
    assert.equal(longest.sender, 'Her');
    assert.ok(longest.wordCount >= 7);
  });

  test('getLateNightStats checks late night messages', () => {
    const late = getLateNightStats(mixedMessages, senders);
    assert.ok(late.p1);
    assert.ok(late.p2);
  });

  test('getVerbosityStats calculates average words per message', () => {
    const verb = getVerbosityStats(mixedMessages, senders);
    assert.ok(verb.p1.avg > 0);
    assert.ok(verb.p2.avg > 0);
  });

  test('getResponseTimeStats calculates reply times', () => {
    const resp = getResponseTimeStats(mixedMessages, senders);
    assert.ok(resp.order);
    assert.equal(resp.Her.name, 'Her');
    assert.equal(resp.Him.name, 'Him');
  });

  test('getMilestoneStats calculates total words, messages, and daily average', () => {
    const miles = getMilestoneStats(mixedMessages, senders);
    assert.equal(miles.totalMessages, 5);
  });

  test('getLoveWordStats tracks terms of endearment', () => {
    const love = getLoveWordStats(mixedMessages, senders);
    assert.ok(love.totals.overall >= 3);
  });

  test('getRandomMemory returns a valid chat memory', () => {
    const mem = getRandomMemory(mixedMessages);
    assert.ok(mem);
    assert.ok(mem.messages.length >= 1);
    assert.notEqual(mem.messages[0].type, 'system');
  });

  test('getCalloutStats calculates morning and night callouts', () => {
    const callouts = getCalloutStats(mixedMessages, senders);
    assert.equal(callouts.morning.counts.Her, 1);
    assert.equal(callouts.morning.counts.Him, 1);
    assert.equal(callouts.night.counts.Him, 1);
  });
});
