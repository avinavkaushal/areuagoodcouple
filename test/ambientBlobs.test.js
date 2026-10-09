import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkAmbientBarrier } from '../src/lib/interactions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('Ambient Light Blobs Scroll-Triggered Fade-In', () => {
  test('CSS rules define default opacity 0, smooth transition, and .is-visible opacity 1', () => {
    const css = fs.readFileSync(path.join(rootDir, 'src/index.css'), 'utf-8');

    // Default hidden state with transition
    assert.match(
      css,
      /\.ambient__orb\s*\{[^}]*opacity:\s*0;/s,
      '.ambient__orb must have opacity: 0 by default'
    );
    assert.match(
      css,
      /\.ambient__orb\s*\{[^}]*transition:\s*opacity\s+1\.2s/s,
      '.ambient__orb must have a smooth transition for opacity'
    );
    assert.match(
      css,
      /\.ambient__orb\s*\{[^}]*will-change:\s*transform,\s*opacity;/s,
      '.ambient__orb must declare will-change: transform, opacity'
    );

    // Visible state
    assert.match(
      css,
      /\.ambient\.is-visible\s+\.ambient__orb/s,
      '.ambient.is-visible must target .ambient__orb'
    );
    assert.match(
      css,
      /\.ambient\.is-visible\s+\.ambient__orb[^}]*opacity:\s*1;/s,
      '.ambient.is-visible must set opacity: 1'
    );

    // Staggered bloom delays
    assert.ok(
      css.includes('.ambient.is-visible .ambient__orb--1') &&
      css.includes('.ambient.is-visible .ambient__orb--2') &&
      css.includes('.ambient.is-visible .ambient__orb--3'),
      'Staggered transition delays should be configured for the 3 orbs'
    );
  });

  test('Barrier returns false when user is at the top of the chat story (Hero section)', () => {
    // Window is 800px tall. Hero occupies the first ~750px.
    // Unified is located below Hero (top at 750px, height 900px).
    // Milestones is located below Unified (top at 1650px).
    const mockWin = { innerHeight: 800, scrollY: 0 };
    const mockDoc = {
      getElementById: (id) => {
        if (id === 'unified') {
          return {
            getBoundingClientRect: () => ({ top: 750, height: 900 }),
          };
        }
        if (id === 'milestones') {
          return {
            getBoundingClientRect: () => ({ top: 1650, height: 800 }),
          };
        }
        return null;
      },
    };

    const isVisible = checkAmbientBarrier(mockWin, mockDoc);
    assert.equal(isVisible, false, 'Blobs should remain hidden when at the top hero');
  });

  test('Barrier returns true when scrolled halfway through Unified', () => {
    const mockWin = { innerHeight: 800, scrollY: 800 };
    // Unified is halfway scrolled through (center at or above viewport center)
    // uRect.top = -100, height = 900 -> midpoint = -100 + 450 = 350 <= 400 (innerHeight * 0.5)
    // Milestones top is at 800px (outside nearMilestones threshold of window.innerHeight + 150 = 950,
    // let's test specifically halfwayUnified triggering)
    const mockDoc = {
      getElementById: (id) => {
        if (id === 'unified') {
          return {
            getBoundingClientRect: () => ({ top: -100, height: 900 }),
          };
        }
        if (id === 'milestones') {
          return {
            getBoundingClientRect: () => ({ top: 1200, height: 800 }),
          };
        }
        return null;
      },
    };

    const isVisible = checkAmbientBarrier(mockWin, mockDoc);
    assert.equal(isVisible, true, 'Blobs should appear when halfway through Unified');
  });

  test('Barrier returns true when almost reaching Milestones', () => {
    const mockWin = { innerHeight: 800, scrollY: 700 };
    // Milestone top is at 900px, which is <= window.innerHeight + 150 (800 + 150 = 950px)
    const mockDoc = {
      getElementById: (id) => {
        if (id === 'unified') {
          return {
            // Suppose Unified is not halfway yet (midpoint = 500 > 400)
            getBoundingClientRect: () => ({ top: 50, height: 900 }),
          };
        }
        if (id === 'milestones') {
          return {
            getBoundingClientRect: () => ({ top: 920, height: 800 }),
          };
        }
        return null;
      },
    };

    const isVisible = checkAmbientBarrier(mockWin, mockDoc);
    assert.equal(isVisible, true, 'Blobs should appear when almost reaching Milestones');
  });

  test('Barrier returns true when scrolled deep into story sections past Milestones', () => {
    const mockWin = { innerHeight: 800, scrollY: 2500 };
    const mockDoc = {
      getElementById: (id) => {
        if (id === 'unified') {
          return {
            getBoundingClientRect: () => ({ top: -1700, height: 900 }),
          };
        }
        if (id === 'milestones') {
          return {
            getBoundingClientRect: () => ({ top: -800, height: 800 }),
          };
        }
        return null;
      },
    };

    const isVisible = checkAmbientBarrier(mockWin, mockDoc);
    assert.equal(isVisible, true, 'Blobs should remain visible further down the page');
  });

  test('Landing screen fallback: hidden at top, appears when scrolled down towards export guide', () => {
    const mockDoc = {
      getElementById: (id) => {
        if (id === 'export-guide') {
          return {
            getBoundingClientRect: () => ({ top: 750, height: 600 }),
          };
        }
        return null;
      },
    };

    // At top of landing screen
    const atTopWin = { innerHeight: 800, scrollY: 0 };
    assert.equal(checkAmbientBarrier(atTopWin, mockDoc), false, 'Landing top should keep blobs hidden');

    // Scrolled down towards export guide
    const scrolledDoc = {
      getElementById: (id) => {
        if (id === 'export-guide') {
          return {
            getBoundingClientRect: () => ({ top: 500, height: 600 }),
          };
        }
        return null;
      },
    };
    const scrolledWin = { innerHeight: 800, scrollY: 350 };
    assert.equal(checkAmbientBarrier(scrolledWin, scrolledDoc), true, 'Landing scrolled should show blobs');
  });
});
