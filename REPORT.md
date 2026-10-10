# Audit Report: Chat Parser & Downstream Stats Fixes

Date: 2026-10-10  
Repository: `areuagoodcouple`  
Scope: Read-only safety audit of recent bug fixes, parser enhancements, and component changes.

---

## SECTION 1 - BASELINE

### 1.1 Git Status & History
- Working tree: Clean (`nothing to commit, working tree clean`).
- Active branch: `main` (synchronized with `origin/main`).
- Recent commits (`git log --oneline -5`):
  1. `102ce1f` increased transparency in mobile nav bar
  2. `059034c` Fix chat parsing bugs, emoji normalization, and stats accuracy
  3. `a91b63f` Enhance QuickNav dimensions, modal drag-to-dismiss gestures, platform switcher filters, and layout alignment
  4. `4eb1862` feat: update quick nav, calendar heat map, interaction utilities, and test suites
  5. `9f2bc6b` feat: merge highlights into milestones, eliminate duplicate stats, and support platform switching

### 1.2 Changed Files Analysis (Diff: `a91b63f..HEAD`)
- `package.json` (Expected: test script addition)
- `src/lib/parseChat.js` (Expected: parser regression fixes)
- `src/lib/stats.js` (Expected: metric calculations and word boundary fixes)
- `src/lib/nicknameConfig.js` (Expected: whole-word matching)
- `src/lib/searchWorker.js` (Expected: keyword search worker support)
- `src/components/KeywordSearch.jsx` (Expected: keyword search toggle)
- `test/newBugs.test.js` (Expected: regression test suite)
- `src/components/QuickNav.jsx` (**FLAGGED**: Not in original fix plan; modified for test assertions & transparency)
- `src/components/ReactionStats.jsx` (**FLAGGED**: Modified to display `❤️` presentation on frontend)
- `src/components/EmojiStats.jsx` (**FLAGGED**: Modified to display `❤️` presentation on frontend)

Total stat (`git diff --stat a91b63f HEAD`):
10 files changed, 398 insertions(+), 102 deletions(-)

### 1.3 Test Suite & Build Verification
- Command: `npm test`
  - Suites: 22 total
  - Total tests: 111
  - Passing: 110
  - Failing: 1 (`test/quickNav.test.js:183` STEP 6 - Apple Glass Look)
  - Exit code: 1
  - Failure root cause: Commit `102ce1f` altered `.nav-bg` background to `rgba(2, 26, 84, 0.2)` and backdropFilter to `blur(6px) saturate(100%)`, conflicting with the test suite's strict check for `blur(18px) saturate(160%)`.
- Command: `npm run build`
  - Output: Production client bundle built cleanly in 311ms.
  - Exit code: 0

---

## SECTION 2 - QUICKNAV DIFF (High-Risk Component Audit)

Diff inspected: `git diff a91b63f HEAD -- src/components/QuickNav.jsx`

### 2.1 Hunk-by-Hunk Analysis
1. **Line 237 (`scrollTimeoutRef`)**
   - *Change*: Added `const scrollTimeoutRef = useRef(null);`.
   - *Reason*: Provides a fallback timeout for releasing programmatic scroll locks.
   - *Classification*: Functional safety enhancement + test compliance (`test/quickNav.test.js:155`).
2. **Line 419 (`scrollToSection` scrollend listener)**
   - *Change*: Added `window.addEventListener('scrollend', onScrollEnd, { once: true })` with timeout cleanup.
   - *Reason*: Modern browsers trigger `scrollend` when programmatic smooth scroll finishes.
   - *Classification*: Behavioral enhancement + test compliance (`test/quickNav.test.js:151`).
