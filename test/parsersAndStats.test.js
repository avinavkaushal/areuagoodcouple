import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import {
  parseTelegramJson,
  parseWhatsApp,
  parseInstagramJson,
  parseChatFile,
  parseChatFiles,
  applyNicknameMapping,
  detectPlatform,
  flattenTelegramText,
  fixMojibake,
} from '../src/lib/parseChat.js';
import { resolveSenderMapping } from '../src/lib/nicknameConfig.js';
import {
  getNonSystemMessages,
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
  getReelStats,
  getMediaBreakdownStats,
  getReactionStats,
  getCrossPlatformStats,
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
        message:
          'Unrecognized format. Please provide a valid WhatsApp .txt export, Telegram .json export, or Instagram .json export.',
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
  const validMessages = getNonSystemMessages(mixedMessages);

  test('getNonSystemMessages filters out system messages', () => {
    assert.equal(validMessages.length, 5); // 6 total - 1 system = 5
    assert.ok(validMessages.every((m) => m.type !== 'system'));
  });

  test('getOverviewStats ignores system messages and counts media & words', () => {
    const overview = getOverviewStats(validMessages);
    assert.equal(overview.totalMessages, 5);
    assert.equal(overview.totalMedia, 2); // 1 media + 1 sticker
    assert.equal(overview.uniqueDays, 1);
  });

  test('getEmojiStats extracts emojis per person', () => {
    const emojis = getEmojiStats(validMessages);
    assert.ok(emojis.Her.some(([e]) => e === '❤️'));
    assert.ok(emojis.Him.some(([e]) => e === '😘'));
  });

  test('getEmojiComparison compares emoji usage', () => {
    const cmp = getEmojiComparison(validMessages, senders);
    assert.deepEqual(cmp.order, senders);
    assert.ok(cmp.rows.length > 0);
  });

  test('getKeywordStats searches text and computes hourly distribution', () => {
    const kw = getKeywordStats(validMessages, 'morning');
    assert.equal(kw.count, 2);
    assert.equal(kw.topHour, 9);
  });

  test('getHeatmapData creates 7x24 grid', () => {
    const grid = getHeatmapData(validMessages);
    assert.equal(grid.length, 7);
    assert.equal(grid[0].length, 24);
  });

  test('getLongestStreak calculates streak correctly', () => {
    const streak = getLongestStreak(validMessages);
    assert.equal(streak, 1);
  });

  test('getHighlights returns busiest day and streak', () => {
    const hl = getHighlights(validMessages);
    assert.equal(hl.longestStreak, 1);
    assert.ok(hl.busiestDay);
  });

  test('getWordCloudData excludes stopwords and includes words', () => {
    const wc = getWordCloudData(validMessages);
    assert.ok(Array.isArray(wc));
  });

  test('getMediaStats counts media and stickers per person', () => {
    const media = getMediaStats(validMessages, senders);
    assert.equal(media.Her, 1);
    assert.equal(media.Him, 1);
    assert.equal(media.total, 2);
  });

  test('getInitiatorStats correctly identifies first talker of the day', () => {
    const init = getInitiatorStats(validMessages, senders);
    assert.equal(init.p1.name, 'Her');
    assert.equal(init.p1.count, 1);
    assert.equal(init.p2.count, 0);
  });

  test('getLongestMessage finds longest text message', () => {
    const longest = getLongestMessage(validMessages, senders);
    assert.equal(longest.sender, 'Her');
    assert.ok(longest.wordCount >= 7);
  });

  test('getLateNightStats checks late night messages', () => {
    const late = getLateNightStats(validMessages, senders);
    assert.ok(late.p1);
    assert.ok(late.p2);
  });

  test('getVerbosityStats calculates average words per message', () => {
    const verb = getVerbosityStats(validMessages, senders);
    assert.ok(verb.p1.avg > 0);
    assert.ok(verb.p2.avg > 0);
  });

  test('getResponseTimeStats calculates reply times', () => {
    const resp = getResponseTimeStats(validMessages, senders);
    assert.ok(resp.order);
    assert.equal(resp.Her.name, 'Her');
    assert.equal(resp.Him.name, 'Him');
  });

  test('getMilestoneStats calculates total words, messages, and daily average', () => {
    const miles = getMilestoneStats(validMessages, senders);
    assert.equal(miles.totalMessages, 5);
  });

  test('getLoveWordStats tracks terms of endearment', () => {
    const love = getLoveWordStats(validMessages, senders);
    assert.ok(love.totals.overall >= 3);
  });

  test('getRandomMemory returns a valid chat memory', () => {
    const mem = getRandomMemory(validMessages);
    assert.ok(mem);
    assert.ok(mem.messages.length >= 1);
    assert.notEqual(mem.messages[0].type, 'system');
  });

  test('getCalloutStats calculates morning and night callouts', () => {
    const callouts = getCalloutStats(validMessages, senders);
    assert.equal(callouts.morning.counts.Her, 1);
    assert.equal(callouts.morning.counts.Him, 1);
    assert.equal(callouts.night.counts.Him, 1);
  });
});

