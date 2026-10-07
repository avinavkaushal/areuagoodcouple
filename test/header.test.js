import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('Sticky Glass Site Header', () => {
  test('SiteHeader component is correctly structured with glass states and layout', () => {
    const headerFile = fs.readFileSync(
      path.join(rootDir, 'src/components/landing/SiteHeader.jsx'),
      'utf-8'
    );

    // Fixed / sticky positioning above page content (z-30)
    assert.ok(headerFile.includes('fixed'), 'Header must be fixed positioned');
    assert.ok(headerFile.includes('top-0'), 'Header must be pinned to top');
    assert.ok(headerFile.includes('inset-x-0'), 'Header must be full-width');
    assert.ok(headerFile.includes('z-30'), 'Header must have z-30 (above cards at z-10, below modals at z-50)');

    // Scroll state toggling
    assert.ok(headerFile.includes('useScrolled'), 'Must have useScrolled hook');
    assert.ok(headerFile.includes('site-header-scrolled'), 'Must use site-header-scrolled class');
    assert.ok(headerFile.includes('site-header-top'), 'Must use site-header-top class');

    // Safe area insets
    assert.ok(headerFile.includes('env(safe-area-inset-top'), 'Must respect safe-area-inset-top');
    assert.ok(headerFile.includes('env(safe-area-inset-left'), 'Must respect safe-area-inset-left');
    assert.ok(headerFile.includes('env(safe-area-inset-right'), 'Must respect safe-area-inset-right');

    // Inner container
    assert.ok(headerFile.includes('max-w-[1200px]'), 'Inner container max-width ~1200px');
    assert.ok(headerFile.includes('justify-between'), 'Inner container must space logo and GitHub link');
  });

  test('Logo maintains exact typography, links to "/", and does not wrap', () => {
    const headerFile = fs.readFileSync(
      path.join(rootDir, 'src/components/landing/SiteHeader.jsx'),
      'utf-8'
    );

    assert.ok(headerFile.includes('areuagood'), 'Logo must have "areuagood"');
    assert.ok(headerFile.includes('text-pink">couple'), 'Logo must have pink "couple"');
    assert.ok(headerFile.includes('href="/"'), 'Logo must link to "/"');
    assert.ok(headerFile.includes('font-serif'), 'Logo must use font-serif');
    assert.ok(headerFile.includes('whitespace-nowrap'), 'Logo must not wrap on small screens');
    assert.ok(headerFile.includes('aria-label='), 'Logo must have accessible aria-label');
  });

  test('GitHub icon link meets all addendum accessibility and style requirements', () => {
    const headerFile = fs.readFileSync(
      path.join(rootDir, 'src/components/landing/SiteHeader.jsx'),
      'utf-8'
    );

    // Repo URL & attributes
    assert.ok(
      headerFile.includes('https://github.com/avinavkaushal/areuagoodcouple'),
      'Must link to repo URL'
    );
    assert.ok(headerFile.includes('target="_blank"'), 'Must open in new tab');
    assert.ok(headerFile.includes('rel="noopener noreferrer"'), 'Must have security rel attributes');
    assert.ok(
      headerFile.includes('aria-label="View source on GitHub"'),
      'Must have descriptive aria-label'
    );

    // 44x44px min tap target
    assert.ok(headerFile.includes('min-w-[44px]'), 'Must have min 44px width tap target');
    assert.ok(headerFile.includes('min-h-[44px]'), 'Must have min 44px height tap target');

    // Inline Octicon SVG
    assert.ok(headerFile.includes('viewBox="0 0 24 24"'), 'Must have 24x24 Octicon viewBox');
    assert.ok(headerFile.includes('fill="currentColor"'), 'Must use currentColor fill');

    // Focus ring and reduced motion
    assert.ok(headerFile.includes('focus-visible:outline-pink'), 'Must have visible pink focus ring');
    assert.ok(headerFile.includes('motion-reduce:transform-none'), 'Must disable scale on reduced motion');
  });

  test('CSS rules define glass backdrop, blur, shadow, and non-backdrop fallback', () => {
    const cssFile = fs.readFileSync(
      path.join(rootDir, 'src/index.css'),
      'utf-8'
    );

    assert.ok(cssFile.includes('.site-header-scrolled'), 'Must have .site-header-scrolled');
    assert.ok(cssFile.includes('backdrop-filter: blur('), 'Must have backdrop-filter blur');
    assert.ok(cssFile.includes('-webkit-backdrop-filter: blur('), 'Must have -webkit-backdrop-filter');
    assert.ok(cssFile.includes('border-bottom: 1px solid rgba(255, 255, 255, 0.08)'), 'Must have bottom border');
    assert.ok(cssFile.includes('box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25)'), 'Must have shadow');
    assert.ok(cssFile.includes('.site-header-top'), 'Must have .site-header-top transparent state');
    assert.ok(cssFile.includes('@supports not ((backdrop-filter: blur(1px))'), 'Must have @supports not fallback');

    // Scroll padding
    assert.ok(cssFile.includes('scroll-padding-top: 4.5rem'), 'Mobile scroll-padding-top must be 4.5rem');
    assert.ok(cssFile.includes('scroll-margin-top: 4.5rem'), 'Mobile scroll-margin-top must be 4.5rem');
  });

  test('App.jsx mounts SiteHeader and provides page top offset', () => {
    const appFile = fs.readFileSync(
      path.join(rootDir, 'src/App.jsx'),
      'utf-8'
    );

    assert.ok(appFile.includes('<SiteHeader'), 'App.jsx must render SiteHeader');
    assert.ok(appFile.includes('pt-[calc(4.5rem+env(safe-area-inset-top,0px))]'), 'App.jsx must offset page content for header');
  });
});
