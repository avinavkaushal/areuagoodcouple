import test from 'node:test';
import assert from 'node:assert/strict';
import { parseWhatsApp } from '../src/lib/parseChat.js';
import { getLoveWordStats, getCalloutStats, getResponseTimeStats } from '../src/lib/stats.js';

const S = ['A', 'B'];

test('no leader is named when there is no data or a tie', () => {
  const none = parseWhatsApp('12/05/2023, 10:00 - A: hello\n12/05/2023, 10:01 - B: hi').messages;
  const love = getLoveWordStats(none, S);
  assert.equal(love.whoSaysLoveMore, null);
  assert.equal(love.whoSaysMoreOverall, null);
  const call = getCalloutStats(none, S);
  assert.equal(call.morning.leader, null);
  assert.equal(call.night.leader, null);

  const tie = parseWhatsApp('12/05/2023, 10:00 - A: love you\n12/05/2023, 10:01 - B: love u too').messages;
  assert.equal(getLoveWordStats(tie, S).whoSaysLoveMore, null);
});

test('leader is still named when one side clearly leads', () => {
  const msgs = parseWhatsApp(
    '12/05/2023, 10:00 - A: good morning\n12/05/2023, 10:01 - B: hi\n13/05/2023, 10:00 - A: gm\n13/05/2023, 10:01 - A: i love you'
  ).messages;
  assert.equal(getCalloutStats(msgs, S).morning.leader, 'A');
  assert.equal(getLoveWordStats(msgs, S).whoSaysMoreOverall, 'A');
});

test('fasterSender is null when nobody replied, named otherwise', () => {
  const same = parseWhatsApp('12/05/2023, 10:00 - A: one\n12/05/2023, 10:01 - A: two').messages;
  assert.equal(getResponseTimeStats(same, S).fasterSender, null);
  const talk = parseWhatsApp('12/05/2023, 10:00 - A: one\n12/05/2023, 10:05 - B: two\n12/05/2023, 10:06 - A: three').messages;
  assert.equal(getResponseTimeStats(talk, S).fasterSender, 'A');
});
