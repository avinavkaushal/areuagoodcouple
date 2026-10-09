import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('Apple-Style Draggable Pill QuickNav', () => {
  const quickNavPath = path.join(rootDir, 'src/components/QuickNav.jsx');
  const quickNavCode = fs.readFileSync(quickNavPath, 'utf-8');

  test('STEP 0 & 1 - Structure & Unclip: Dedicated .nav-bg, stacking order, overflow visible, and GPU transforms', () => {
    // Dedicated .nav-bg layer with z-index 0
    assert.ok(
      quickNavCode.includes('className="nav-bg absolute inset-0 rounded-full pointer-events-none"'),
      'Must have dedicated .nav-bg layer with inset-0 and pointer-events-none'
    );
    assert.ok(
      quickNavCode.includes('zIndex: 0'),
      '.nav-bg must have z-index 0'
    );

    // Pill has z-index 1
    assert.ok(
      quickNavCode.includes('ref={pillRef}'),
      'Must have pillRef for GSAP transforms'
    );
    assert.ok(
      quickNavCode.includes('aria-hidden="true"'),
      'Pill must be aria-hidden'
    );
    assert.ok(
      quickNavCode.includes('zIndex: 1'),
      'Pill must be z-index 1'
    );

    // Labels have z-index 2
    assert.ok(
      quickNavCode.includes('relative z-[2]'),
      'Nav item labels must have relative z-[2] (stacking: .nav-bg 0 < pill 1 < labels 2)'
    );

    // Containers have overflow-visible
    assert.ok(
      quickNavCode.includes('overflow-visible'),
      'Nav containers must have overflow-visible to avoid clipping the pill'
    );

    // Measure rects with refs and ResizeObserver
    assert.ok(
      quickNavCode.includes('ResizeObserver'),
      'Must measure item rects via ResizeObserver'
    );
    assert.ok(
      quickNavCode.includes('document.fonts?.ready'),
      'Must re-measure on font load'
    );
  });

  test('STEP 2 - Rest Size & Centering: top: 50% with yPercent: -50, scaleX 1.10 and scaleY 1.06 max', () => {
    // Rest size: top: 50%, height: calc(100% - 8px), centered with yPercent: -50
    assert.ok(
      quickNavCode.includes("top: '50%'"),
      'Pill must be positioned at top: 50%'
    );
    assert.ok(
      quickNavCode.includes("height: 'calc(100% - 8px)'") ||
        quickNavCode.includes('calc(100% - 8px)'),
      'Pill at rest must have calc(100% - 8px) height giving 4px room top and bottom'
    );
    assert.ok(
      quickNavCode.includes('yPercent: -50'),
      'Vertical centering must be handled via GSAP yPercent: -50'
    );
    assert.ok(
      quickNavCode.includes("transformOrigin: '50% 50%'"),
      'Must preserve transformOrigin 50% 50%'
    );

    // Lift scale limits: scaleX 1.10, scaleY 1.06 max
    assert.ok(
      quickNavCode.includes('scaleX: reduced ? 1 : 1.10') ||
        quickNavCode.includes('scaleX: 1.10'),
      'Lift tween must set scaleX up to 1.10'
    );
    assert.ok(
      quickNavCode.includes('scaleY: reduced ? 1 : 1.06') ||
        quickNavCode.includes('scaleY: 1.06'),
      'Lift tween must set scaleY up to 1.06 max to prevent vertical clipping'
    );
  });

  test('STEP 2 & 3 - Drag Mechanics & Shadow/Overflow: Pointer events, touch-action, velocity stretch, and haptics', () => {
    // Pointer events and capture
    assert.ok(
      quickNavCode.includes('setPointerCapture'),
      'Must use setPointerCapture for touch/mouse/pen drag'
    );
    assert.ok(
      quickNavCode.includes("touchAction: 'none'"),
      'touchAction: none must be applied to pill'
    );
    assert.ok(
      quickNavCode.includes('touch-pan-y'),
      'Container must allow vertical page touch scrolling'
    );
    // Velocity tracking and stretch
    assert.ok(
      quickNavCode.includes('velocity'),
      'Must track pointer velocity'
    );
    assert.ok(
      quickNavCode.includes('scaleX') && quickNavCode.includes('scaleY'),
      'Must support velocity stretch for liquid feel'
    );
    // Haptic feedback
    assert.ok(
      quickNavCode.includes('navigator.vibrate'),
      'Must include guarded haptic feedback on crossing items'
    );
    // will-change: transform only on pill
    assert.ok(
      quickNavCode.includes('will-change-transform'),
      'Pill must have will-change-transform'
    );
  });

  test('STEP 3 - Release / Snap: Velocity projection, spring ease, width animation, and scroll lock', () => {
    // Velocity projection: projectedX = x + velocity * 0.15
    assert.ok(
      quickNavCode.includes('0.15') && quickNavCode.includes('velocity'),
      'Must project final x factoring in ~0.15s velocity'
    );
    // Spring physics with GSAP
    assert.ok(
      quickNavCode.includes('elastic.out(1, 0.7)') ||
        quickNavCode.includes('back.out(1.4)'),
      'Must use GSAP spring ease (elastic or back)'
    );
    // Width animation on snap
    assert.ok(
      quickNavCode.includes('width: nearest.width') ||
        quickNavCode.includes('width: targetMeta.width'),
      'Must animate width to target item width on snap'
    );
    // Programmatic scroll lock with scrollend and fallback timeout
    assert.ok(
      quickNavCode.includes('scrollend'),
      'Must listen for scrollend event to release programmatic scroll lock'
    );
    assert.ok(
      quickNavCode.includes('scrollTimeoutRef'),
      'Must have fallback timeout for scroll lock'
    );
  });

  test('STEP 4 & 5 - Tap and Normal Scroll Sync', () => {
    // Movement threshold for tap (< 4px)
    assert.ok(
      quickNavCode.includes('!state.hasMoved'),
      'Must discriminate between plain tap (< 4px) and drag'
    );
    assert.ok(
      quickNavCode.includes("sourceId === 'pill'") ||
        quickNavCode.includes('sourceId === activeIdRef.current'),
      'Tap on active pill itself must be no-op'
    );
    // Normal scroll sync does not fight active drag or programmatic scroll
    assert.ok(
      quickNavCode.includes('isProgrammaticScrolling.current') &&
        quickNavCode.includes('dragStateRef.current.isDragging'),
      'Must ignore scroll-spy while dragging or programmatically scrolling'
    );
    assert.ok(
      quickNavCode.includes('power3.out'),
      'Normal scroll sync must glide softer with power3.out'
    );
  });

  test('STEP 6 - Apple Glass Look: backdrop blur, borders, palette, and highlights', () => {
    // Nav bg layer
    assert.ok(
      quickNavCode.includes("backdropFilter: 'blur(18px) saturate(160%)'"),
      'Container must have backdrop-filter: blur(18px) saturate(160%)'
    );
    assert.ok(
      quickNavCode.includes("WebkitBackdropFilter: 'blur(18px) saturate(160%)'"),
      'Container must have -webkit-backdrop-filter'
    );
    assert.ok(
      quickNavCode.includes('rgba(2, 26, 84, 0.45)'),
      'Container must have rgba(2, 26, 84, 0.45) bg'
    );
    assert.ok(
      quickNavCode.includes('rgba(255, 255, 255, 0.12)'),
      'Container must have 1px border rgba(255, 255, 255, 0.12)'
    );

    // Pill glass styling
    assert.ok(
      quickNavCode.includes('rgba(255, 133, 187, 0.25)'),
      'Pill must have pink tint rgba(255, 133, 187, 0.25)'
    );
    assert.ok(
      quickNavCode.includes('rgba(255, 255, 255, 0.35)'),
      'Pill must have inset 1px highlight rgba(255, 255, 255, 0.35)'
    );
    assert.ok(
      quickNavCode.includes('blur(8px)'),
      'Pill must have blur inside'
    );

    // Label colors
    assert.ok(
      quickNavCode.includes('#F5F5F5'),
      'Active label color must be #F5F5F5'
    );
  });

  test('STEP 7 - Accessibility & Edge Cases', () => {
    // Real buttons with aria-current
    assert.ok(
      quickNavCode.includes('aria-current='),
      'Must set aria-current on active nav button'
    );
    // Keyboard navigation
    assert.ok(
      quickNavCode.includes('ArrowRight') && quickNavCode.includes('ArrowLeft'),
      'Must support Left/Right arrow keys for keyboard navigation'
    );
    // Visible focus ring
    assert.ok(
      quickNavCode.includes('focus-visible:ring'),
      'Must have visible focus ring'
    );
    // prefers-reduced-motion
    assert.ok(
      quickNavCode.includes('prefers-reduced-motion'),
      'Must respect prefers-reduced-motion'
    );
    // iOS Safari back-swipe prevention
    assert.ok(
      quickNavCode.includes('overscrollBehaviorX'),
      'Must set overscroll-behavior-x: none to prevent iOS Safari back-swipe'
    );
    // Cleanup GSAP tweens on unmount
    assert.ok(
      quickNavCode.includes('killTweensOf'),
      'Must kill GSAP tweens on unmount'
    );
  });
});