describe('Instagram UTF-8 Mojibake Fix', () => {
  test('decodes mojibake emoji correctly', () => {
    // 😂 is UTF-8 [0xF0, 0x9F, 0x98, 0x82]
    const mojibake = '\u00f0\u009f\u0098\u0082';
    assert.equal(fixMojibake(mojibake), '😂');
  });

  test('decodes Hinglish text with mojibake emoji and Hindi Devanagari script', () => {
    // नमस्ते -> UTF-8 bytes decoded as Latin-1
    const hindiBytes = Buffer.from('नमस्ते', 'utf-8');
    const mojibakeHindi = String.fromCharCode(...hindiBytes);
    assert.equal(fixMojibake(mojibakeHindi), 'नमस्ते');

    // Hinglish sentence
    const heartMojibake = '\u00e2\u009d\u00a4\u00ef\u00b8\u008f';
    const hinglish = `kya haal hai baby ${heartMojibake}`;
    assert.equal(fixMojibake(hinglish), 'kya haal hai baby ❤️');
  });

  test('safely leaves already-decoded Unicode and pure ASCII unchanged', () => {
    assert.equal(fixMojibake('Already decoded 😂 and नमस्ते'), 'Already decoded 😂 and नमस्ते');
    assert.equal(fixMojibake('Simple English sentence 123!'), 'Simple English sentence 123!');
    assert.equal(fixMojibake(''), '');
    assert.equal(fixMojibake(null), null);
  });
});