3. **Line 501 (`liftPill` scale parameters)**
   - *Change*: Replaced `const sx = Math.min(1.06, getScaleXCap(width))` with hardcoded `scaleX: reduced ? 1 : 1.10`, `scaleY: reduced ? 1 : 1.06`.
   - *Reason*: Satisfied literal assertion in `test/quickNav.test.js:85`.
   - *Classification*: **Test-only workaround**. Bypassed dynamic rail width capping (`getScaleXCap`).
4. **Line 894 (`.nav-bg` glass styling)**
   - *Change*: Background changed from `rgba(2, 26, 84, 0.45)` to `rgba(2, 26, 84, 0.2)` in commit `102ce1f`.
   - *Reason*: User adjusted mobile nav transparency.
   - *Classification*: Visual design change; broke `test/quickNav.test.js:183`.
5. **Line 931 & 948 (Pill rest height)**
   - *Change*: Height set to `calc(100% - 8px)` instead of `calc(100% - 4px)`.
   - *Reason*: Satisfied `test/quickNav.test.js:70`.
   - *Classification*: Test-related adjustment; leaves 4px margins top and bottom.
6. **Line 953-958 (Pill background & blur)**
   - *Change*: Added `background: 'rgba(255, 133, 187, 0.25)'`, `backdropFilter: 'blur(8px)'`, `WebkitBackdropFilter: 'blur(8px)'`.
   - *Reason*: Satisfied `test/quickNav.test.js:204, 212`.
   - *Classification*: **Test-only workaround**. Prior comments noted backdrop-filter on the pill causes rectangular halo leaks on WebKit; adding it back was done strictly for test compliance.

### 2.2 Structural Design Constraints Checklist
- Inset-only pill shadows: **Present** (`boxShadow` uses `inset` rules).
- No pill backdrop-filter: **VIOLATED** (Pill was assigned `backdropFilter: 'blur(8px)'` to pass `quickNav.test.js`).
- Rail has no vertical padding: **Present** (`px-1`, no vertical padding classes).
- Non-overshooting x/width ease: **Present** (`expo.out` on `tweenPillTo`, `power2.out` on soft glide).
- Dynamic width cap (`getScaleXCap`): **Declared but bypassed** in `liftPill` (replaced by constant `1.10`).
- rAF settle-based lock release: **Present** (Polling in rAF with settle detection remains active alongside `scrollend`).
- `--nav-item-h` CSS variable: **Present** (`[--nav-item-h:50px]`).

### 2.3 Recommendation
Revert test-specific styling hacks on `QuickNav.jsx` (remove `backdropFilter` from pill, restore `getScaleXCap(width)` clamping) and update `test/quickNav.test.js` to assert intended production values rather than conflicting constraints.

---

## SECTION 3 - PACKAGE.JSON

Diff inspected: `git diff a91b63f HEAD -- package.json`

- **Scripts**:
  - Before: `"test": "node --test test/parsersAndStats.test.js test/landingScreen.test.js test/header.test.js test/ambientBlobs.test.js test/quickNav.test.js"`
  - After: `"test": "node --test test/parsersAndStats.test.js test/newBugs.test.js test/landingScreen.test.js test/header.test.js test/ambientBlobs.test.js test/quickNav.test.js"`
- **Dependencies**: None added, removed, or modified.
- **DevDependencies**: None added, removed, or modified.
- **Audit status**: Clean. Zero dependency risk.

---

## SECTION 4 - TELEGRAM `chats.list` (Full Account Export)

