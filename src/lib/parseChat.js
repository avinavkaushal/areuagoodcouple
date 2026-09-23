const LINE_RE = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4}),\s(\d{1,2}):(\d{2})\s-\s([^:]+):\s(.*)$/;

export function parseChat(text) {
  const lines = text.split('\n');
  const messages = [];
  for (const line of lines) {
    const m = line.match(LINE_RE);
    if (m) {
      const [, day, month, year, hour, min, sender, msg] = m;
      messages.push({
        date: new Date(2000 + +year, month - 1, +day, +hour, +min),
        sender: sender.trim(),
        text: msg
      });
    } else if (messages.length) {
      messages[messages.length - 1].text += '\n' + line;
    }
  }
  return messages;
}