describe('Instagram JSON Parsing and Schema Normalization', () => {
  const sampleIgJsonBatch1 = {
    participants: [{ name: '\u0041\u0072\u0075' }, { name: '\u0041\u0076\u0075' }],
    messages: [
      {
        sender_name: 'Aru',
        timestamp_ms: 1729500000000, // Newer message
        content: 'check this reel!',
        share: { link: 'https://www.instagram.com/reel/DBa123xyz/' },
        reactions: [{ reaction: '\u00e2\u009d\u00a4\u00ef\u00b8\u008f', actor: 'Avu' }],
      },
      {
        sender_name: 'Avu',
        timestamp_ms: 1729490000000,
        content: 'Replied to their story: cute outfit!',
        share: { link: 'https://www.instagram.com/stories/aru/12345/' },
      },
      {
        sender_name: 'Aru',
        timestamp_ms: 1729480000000,
        content: 'look at our trip',
        photos: [
          { uri: 'photos/trip1.jpg', creation_timestamp: 1729480000 },
          { uri: 'photos/trip2.jpg', creation_timestamp: 1729480000 },
          { uri: '', creation_timestamp: 0 }, // broken URI to be ignored
        ],
      },
      {
        sender_name: 'Avu',
        timestamp_ms: 1729470000000,
        content: 'concert clip',
        videos: [{ uri: 'videos/clip.mp4' }],
      },
      {
        sender_name: 'Aru',
        timestamp_ms: 1729465000000,
        content: 'You unsent a message', // Deleted/unsent placeholder
      },
      {
        sender_name: 'Avu',
        timestamp_ms: 1729460000000,
        is_unsent: true, // Marked unsent flag
        content: '',
      },
      {
        sender_name: 'Avu',
        timestamp_ms: 1729450000000, // Oldest in batch 1
        content: 'Good morning \u00f0\u009f\u0098\u008a', // mojibake 😊
      },
    ],
  };

  const sampleIgJsonBatch2 = {
    participants: [{ name: 'Aru' }, { name: 'Avu' }],
    messages: [
      {
        sender_name: 'Aru',
        timestamp_ms: 1729440000000, // Older than batch 1
        content: 'another reel back to you',
        share: { link: 'https://instagram.com/reels/Cxyz890/' },
      },
      {
        // Duplicate of message in batch 1 to test deduplication across file boundaries
        sender_name: 'Avu',
        timestamp_ms: 1729450000000,
        content: 'Good morning \u00f0\u009f\u0098\u008a',
      },
    ],
  };

  test('parses single Instagram JSON export with mojibake fix and filters unsent', () => {
    const nicknameMap = { Aru: 'Her', Avu: 'Him' };
    const res = parseInstagramJson(sampleIgJsonBatch1, nicknameMap);

    assert.equal(res.platform, 'instagram');
    assert.deepEqual(res.rawSenders.sort(), ['Aru', 'Avu'].sort());
    assert.deepEqual(res.senders.sort(), ['Her', 'Him'].sort());

    // 7 raw messages - 2 unsent = 5 valid messages
    assert.equal(res.messages.length, 5);

    // Messages must be sorted chronologically ascending
    for (let i = 1; i < res.messages.length; i++) {
      assert.ok(res.messages[i].timestamp.getTime() >= res.messages[i - 1].timestamp.getTime());
    }

    // Message 1 (oldest): Good morning 😊
    const msg1 = res.messages[0];
    assert.equal(msg1.sender, 'Him');
    assert.equal(msg1.type, 'text');
    assert.equal(msg1.text, 'Good morning 😊');
    assert.equal(msg1.content, 'Good morning 😊');

    // Message 2: Video
    const msg2 = res.messages[1];
    assert.equal(msg2.sender, 'Him');
    assert.equal(msg2.type, 'video');

    // Message 3: Photos (valid photos filtered)
    const msg3 = res.messages[2];
    assert.equal(msg3.sender, 'Her');
    assert.equal(msg3.type, 'photo');
    assert.equal(msg3.meta.photos.length, 2); // 3 raw photos - 1 broken = 2

    // Message 4: Story reply
    const msg4 = res.messages[3];
    assert.equal(msg4.sender, 'Him');
    assert.equal(msg4.type, 'story_reply');

    // Message 5: Reel share with reaction
    const msg5 = res.messages[4];
    assert.equal(msg5.sender, 'Her');
    assert.equal(msg5.meta.reactions[0].emoji, '❤️');
    assert.equal(msg5.meta.reactions[0].actor, 'Him');
    assert.equal(msg5.meta.reactions[0].sender, 'Him');
  });

  test('merges multiple paginated files and deduplicates cross-file overlap', () => {
    const nicknameMap = { Aru: 'Her', Avu: 'Him' };
    const res = parseInstagramJson([sampleIgJsonBatch1, sampleIgJsonBatch2], nicknameMap);

    // Batch 1 had 5 valid, Batch 2 had 1 older message + 1 duplicate of batch 1 -> total 6
    assert.equal(res.messages.length, 6);

    // First message should be from Batch 2 (timestamp 1729440000000)
    assert.equal(res.messages[0].timestamp.getTime(), 1729440000000);
    assert.equal(res.messages[0].type, 'reel_share');
  });

  test('detectPlatform correctly detects Instagram vs Telegram vs WhatsApp', () => {
    const igJson = JSON.stringify({
      participants: [{ name: 'Aru' }],
      messages: [{ sender_name: 'Aru', timestamp_ms: 123456789, content: 'hi' }],
    });
    assert.equal(detectPlatform(igJson, 'message_1.json').platform, 'instagram');

    const tgJson = JSON.stringify({
      name: 'Chat',
      type: 'personal_chat',
      id: 999,
      messages: [{ id: 1, from: 'Alice', date: '2024-10-01' }],
    });
    assert.equal(detectPlatform(tgJson, 'result.json').platform, 'telegram');

    const wa = '21/10/24, 16:13 - Aru: hello';
    assert.equal(detectPlatform(wa, '_chat.txt').platform, 'whatsapp');
  });

  test('parseChatFiles resolves multiple Instagram JSON Files', async () => {
    const f1 = new File([JSON.stringify(sampleIgJsonBatch1)], 'message_1.json', { type: 'application/json' });
    const f2 = new File([JSON.stringify(sampleIgJsonBatch2)], 'message_2.json', { type: 'application/json' });

    const res = await parseChatFiles([f1, f2]);
    assert.equal(res.platform, 'instagram');
    assert.equal(res.messages.length, 6);
  });
});