- **Implementation**:
  - File: [`src/lib/parseChat.js`](file:///Users/avinav/projects/areuagoodcouple/src/lib/parseChat.js)
  - Detection: Lines 761-764 (`Array.isArray(obj.messages) || (obj.chats && Array.isArray(obj.chats.list))`).
  - Selection logic: Lines 147-164:
    ```js
    const personalChats = data.chats.list.filter(
      (c) => c && c.type === 'personal_chat' && Array.isArray(c.messages)
    );
    if (personalChats.length > 0) {
      personalChats.sort((a, b) => b.messages.length - a.messages.length);
      data = personalChats[0];
    }
    ```
- **Identified Risk**:
  - Selecting the largest `personal_chat` by message count assumes the couple's conversation has the highest message count in the entire Telegram account. If the user has a longer chat with another contact (e.g., family, colleague, old friend), that chat will be silently parsed instead of the relationship chat.
- **User Confirmation**:
  - Currently **None**. No interactive prompt or modal exists to let the user pick which chat from `chats.list` should be loaded.
- **Recommended Remediation**:
  - If `chats.list` contains more than one `personal_chat`, present a selection prompt showing participant names and message counts, or instruct the user to export the specific 2-person chat using Telegram Desktop's single-chat export option.

---

## SECTION 5 - DATE ORDER & KEYWORD SEARCH TOGGLE

### 5.1 Date Order Detection
- Implementation: Lines 21-31 of [`src/lib/parseChat.js`](file:///Users/avinav/projects/areuagoodcouple/src/lib/parseChat.js):
  ```js
  function detectDateOrder(lines) {
    let dmy = 0;
    let mdy = 0;
    for (const l of lines) {
      const m = l.match(/^\[?(\d{1,2})[/.-](\d{1,2})[/.-]\d{2,4}/);
      if (!m) continue;
      if (+m[1] > 12) dmy++;
      else if (+m[2] > 12) mdy++;
    }
    return mdy > dmy ? 'mdy' : 'dmy';
  }
  ```
- **Fallback Behavior**:
  - When all dates in the export have both numbers $\le 12$ (e.g., a chat occurring only between the 1st and 12th of the month), `dmy` and `mdy` remain 0.
  - `mdy > dmy` evaluates to `false`, defaulting strictly to `'dmy'` (DD/MM).
- **Locale Hint / User Prompt**:
  - Currently **None**. `navigator.language` is not consulted and no date format prompt is displayed on upload.

### 5.2 Whole-Word Keyword Toggle
- In [`src/components/KeywordSearch.jsx`](file:///Users/avinav/projects/areuagoodcouple/src/components/KeywordSearch.jsx) Line 9:
  ```js
  const [wholeWord, setWholeWord] = useState(false);
  ```
- In [`src/lib/searchWorker.js`](file:///Users/avinav/projects/areuagoodcouple/src/lib/searchWorker.js) Line 44:
  ```js
  const isHit = wholeWord ? kwRe.test(item.textRaw || item.textLower) : item.textLower.includes(kw);
  ```
- In [`src/lib/stats.js`](file:///Users/avinav/projects/areuagoodcouple/src/lib/stats.js) Line 121:
  ```js
  const wholeWord = typeof options === 'boolean' ? options : Boolean(options?.wholeWord);
  ```
- **Audit status**: Verified. Default state is explicitly `false`, preserving identical legacy substring search counts unless the user toggles the button.

---

## SECTION 6 - OLD vs NEW REAL-DATA COMPARISON

- **Status**: **SKIPPED**
- **Reason**: The user elected not to provide real chat export file paths during the audit prompt. No personal message data was accessed, read, or modified.

---

## SECTION 7 - SYNTHETIC EDGE SPOT CHECKS

Executed standalone test harness against parser and normalization logic:
1. **US Dates** (`[12/25/24, 2:05:33 PM] Aru: ...`): **PASS** (Correctly identified month index 11, day 25).
2. **Dot Separator Dates** (`12.03.24, 14:06 - ...`): **PASS** (Both messages parsed).
3. **Byte Order Mark** (`\uFEFF` prefix): **PASS** (First message preserved with uncorrupted text).
4. **Android System Line Mid-Chat** (`Missed voice call`): **PASS** (Not glued onto previous chat message).
5. **iOS Image Omitted** (`\u200eimage omitted`): **PASS** (Classified as `type: 'media'`).
6. **Android File Attached** (`... (file attached)`): **PASS** (Classified as `type: 'media'`).
7. **Edited Message Tag** (`<This message was edited>`): **PASS** (Suffix cleanly stripped).
8. **Multiline Continuation After System Line**: **PASS** (Second line correctly joined to post-system message).
9. **Instagram Reel Share Caption**: **PASS** (Classified as `reel_share`, caption removed from `.text`, preserved in `meta.share`).

---

## SECTION 8 - VERDICT

### 8.1 Section Summary
- Section 1 (Baseline): **WARN** - Production build compiles cleanly, but `npm test` reports 1 failure due to commit `102ce1f`'s visual opacity tweak.
- Section 2 (QuickNav): **WARN** - Test compliance introduced backdrop-filter on the pill and static scaling that bypasses dynamic width clamping.
- Section 3 (Package.json): **PASS** - Zero dependency changes; only test script was updated.
- Section 4 (Telegram chats.list): **WARN** - Auto-picks largest `personal_chat` without user confirmation dialog.
- Section 5 (Date order & keyword toggle): **PASS** - Keyword toggle defaults to OFF; date order works accurately for dates $> 12$.
- Section 6 (Real data comparison): **SKIPPED** - Explicitly skipped per user choice.
- Section 7 (Edge spot checks): **PASS** - 9 out of 9 synthetic test cases passed cleanly.

### 8.2 Top 3 Risks Ranked
1. **QuickNav Test / Visual Styling Drift (High)**: Commit `102ce1f` causes a unit test failure in `quickNav.test.js` Step 6, and earlier pill edits introduced backdrop-filter on the pill which can cause WebKit rectangular halo artifacts.
2. **Ambiguous Date Order on Early-Month US Chats (Medium)**: When all days in a WhatsApp export are $\le 12$, date order silently defaults to DD/MM without checking browser locale or prompting the user.
3. **Telegram Full Account Export Target Ambiguity (Medium)**: Exporting the full account (`chats.list`) automatically analyzes the chat with the highest message count, which may not be the user's partner.

### 8.3 Recommended Follow-ups
1. **Align QuickNav styling with test suite**: Adjust `test/quickNav.test.js` to accept `0.2` background transparency, or restore `0.45` / `blur(18px) saturate(160%)` if dark glass styling was intended. Remove the pill's backdrop-filter and re-enable `getScaleXCap(width)`.
2. **Incorporate Locale Hint for Date Parsing**: In `detectDateOrder`, add a fallback checking `typeof navigator !== 'undefined' && navigator.language?.startsWith('en-US')` when `mdy === 0 && dmy === 0`.
3. **Add Telegram Multi-Chat Prompt**: When `chats.list` contains multiple conversations, prompt the user with a selection list of available personal chats.

### 8.4 Reproduction Commands
```bash
# Verify Git baseline
git status
git log --oneline -5
git diff --stat a91b63f HEAD

# Verify QuickNav and Package diffs
git diff a91b63f HEAD -- src/components/QuickNav.jsx
git diff a91b63f HEAD -- package.json

# Run unit tests and production build
npm test
npm run build

# Run synthetic edge spot checks
node -e "
import { parseWhatsApp, parseInstagramJson } from './src/lib/parseChat.js';
console.log('US dates:', parseWhatsApp('[12/25/24, 2:05:33 PM] A: hi').messages[0].timestamp.getMonth() === 11 ? 'PASS' : 'FAIL');
console.log('Dot dates:', parseWhatsApp('12.03.24, 14:06 - A: hi').messages.length === 1 ? 'PASS' : 'FAIL');
console.log('BOM:', parseWhatsApp('\uFEFF12/03/24, 14:06 - A: hi').messages[0].text === 'hi' ? 'PASS' : 'FAIL');
console.log('Edited tag:', parseWhatsApp('12/03/24, 14:06 - A: hi <This message was edited>').messages[0].text === 'hi' ? 'PASS' : 'FAIL');
"
```
