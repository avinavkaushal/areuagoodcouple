export const PLATFORMS = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    ext: '.txt',
    ariaLabel: 'See how to export from WhatsApp',
    colorClass: 'text-wa-pink',
    note: 'File type: .txt',
    steps: [
      {
        text: 'Open the chat with your partner.',
        lead: null,
      },
      {
        text: 'Tap More (three dots) -> Export chat. (On iPhone: tap the contact name -> Export Chat.)',
        highlights: ['More (three dots)', 'Export chat', 'Export Chat'],
      },
      {
        text: 'Choose "Without Media".',
        highlights: ['"Without Media"'],
      },
      {
        text: 'Save or share the .txt file to your device, then upload it here.',
        highlights: ['.txt'],
      },
    ],
  },
  {
    id: 'telegram',
    name: 'Telegram',
    ext: '.json',
    ariaLabel: 'See how to export from Telegram',
    colorClass: 'text-tg-pink',
    note: 'File type: .json',
    steps: [
      {
        text: 'Open Telegram Desktop (export is not available on mobile).',
        highlights: ['Telegram Desktop'],
      },
      {
        text: 'Open the chat with your partner.',
        lead: null,
      },
      {
        text: 'Tap the three dots at top right -> Export chat history.',
        highlights: ['Export chat history'],
      },
      {
        text: 'Untick all media. Set Format to "Machine-readable JSON".',
        highlights: ['"Machine-readable JSON"'],
      },
      {
        text: 'Click Export, then upload the generated result.json here.',
        highlights: ['Export', 'result.json'],
      },
    ],
  },
  {
    id: 'instagram',
    name: 'Instagram',
    ext: '.json',
    ariaLabel: 'See how to export from Instagram',
    colorClass: 'text-ig-pink',
    note: 'File type: message_N.json (you can select several at once)',
    hint: 'Instagram menus change often; names may differ slightly.',
    steps: [
      {
        text: 'Open Settings -> Your activity -> Download your information.',
        highlights: ['Settings', 'Your activity', 'Download your information'],
      },
      {
        text: 'Choose the JSON format and select Messages.',
        highlights: ['JSON', 'Messages'],
      },
      {
        text: "Request the download and wait for Instagram's email.",
        lead: null,
      },
      {
        text: "Unzip it, open the messages folder, find your chat's folder, and upload one or all of its message_N.json files.",
        highlights: ['messages', 'message_N.json'],
      },
    ],
  },
];

export const FAQ_ITEMS = [
  {
    question: 'Is my chat uploaded anywhere?',
    answer:
      'No. Your file is read and analyzed right inside your browser. It never leaves your device and is never sent to any server or database.',
  },
  {
    question: 'How does it work on my phone?',
    answer:
      "Your phone's browser reads the file locally and does all the counting itself. Once the page has loaded, the analysis does not need the internet.",
  },
  {
    question: 'Do you store anything?',
    answer:
      'No. There are no accounts, no database, no cookies for tracking. Refresh or close the tab and everything is gone.',
  },
  {
    question: 'Which platforms are supported?',
    answer:
      'WhatsApp (.txt), Telegram Desktop (.json) and Instagram DMs (message_N.json). Group chats are not the focus; the stats are built for two people.',
  },
  {
    question: 'Why should I export WhatsApp "Without Media"?',
    answer:
      'Media makes the file huge and adds nothing to the stats. Without Media keeps it small and fast.',
  },
  {
    question: 'My file is big. Will it be slow?',
    answer:
      'Large chats with years of messages can take a few seconds. Keep the tab open until the results appear.',
  },
  {
    question: 'Can I trust this?',
    isTrust: true,
    answerPrefix: 'The code is open source. You can read exactly what it does on ',
    linkText: 'GitHub',
    linkHref: 'https://github.com/avinavkaushal/areuagoodcouple',
    answerSuffix: '.',
  },
  {
    question: 'Why does this exist?',
    answer:
      'Because every chat is a little love story, and numbers can be fun to look at.',
  },
];

export const FOOTER_COPY = {
  creator: 'Avinav',
  quote: 'Every chat is a small love letter.',
  githubUrl: 'https://github.com/avinavkaushal/areuagoodcouple',
};