describe('Instagram Reel Statistics (Phase 1 Part B)', () => {
  const reelMessages = [
    // Non-reel text
    { sender: 'Her', type: 'text', timestamp: new Date('2024-10-01T10:00:00') },
    // Reel 1: Her -> streak 1
    { sender: 'Her', type: 'reel_share', timestamp: new Date('2024-10-01T11:00:00') },
    // Reel 2: Him -> streak 2
    { sender: 'Him', type: 'reel_share', timestamp: new Date('2024-10-01T12:00:00') },
    // Reel 3: Her -> streak 3
    { sender: 'Her', type: 'reel_share', timestamp: new Date('2024-10-02T13:00:00') },
    // Reel 4: Him -> streak 4
    { sender: 'Him', type: 'reel_share', timestamp: new Date('2024-10-02T14:00:00') },
    // Reel 5: Him sends another reel immediately! Breaks streak -> streak resets to 1 (starting at Reel 5)
    { sender: 'Him', type: 'reel_share', timestamp: new Date('2024-10-03T15:00:00') },
    // Reel 6: Her -> streak 2
    { sender: 'Her', type: 'reel_share', timestamp: new Date('2024-10-03T16:00:00') },
    // Reel 7: Him (in November) -> streak 3
    { sender: 'Him', type: 'reel_share', timestamp: new Date('2024-11-01T10:00:00') },
  ];

  const senders = ['Her', 'Him'];

  test('calculates reel count per person and identifies leader', () => {
    const stats = getReelStats(reelMessages, senders);
    // Her: Reel 1, 3, 6 (3 reels)
    // Him: Reel 2, 4, 5, 7 (4 reels)
    assert.equal(stats.totalReels, 7);
    assert.equal(stats.p1.count, 3);
    assert.equal(stats.p2.count, 4);
    assert.equal(stats.leader, 'Him');
    assert.equal(stats.p2.pct, Math.round((4 / 7) * 100));
  });

  test('calculates reel ping-pong streak and start/end dates', () => {
    const stats = getReelStats(reelMessages, senders);
    // Longest streak was Reel 1 to Reel 4 (Her -> Him -> Her -> Him) = 4 reels!
    assert.equal(stats.streak.length, 4);
    assert.equal(stats.streak.startDate.getTime(), new Date('2024-10-01T11:00:00').getTime());
    assert.equal(stats.streak.endDate.getTime(), new Date('2024-10-02T14:00:00').getTime());
  });

  test('handles edge case of 0 and 1 reel gracefully', () => {
    const zero = getReelStats([], senders);
    assert.equal(zero.totalReels, 0);
    assert.equal(zero.streak.length, 0);
    assert.equal(zero.streak.startDate, null);

    const one = getReelStats([{ sender: 'Her', type: 'reel_share', timestamp: new Date('2024-10-01') }], senders);
    assert.equal(one.totalReels, 1);
    assert.equal(one.streak.length, 1);
    assert.ok(one.streak.startDate);
  });

  test('identifies busiest reel month and day', () => {
    const stats = getReelStats(reelMessages, senders);
    // 6 reels in October, 1 in November
    assert.equal(stats.busiestMonth.label, 'October 2024');
    assert.equal(stats.busiestMonth.count, 6);
  });
});

