import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  PLATFORMS,
  FAQ_ITEMS,
  FOOTER_COPY,
} from '../src/constants/landingContent.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('Landing Screen Content & Constants', () => {
  test('Platform steps contain exact copy for WhatsApp, Telegram, and Instagram', () => {
    const wa = PLATFORMS.find((p) => p.id === 'whatsapp');
    assert.ok(wa, 'WhatsApp platform config must exist');
    assert.strictEqual(wa.ext, '.txt');
    assert.strictEqual(wa.note, 'File type: .txt');
    assert.strictEqual(wa.steps.length, 4);
    assert.strictEqual(wa.steps[0].text, 'Open the chat with your partner.');
    assert.strictEqual(
      wa.steps[1].text,
      'Tap More (three dots) -> Export chat. (On iPhone: tap the contact name -> Export Chat.)'
    );
    assert.strictEqual(wa.steps[2].text, 'Choose "Without Media".');
    assert.strictEqual(
      wa.steps[3].text,
      'Save or share the .txt file to your device, then upload it here.'
    );

    const tg = PLATFORMS.find((p) => p.id === 'telegram');
    assert.ok(tg, 'Telegram platform config must exist');
    assert.strictEqual(tg.ext, '.json');
    assert.strictEqual(tg.note, 'File type: .json');
    assert.strictEqual(tg.steps.length, 5);
    assert.strictEqual(
      tg.steps[0].text,
      'Open Telegram Desktop (export is not available on mobile).'
    );
    assert.strictEqual(tg.steps[1].text, 'Open the chat with your partner.');
    assert.strictEqual(
      tg.steps[2].text,
      'Tap the three dots at top right -> Export chat history.'
    );
    assert.strictEqual(
      tg.steps[3].text,
      'Untick all media. Set Format to "Machine-readable JSON".'
    );
    assert.strictEqual(
      tg.steps[4].text,
      'Click Export, then upload the generated result.json here.'
    );

    const ig = PLATFORMS.find((p) => p.id === 'instagram');
    assert.ok(ig, 'Instagram platform config must exist');
    assert.strictEqual(ig.ext, '.json');
    assert.strictEqual(
      ig.note,
      'File type: message_N.json (you can select several at once)'
    );
    assert.strictEqual(
      ig.hint,
      'Instagram menus change often; names may differ slightly.'
    );
    assert.strictEqual(ig.steps.length, 4);
    assert.strictEqual(
      ig.steps[0].text,
      'Open Settings -> Your activity -> Download your information.'
    );
    assert.strictEqual(
      ig.steps[1].text,
      'Choose the JSON format and select Messages.'
    );
    assert.strictEqual(
      ig.steps[2].text,
      "Request the download and wait for Instagram's email."
    );
    assert.strictEqual(
      ig.steps[3].text,
      "Unzip it, open the messages folder, find your chat's folder, and upload one or all of its message_N.json files."
    );
  });

  test('FAQ items contain all 8 exact questions and answers with GitHub repo link', () => {
    assert.strictEqual(FAQ_ITEMS.length, 8);
    assert.strictEqual(FAQ_ITEMS[0].question, 'Is my chat uploaded anywhere?');
    assert.strictEqual(
      FAQ_ITEMS[0].answer,
      'No. Your file is read and analyzed right inside your browser. It never leaves your device and is never sent to any server or database.'
    );

    assert.strictEqual(FAQ_ITEMS[1].question, 'How does it work on my phone?');
    assert.strictEqual(
      FAQ_ITEMS[1].answer,
      "Your phone's browser reads the file locally and does all the counting itself. Once the page has loaded, the analysis does not need the internet."
    );

    assert.strictEqual(FAQ_ITEMS[2].question, 'Do you store anything?');
    assert.strictEqual(
      FAQ_ITEMS[2].answer,
      'No. There are no accounts, no database, no cookies for tracking. Refresh or close the tab and everything is gone.'
    );

    assert.strictEqual(
      FAQ_ITEMS[3].question,
      'Which platforms are supported?'
    );
    assert.strictEqual(
      FAQ_ITEMS[3].answer,
      'WhatsApp (.txt), Telegram Desktop (.json) and Instagram DMs (message_N.json). Group chats are not the focus; the stats are built for two people.'
    );

    assert.strictEqual(
      FAQ_ITEMS[4].question,
      'Why should I export WhatsApp "Without Media"?'
    );
    assert.strictEqual(
      FAQ_ITEMS[4].answer,
      'Media makes the file huge and adds nothing to the stats. Without Media keeps it small and fast.'
    );

    assert.strictEqual(
      FAQ_ITEMS[5].question,
      'My file is big. Will it be slow?'
    );
    assert.strictEqual(
      FAQ_ITEMS[5].answer,
      'Large chats with years of messages can take a few seconds. Keep the tab open until the results appear.'
    );

    assert.strictEqual(FAQ_ITEMS[6].question, 'Can I trust this?');
    assert.strictEqual(
      FAQ_ITEMS[6].linkHref,
      'https://github.com/avinavkaushal/areuagoodcouple'
    );
    assert.strictEqual(FAQ_ITEMS[6].linkText, 'GitHub');

    assert.strictEqual(FAQ_ITEMS[7].question, 'Why does this exist?');
    assert.strictEqual(
      FAQ_ITEMS[7].answer,
      'Because every chat is a little love story, and numbers can be fun to look at.'
    );
  });

  test('Footer copy matches specifications', () => {
    assert.strictEqual(FOOTER_COPY.creator, 'Avinav');
    assert.strictEqual(
      FOOTER_COPY.quote,
      'Every chat is a small love letter.'
    );
    assert.strictEqual(
      FOOTER_COPY.githubUrl,
      'https://github.com/avinavkaushal/areuagoodcouple'
    );
  });
});