describe('Instagram Media Breakdown Statistics (Phase 2)', () => {
  const mediaMessages = [
    // 1 text
    { sender: 'Her', type: 'text', timestamp: new Date() },
    // Her: 1 single photo
    { sender: 'Her', type: 'photo', timestamp: new Date(), meta: { photos: [{ uri: '1.jpg' }] } },
    // Her: batch of 3 photos in 1 message
    {
      sender: 'Her',
      type: 'photo',
      timestamp: new Date(),
      meta: { photos: [{ uri: '2.jpg' }, { uri: '3.jpg' }, { uri: '4.jpg' }] },
    },
    // Him: 1 video
    { sender: 'Him', type: 'video', timestamp: new Date(), meta: { videos: [{ uri: 'v1.mp4' }] } },
    // Her: 2 reels
    { sender: 'Her', type: 'reel_share', timestamp: new Date() },
    { sender: 'Her', type: 'reel_share', timestamp: new Date() },
    // Him: 1 reel
    { sender: 'Him', type: 'reel_share', timestamp: new Date() },
    // Him: 2 story replies (must be EXCLUDED from totalMediaShared!)
    { sender: 'Him', type: 'story_reply', timestamp: new Date() },
    { sender: 'Him', type: 'story_reply', timestamp: new Date() },
  ];

  const senders = ['Her', 'Him'];

  test('counts individual media items in batches and skips broken files', () => {
    const stats = getMediaBreakdownStats(mediaMessages, senders);

    // Her photos: 1 + 3 = 4 photos
    assert.equal(stats.Her.photos, 4);
    // Her reels: 2
    assert.equal(stats.Her.reels, 2);
    // Her total direct media shared = 4 photos + 2 reels = 6
    assert.equal(stats.Her.totalMediaShared, 6);

    // Him video: 1
    assert.equal(stats.Him.videos, 1);
    // Him reel: 1
    assert.equal(stats.Him.reels, 1);
    // Him story replies: 2
    assert.equal(stats.Him.storyReplies, 2);
    // Him total direct media shared = 1 video + 1 reel = 2 (STORY REPLIES EXCLUDED!)
    assert.equal(stats.Him.totalMediaShared, 2);

    // Overall totals
    assert.equal(stats.totals.photos, 4);
    assert.equal(stats.totals.videos, 1);
    assert.equal(stats.totals.reels, 3);
    assert.equal(stats.totals.storyReplies, 2);
    // Total media shared = 4 + 1 + 3 = 8
    assert.equal(stats.totals.totalMediaShared, 8);
    assert.equal(stats.leader, 'Her');
  });

  test('isMediaMessage recognizes new media types for overview stats', () => {
    const overview = getOverviewStats(mediaMessages);
    // 9 total messages - 0 system = 9
    assert.equal(overview.totalMessages, 9);
    // 2 photo msgs + 1 video msg + 3 reel msgs = 6 media messages (story replies excluded from media)
    assert.equal(overview.totalMedia, 6);
  });
});

describe('Instagram Reaction Statistics (Phase 3)', () => {
  const senders = ['Her', 'Him'];

  // Construct realistic messages with reactions
  const msgsWithReactions = [
    // Msg 1: sent by Her, reacted by Him with ❤️
    {
      id: 'm1',
      sender: 'Her',
      timestamp: new Date('2024-10-01T10:00:00'),
      text: 'Good morning!',
      meta: {
        reactions: [{ emoji: '❤️', reaction: '❤️', actor: 'Him', sender: 'Him', timestamp: new Date('2024-10-01T10:02:00') }],
      },
    },
    // Msg 2: sent by Her, reacted by Him with ❤️ AND 😂 (duplicates/multiple reactions from Him -> deduped to 1)
    {
      id: 'm2',
      sender: 'Her',
      timestamp: new Date('2024-10-01T11:00:00'),
      text: 'Look at this funny photo',
      meta: {
        reactions: [
          { emoji: '❤️', reaction: '❤️', actor: 'Him', sender: 'Him', timestamp: new Date('2024-10-01T11:05:00') },
          { emoji: '😂', reaction: '😂', actor: 'Him', sender: 'Him', timestamp: new Date('2024-10-01T11:06:00') },
        ],
      },
    },
    // Msg 3: sent by Her, NO reactions from Him (but Her self-reacted with 🔥)
    {
      id: 'm3',
      sender: 'Her',
      timestamp: new Date('2024-10-01T12:00:00'),
      text: 'Outfit check',
      meta: {
        reactions: [{ emoji: '🔥', reaction: '🔥', actor: 'Her', sender: 'Her' }],
      },
    },
    // Msg 4: sent by Her, NO reactions
    {
      id: 'm4',
      sender: 'Her',
      timestamp: new Date('2024-10-01T13:00:00'),
      text: 'Where are you?',
      meta: {},
    },
    // Msg 5: sent by Him, reacted by Her with 😍
    {
      id: 'm5',
      sender: 'Him',
      timestamp: new Date('2024-10-01T14:00:00'),
      text: 'Here is your coffee',
      meta: {
        reactions: [{ emoji: '😍', reaction: '😍', actor: 'Her', sender: 'Her', timestamp: new Date('2024-10-01T14:01:00') }],
      },
    },
    // Msg 6: sent by Him, NO reactions
    {
      id: 'm6',
      sender: 'Him',
      timestamp: new Date('2024-10-01T15:00:00'),
      text: 'Working now',
      meta: {},
    },
  ];

  test('ChatMessage exposes reactions getter matching meta.reactions without drift', () => {
    const raw = {
      id: 'test-1',
      sender: 'Her',
      timestamp: new Date(),
      text: 'hello',
      meta: {
        reactions: [{ emoji: '❤️', actor: 'Him', sender: 'Him' }],
      },
    };
    const parsed = applyNicknameMapping([raw], { Her: 'Aru', Him: 'Avu' });
    assert.equal(parsed[0].sender, 'Aru');
    assert.equal(parsed[0].reactions.length, 1);
    assert.equal(parsed[0].reactions[0].actor, 'Avu');
    assert.equal(parsed[0].reactions[0].sender, 'Avu');
    // Verify getter returns meta.reactions
    assert.strictEqual(parsed[0].reactions, parsed[0].meta.reactions);
  });

  test('calculates total reactions sent per person', () => {
    const stats = getReactionStats(msgsWithReactions, senders);
    // Her sent reactions:
    // - msg 3: 🔥 (self-reaction, counted in total sent)
    // - msg 5: 😍
    // Total sent by Her = 2
    assert.equal(stats.reactionsSent.Her.count, 2);

    // Him sent reactions:
    // - msg 1: ❤️
    // - msg 2: 😂 (after deduping multiple reactions on msg 2)
    // Total sent by Him = 2
    assert.equal(stats.reactionsSent.Him.count, 2);

    assert.equal(stats.totalReactionsSent, 4);
  });

  test('calculates reaction rate excluding self-reactions and duplicate reactions', () => {
    const stats = getReactionStats(msgsWithReactions, senders);

    // Total messages sent:
    // Her sent 4 messages: m1, m2, m3, m4.
    // Messages of Her receiving at least one reaction from Him:
    // - m1: YES (Him reacted ❤️)
    // - m2: YES (Him reacted 😂)
    // - m3: NO (Her self-reacted 🔥, but Him did not react!)
    // - m4: NO
    // -> 2 of 4 messages received reactions from Him = 50.0%
    assert.equal(stats.reactionRates.Her.totalMessages, 4);
    assert.equal(stats.reactionRates.Her.messagesReacted, 2);
    assert.equal(stats.reactionRates.Her.rate, 50.0);

    // Him sent 2 messages: m5, m6.
    // Messages of Him receiving reaction from Her:
    // - m5: YES (Her reacted 😍)
    // - m6: NO
    // -> 1 of 2 messages received reaction from Her = 50.0%
    assert.equal(stats.reactionRates.Him.totalMessages, 2);
    assert.equal(stats.reactionRates.Him.messagesReacted, 1);
    assert.equal(stats.reactionRates.Him.rate, 50.0);
  });

  test('identifies most-used reaction emoji per person sent to the other', () => {
    const stats = getReactionStats(msgsWithReactions, senders);
    // Her reacting to Him: sent 😍 on m5
    assert.equal(stats.topEmoji.Her.emoji, '😍');
    assert.equal(stats.topEmoji.Her.count, 1);

    // Him reacting to Her: sent 😂 on m2 (latest deduped reaction) and ❤️ on m1
    assert.ok(stats.topEmoji.Him.emoji === '❤️' || stats.topEmoji.Him.emoji === '😂');
    assert.ok(stats.comparison.rows.length >= 2);
  });

  test('computes reaction latency when timestamps are present', () => {
    const stats = getReactionStats(msgsWithReactions, senders);
    assert.equal(stats.timing.hasReactionTimestamps, true);

    // Her reacted on m5: m5 was at 14:00, reaction at 14:01 -> 1 min (60,000 ms)
    assert.equal(stats.timing.Her.fastestMs, 60000);
    assert.equal(stats.timing.Her.formattedFastest, '~1 min');

    // Him reacted on m1 (2 mins) and m2 (6 mins)
    assert.equal(stats.timing.Him.fastestMs, 120000); // 2 mins
    assert.equal(stats.timing.Him.formattedFastest, '~2 min');
  });

  test('cleanly sets hasReactionTimestamps false when reaction timestamps are absent', () => {
    const msgsNoTimestamps = [
      {
        id: '1',
        sender: 'Her',
        timestamp: new Date('2024-10-01'),
        meta: {
          reactions: [{ emoji: '❤️', actor: 'Him', sender: 'Him' }], // No timestamp property
        },
      },
      {
        id: '2',
        sender: 'Him',
        timestamp: new Date('2024-10-01'),
        meta: {
          reactions: [{ emoji: '❤️', actor: 'Her', sender: 'Her' }], // No timestamp property
        },
      },
    ];

    const stats = getReactionStats(msgsNoTimestamps, senders);
    assert.equal(stats.timing.hasReactionTimestamps, false);
    assert.equal(stats.timing.Her.avgMs, null);
    assert.equal(stats.timing.Him.avgMs, null);
  });
});