describe('Landing Screen Code & Structural Checks', () => {
  test('Dropzone card lists platforms in exactly one place (chips)', () => {
    const dropzoneFile = fs.readFileSync(
      path.join(rootDir, 'src/components/landing/UploadDropzone.jsx'),
      'utf-8'
    );

    // Old duplicate text must not exist
    assert.ok(
      !dropzoneFile.includes('Supports WhatsApp'),
      'Old "Supports WhatsApp..." text should not be in UploadDropzone'
    );
    assert.ok(
      !dropzoneFile.includes('Drag & drop your WhatsApp'),
      'Old paragraph listing platforms should not be in UploadDropzone'
    );

    // Single line text must exist
    assert.ok(
      dropzoneFile.includes('or tap below to browse your files'),
      'Mobile single-line prompt must exist'
    );
    assert.ok(
      dropzoneFile.includes('or click to browse'),
      'Desktop single-line prompt must exist'
    );

    // Platform chips component must be rendered
    assert.ok(
      dropzoneFile.includes('<PlatformChips'),
      'PlatformChips must be rendered in UploadDropzone'
    );
  });

  test('Old loose floating help text is removed from App.jsx and replaced with new cards', () => {
    const appFile = fs.readFileSync(path.join(rootDir, 'src/App.jsx'), 'utf-8');

    // Check old floating help text is removed
    assert.ok(
      !appFile.includes('Quick Help Guide'),
      'Old quick help guide must be removed'
    );
    assert.ok(
      !appFile.includes('Open chat → tap'),
      'Old floating text must be removed'
    );

    // Check new components are rendered
    assert.ok(appFile.includes('<ExportGuideTabs'), 'ExportGuideTabs must be mounted');
    assert.ok(appFile.includes('<FaqAccordion'), 'FaqAccordion must be mounted');
    assert.ok(appFile.includes('<SiteFooter'), 'SiteFooter must be mounted');
  });

  test('No trust strip or extra icon row is added under dropzone', () => {
    const dropzoneFile = fs.readFileSync(
      path.join(rootDir, 'src/components/landing/UploadDropzone.jsx'),
      'utf-8'
    );
    assert.ok(
      !dropzoneFile.includes('trust-strip'),
      'No trust strip class should exist'
    );
    assert.ok(
      !dropzoneFile.includes('trusted by'),
      'No trust strip text should exist'
    );
  });

  test('ExportGuideTabs includes WAI-ARIA tab semantics', () => {
    const tabsFile = fs.readFileSync(
      path.join(rootDir, 'src/components/landing/ExportGuideTabs.jsx'),
      'utf-8'
    );
    assert.ok(tabsFile.includes('role="tablist"'), 'Must have role="tablist"');
    assert.ok(tabsFile.includes('role="tab"'), 'Must have role="tab"');
    assert.ok(tabsFile.includes('role="tabpanel"'), 'Must have role="tabpanel"');
    assert.ok(tabsFile.includes('aria-selected'), 'Must have aria-selected');
    assert.ok(tabsFile.includes('aria-controls'), 'Must have aria-controls');
    assert.ok(tabsFile.includes('font-pixel'), 'Must use pixel font for tab labels');
  });

  test('FaqAccordion includes WAI-ARIA accordion semantics and rotating chevron', () => {
    const faqFile = fs.readFileSync(
      path.join(rootDir, 'src/components/landing/FaqAccordion.jsx'),
      'utf-8'
    );
    assert.ok(faqFile.includes('aria-expanded'), 'Must have aria-expanded');
    assert.ok(faqFile.includes('aria-controls'), 'Must have aria-controls');
    assert.ok(faqFile.includes('min-h-[48px]'), 'Must have min 48px touch target');
    assert.ok(faqFile.includes('rotate-180'), 'Must rotate chevron on open');
  });

  test('SiteFooter renders static heart icon and links correctly', () => {
    const footerFile = fs.readFileSync(
      path.join(rootDir, 'src/components/landing/SiteFooter.jsx'),
      'utf-8'
    );
    assert.ok(
      !footerFile.includes('animate-heartbeat'),
      'Heart must be static without bouncing animation'
    );
    assert.ok(
      footerFile.includes('made with'),
      'Footer must include "made with"'
    );
    assert.ok(
      footerFile.includes('Open source on GitHub'),
      'Footer must include GitHub link'
    );
  });
});