describe('Cross-Platform Unification Statistics (Phase 4)', () => {
  const sampleWhatsAppText = `12/08/2021, 10:15 - Aru: hey avu!\n12/08/2021, 10:16 - Avu: hey aru, what's up?`;
  const sampleTelegramJson = {
    messages: [
      { id: 1, type: 'message', date: '2022-03-01T14:00:00', from: 'Aru', text: 'telegram is cool' },
      { id: 2, type: 'message', date: '2022-03-01T14:05:00', from: 'Avu', text: 'yeah faster stickers' },
    ],
  };
  const sampleInstagramJson = {
    participants: [{ name: 'Aru' }, { name: 'Avu' }],
    messages: [
      {
        sender_name: 'Avu',
        timestamp_ms: new Date('2023-06-15T20:00:00Z').getTime(),
        content: 'look at this reel',
        share: { link: 'https://instagram.com/reel/xyz123' },
      },
      {
        sender_name: 'Aru',
        timestamp_ms: new Date('2023-06-15T20:05:00Z').getTime(),
        content: 'so funny haha',
      },
    ],
  };

  test('message tagging with platform across WhatsApp, Telegram, and Instagram parsers', () => {
    const wa = parseWhatsApp(sampleWhatsAppText);
    assert.equal(wa.messages[0].platform, 'whatsapp');
    assert.equal(wa.messages[1].platform, 'whatsapp');

    const tg = parseTelegramJson(sampleTelegramJson);
    assert.equal(tg.messages[0].platform, 'telegram');
    assert.equal(tg.messages[1].platform, 'telegram');

    const ig = parseInstagramJson(sampleInstagramJson);
    assert.equal(ig.messages[0].platform, 'instagram');
    assert.equal(ig.messages[1].platform, 'instagram');

    // Check applyNicknameMapping preserves platform
    const mapped = applyNicknameMapping(wa.messages, { Aru: 'Her', Avu: 'Him' });
    assert.equal(mapped[0].platform, 'whatsapp');
    assert.equal(mapped[0].sender, 'Her');
  });

  test('parseChatFiles groups mixed multi-platform batches', async () => {
    const waFile = {
      name: '_chat.txt',
      text: async () => sampleWhatsAppText,
    };
    const igFile = {
      name: 'message_1.json',
      text: async () => JSON.stringify(sampleInstagramJson),
    };

    const res = await parseChatFiles([waFile, igFile]);
    assert.equal(res.multiPlatform, true);
    assert.equal(res.platforms.length, 2);
    assert.equal(res.platforms[0].platform, 'whatsapp');
    assert.equal(res.platforms[1].platform, 'instagram');
  });

  test('computes unified relationship timeline, absolute first message, and busiest day across platforms', () => {
    const mixedMessages = [
      // Earliest ever: WhatsApp on 2021-08-12
      {
        id: 'wa-1',
        sender: 'Her',
        timestamp: new Date('2021-08-12T10:15:00'),
        text: 'hello from whatsapp!',
        platform: 'whatsapp',
        type: 'text',
      },
      {
        id: 'wa-2',
        sender: 'Him',
        timestamp: new Date('2021-08-12T10:20:00'),
        text: 'hey there!',
        platform: 'whatsapp',
        type: 'text',
      },
      // Telegram in 2022
      {
        id: 'tg-1',
        sender: 'Her',
        timestamp: new Date('2022-02-14T11:00:00'),
        text: 'happy valentines day!',
        platform: 'telegram',
        type: 'text',
      },
      {
        id: 'tg-2',
        sender: 'Him',
        timestamp: new Date('2022-02-14T11:05:00'),
        text: 'happy valentines!! ❤️',
        platform: 'telegram',
        type: 'text',
      },
      // Instagram on same day 2022-02-14 making it the busiest day (4 messages)
      {
        id: 'ig-1',
        sender: 'Her',
        timestamp: new Date('2022-02-14T18:00:00'),
        text: 'check this out',
        platform: 'instagram',
        type: 'text',
      },
      {
        id: 'ig-2',
        sender: 'Him',
        timestamp: new Date('2022-02-14T18:30:00'),
        text: 'aww lovely',
        platform: 'instagram',
        type: 'text',
      },
      // Instagram later in 2023
      {
        id: 'ig-3',
        sender: 'Her',
        timestamp: new Date('2023-05-01T09:00:00'),
        text: 'good morning',
        platform: 'instagram',
        type: 'text',
      },
    ];

    const stats = getCrossPlatformStats(mixedMessages);

    // Platform breakdown
    assert.equal(stats.isMultiPlatform, true);
    assert.equal(stats.totalMessages, 7);
    assert.deepEqual(stats.activePlatforms.sort(), ['instagram', 'telegram', 'whatsapp']);
    assert.equal(stats.platformBreakdown.length, 3);
    const igBreakdown = stats.platformBreakdown.find((p) => p.platform === 'instagram');
    assert.equal(igBreakdown.color, '#8A2BE2');

    // Absolute first message ever
    assert.ok(stats.firstMessage);
    assert.equal(stats.firstMessage.id, 'wa-1');
    assert.equal(stats.firstMessage.platform, 'whatsapp');
    assert.equal(stats.firstMessage.sender, 'Her');
    assert.equal(stats.firstMessage.text, 'hello from whatsapp!');

    // Busiest day combined
    assert.ok(stats.busiestDay);
    assert.equal(stats.busiestDay.dateKey, '2022-02-14');
    assert.equal(stats.busiestDay.total, 4);
    assert.equal(stats.busiestDay.breakdown.telegram, 2);
    assert.equal(stats.busiestDay.breakdown.instagram, 2);
    assert.equal(stats.busiestDay.breakdown.whatsapp, 0);
    assert.equal(stats.busiestDay.shares.telegram, 50);
    assert.equal(stats.busiestDay.shares.instagram, 50);

    // Platform migration timeline
    assert.ok(stats.migrationTimeline.length >= 3);
    const aug21 = stats.migrationTimeline.find((m) => m.monthKey === '2021-08');
    assert.ok(aug21);
    assert.equal(aug21.whatsapp, 2);
    assert.equal(aug21.dominantPlatform, 'whatsapp');

    const feb22 = stats.migrationTimeline.find((m) => m.monthKey === '2022-02');
    assert.ok(feb22);
    assert.equal(feb22.total, 4);

    const may23 = stats.migrationTimeline.find((m) => m.monthKey === '2023-05');
    assert.ok(may23);
    assert.equal(may23.instagram, 1);
    assert.equal(may23.dominantPlatform, 'instagram');

    // Migration narrative
    assert.ok(stats.migrationNarrative.includes('WhatsApp'));
    assert.ok(stats.migrationNarrative.includes('Instagram'));
  });

  test('graceful degradation when only 1 platform is loaded', () => {
    const singlePlatformMsgs = [
      {
        id: 'wa-1',
        sender: 'Her',
        timestamp: new Date('2023-01-01T12:00:00'),
        text: 'hello world',
        platform: 'whatsapp',
        type: 'text',
      },
      {
        id: 'wa-2',
        sender: 'Him',
        timestamp: new Date('2023-01-01T12:05:00'),
        text: 'hey!',
        platform: 'whatsapp',
        type: 'text',
      },
    ];

    const stats = getCrossPlatformStats(singlePlatformMsgs);
    assert.equal(stats.isMultiPlatform, false);
    assert.deepEqual(stats.activePlatforms, ['whatsapp']);
    assert.equal(stats.totalMessages, 2);
    assert.ok(stats.firstMessage);
    assert.equal(stats.firstMessage.platform, 'whatsapp');
    assert.ok(stats.busiestDay);
    assert.equal(stats.busiestDay.total, 2);
    assert.ok(stats.migrationNarrative.includes('WhatsApp'));
  });

  test('WhatsApp messages containing reel links in text do not have type reel_share and produce 0 reels', () => {
    const waText = [
      '01/01/2024, 10:00 - Aru: Check out this funny reel https://www.instagram.com/reel/C3abc123/',
      '01/01/2024, 10:05 - Avu: haha so cute!',
    ].join('\n');

    const parsed = parseWhatsApp(waText);
    assert.equal(parsed.messages.length, 2);
    // WhatsApp parser must not tag plain text link as reel_share
    assert.ok(parsed.messages.every((m) => m.type !== 'reel_share'));
    const reelStats = getReelStats(parsed.messages, ['Aru', 'Avu']);
    assert.equal(reelStats.totalReels, 0);
  });
});


