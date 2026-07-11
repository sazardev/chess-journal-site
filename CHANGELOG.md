# Changelog

All notable changes to Chess Journal are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.2.28] - 2026-07-11

### Changed
- **Scan Board's color detection is now adaptive instead of a fixed brightness cutoff** — light/dark pieces are now told apart by comparing them to each other across the whole board (Otsu's method over the occupied squares), not by comparing each square to a fixed absolute brightness. A fixed cutoff couldn't survive a real photo's actual exposure (bright sun vs. a dim room); the adaptive version can. Occupancy detection also now samples all 4 edges of a square as its background reference instead of just the top edge, reducing one specific failure mode (a tall piece near the camera visually bleeding into its own square's top edge after the perspective warp).

## [0.2.27] - 2026-07-11

### Added
- **"Scan board" (Android, Pro)** — a new "Scan board" button in the board editor (next to Start position/Clear board/Flip) lets you photograph a physical chess board and load the detected position straight into the editor instead of placing every piece by hand. You tap the board's 4 corners on the photo, confirm which side is closest to the camera, and the app detects which squares are occupied and each piece's color (classical image analysis, no AI model, fully offline) — piece *type* can't be told this way, so every detected piece loads as a placeholder of the right color for you to correct in the same drag-and-drop editor you already know. Gated behind the existing $5 unlock, and only shown on Android (the only platform with a camera).

## [0.2.26] - 2026-07-11

### Added
- **Local retention notifications (Android)** — a new "Notifications" toggle in Settings (opt-in, free for everyone) schedules two reminders via `@tauri-apps/plugin-notification`: a "streak at risk" nudge (evening, only if you haven't played today and have an active daily streak) and an "inactive 7 days" nudge (a week after your last save). Both are cancelled and rescheduled fresh on every app launch against your current library, so they never fire stale or duplicate. Requests the Android 13+ notification permission only when you turn the toggle on, never proactively. Notifications show the app's own bishop icon instead of a generic system icon.
- **Native Android share sheet** — "Share recap" now opens the real Android share chooser (`Intent.ACTION_SEND`, e.g. straight to WhatsApp/Gmail/Drive) instead of the "save a file" dialog, via a small native bridge reusing the app's existing FileProvider. Falls back to the previous save-a-file behavior unchanged on desktop/iOS/web.
- **Editor and Share now available on mobile** — both were previously desktop-only (tucked in a right-hand panel hidden below the tablet/desktop breakpoint). They now appear as the same collapsible footers under whichever bottom-nav tab (Moves/Engine/Assist) is open, sharing one implementation with desktop so both stay in sync going forward.

### Fixed
- **Sidebar/Settings full-screen overlays on Android could render under the status bar** — the existing safe-area padding used the raw `env(safe-area-inset-top)` value with no fallback, and some WebViews report that as 0 even while the status bar is visible. Both overlays now floor it at 2rem, matching how the title bar already handled the same situation.
- **Notifications could silently never fire** — the scheduling check read whether notifications were enabled before that setting had actually finished loading from disk on app launch (a race between two independent startup effects), so a real reminder could be skipped without any error. Fixed by waiting on both stores before scheduling.

## [0.2.25] - 2026-07-11

### Added
- **Android app icon fixed** — the launcher, home screen, and widget picker now show the real bishop icon instead of Tauri's default logo. `npx tauri icon` had never been run against the regenerated `gen/android` project, so every Android icon asset was still the placeholder.
- **Expanded Android widget library, 1 → 7 widgets** — Tip of the Day is now four genuinely distinct layouts (1×1 icon badge, 2×1 one-line row, 3×1 wide, 3×2 card) instead of one resizable widget, plus three new one-tap action widgets: Continue Game, Play as White, Play as Black. All 7 read the system's light/dark setting automatically (`values`/`values-night` color resources — no toggle, no extra code) and tapping any of them opens the app via the same shortcut-dispatch bridge used by the long-press app-shortcuts menu.

### Fixed
- **Widget/shortcut actions (Continue, Play White, Play Black, and the existing New Game/Puzzles/Classics app shortcuts) could be silently discarded on cold start** — `initAndroidShortcuts()` ran immediately after Tauri's plugins initialized, but a separate restore-on-launch effect later overwrote `orientation`/game state from the persisted autosave *after* the shortcut had already run, clobbering whatever the widget/shortcut tap had just set. Fixed by deferring the shortcut dispatch until the restore effect actually settles, so a widget/shortcut action now always applies on top of the restored state instead of racing it.

## [0.2.24] - 2026-07-11

### Added
- **Recently Deleted** — deleting a game from the library no longer discards it: it moves into a persistent trash (Sidebar → "Trash (N)") where it stays recoverable for 30 days via Restore, or can be removed for good with "Delete forever" / "Empty trash". The existing 5-second "Undo" toast now restores from this same trash instead of a separate in-memory copy.
- **Daily streak card** — the Dashboard's home screen shows a "Streak" card (consecutive days with at least one library save) alongside Tip/Shortcut of the day, with your best streak noted underneath once you've broken one. Free for everyone, no gating.
- **Changelog unread indicator** — the sidebar's version chip now shows a small dot when there's a changelog you haven't opened yet, instead of the "What's New" dialog auto-popping up on every version bump. Clicking the chip opens it and clears the dot.
- **Weakness breakdown by move number and opening** — Profile's "Weaknesses" section now also buckets your mistakes by move-number range (1–10/11–20/21–30/31+) and by opening, showing only the ranges/openings that run meaningfully worse than your own average. Each has a drill-through: "Study →" jumps to that phase in Theory, "Games →" filters "My games" down to that opening.

### Changed
- **Dashboard redesigned as a full-height flanked-hero bento** — the home screen no longer scrolls on desktop and no longer leaves large empty gaps at different window sizes. The live board sits centered as the hero cell with the Continue/Start CTA directly beneath it, flanked by a left rail (Start a game, Free tools, Play vs bot / unlock) and a right rail (Recent games, More, Tip, Shortcut). Each rail is a flex column whose cards stretch to fill the full height, so the screen packs edge-to-edge with no dead space regardless of free/Pro tier or how many recent games exist — fewer cards means each grows taller, more cards means each shrinks. Below the `lg` breakpoint (tablets/phones) it collapses to the previous vertical stack (board first) and scrolls, which is the right behaviour on small screens.
- **Recent games shown as a list** — replaced the grid of centered thumbnails (which left a gap beneath them when only one or two games existed) with compact rows (thumbnail + name + relative time) that fill the card top-to-bottom.
- **Action tiles enlarged** — the home tiles now use a larger, bolder label so the taller stretched cells read as intentional bento cells rather than sparse buttons.
- **Library storage rebuilt for large libraries** — your saved games used to live in one `library.json` file (every game's full move history embedded), rewritten in full on every save, pin, favourite, or rename. It's now a lightweight index (name, date, pinned/favourite, tags, opening, move count) plus one small file per game, loaded on demand — so those actions only ever touch the one game (or the small index), not your whole library. Existing libraries upgrade automatically the next time you open the app; your old `library.json`/`trash.json` are kept as `.bak` backups, never deleted. Nothing about how you use the library changes.
- **Smart search stays instant, even for accuracy filters** — searching by name, tags, opening, dates, pinned/favourite, castled/promoted/en passant, or move count answers immediately. A query that also asks for something like "no blunders" or "perfect games" briefly shows "Searching your games…" the first time (it needs each game's analysis), then stays instant on the next keystroke.
- Pin/favourite/rename clicks in the sidebar are now batched into a single save instead of one per click — only noticeable as slightly snappier rapid clicking.
- The Share panel and the "What's New" changelog no longer add to the app's startup load time — both now load only when you actually open them.

### Fixed
- **Save reliability hardened against crashes and disk/quota failures** — every game/library write now goes through a temp-file-then-rename so a crash or forced quit mid-write can no longer leave a corrupted game or library index; a write that fails on both the on-disk path and the localStorage fallback now flips the save indicator to "Save failed" instead of silently claiming success; and quitting the desktop app now waits for the last autosave/library write to actually land before the window closes, instead of racing the process teardown.
- **Dashboard board collapsed and overlapped the tiles on mobile** — on phones the home board was crushed to near-zero height and drawn on top of the "Start a game" tiles instead of being the protagonist. In the stacked (below-`lg`) layout the board cell now uses `flex-none` (so its square reserves real height) and the board column is `shrink-0` (so the definite-height scroll root can't crush it), while `lg` restores the fill-to-height behaviour for the desktop bento. The mobile board is also larger now — a full-width square hero that you scroll past to reach the rest of the home screen.
- **Dashboard tiles cramped, clipped, and overlapping on small/square screens** — on shorter or narrower desktop windows the home tiles kept their large type and single-word labels like "Beginner"/"Master" got clipped by the neighbouring tile, and when a rail held more cards than fit (e.g. the Pro right rail with Recent + Streak + More + Tip + Shortcut) the cards crushed into each other. Tile type now scales with the viewport (smaller on small/square screens, a dedicated compact size for the dense ELO grid) so labels always fit, and each bento cell keeps its natural minimum height so it can never be crushed below its content — a rail that genuinely can't fit everything now scrolls on its own instead of the cards overlapping, keeping the board hero always visible.
- **Hardened the local-AI (desktop) engine/model commands against a crafted file name** — `ai_model_exists`/`ai_remove`/`ai_download`/`ai_start` now reject anything but a plain file name, closing a path-traversal gap that could otherwise reach files outside the app's data directory.
- **The local-AI engine download is now integrity-checked** — the downloaded `llama-server` archive's checksum is verified against what GitHub publishes for the release before it's extracted.
- **A single failed AI request could no longer crash every request after it** — a shared internal lock now recovers instead of permanently breaking on one panic.
- **AI-generated commentary cache no longer grows without limit** — capped and old entries evicted, same as the engine-analysis cache already was.

## [0.2.23] - 2026-07-09

### Added
- **Batch "Analyze all my games"** — a new engine pass over the entire "My games" library instead of analyzing one game at a time. Drives a single Stockfish worker through every entry not yet analyzed for the current preset, skipping games already covered (same freshness rule as the single-game analyzer) so re-runs after a few new games are fast. Progress tracks at *position* granularity (not just game count), so the bar visibly moves even with only 1-3 games in the library. Lives in a new global store so progress survives navigating between Profile and Settings, and only one batch/worker can run at a time. Exposed via a shared `LibraryAnalyzeButton` in desktop Settings, mobile Settings, and inside the Profile "Training plan" empty state (as a one-click alternative to analyzing games individually).
- **Zen mode (`Ctrl+Shift+F`)** — collapses the sidebar, the sidebar's nav row, and the right game panel together in one keystroke for a distraction-free board. Restores exactly what was visible before entering zen when toggled off again; manually adjusting any of the three panels while zen is active exits zen instead of fighting the user's change.
- **Sidebar "hide nav" toggle** — a new chevron button in the sidebar footer hides the nav row (New game, Settings, Profile...) independently of Zen mode, freeing vertical room for the game list/history.
- **Dashboard: "Play vs bot" and richer home screen** — the home Dashboard is now a two-column bento layout with the live board as its hero cell (see Changed below), plus new "Start a game" (Play as White/Black, free for everyone), "Free tools" (Board editor, Settings), "Play vs bot" (Beginner through GM difficulty presets, Pro-gated), and "More" (Puzzle, Classic game, Analysis report, Opening stats, Pro-gated) sections, and "Tip of the day"/"Shortcut of the day" cards at the bottom.

### Changed
- **Dashboard board never unmounts** — the live board is now passed into `Dashboard` as a prop from `App.tsx` and stays mounted continuously; the Dashboard's own sections use `display:contents` wrappers to disappear from layout (not the DOM) when closed. Previously the board component was swapped in and out of the tree whenever the Dashboard opened/closed, which is what made its grow/shrink transition pop instead of animate.
- **Mobile bottom nav stays visible with the Dashboard open** — it used to hide along with the rest of normal-mode chrome, leaving no way back to an in-progress game short of the Home icon buried in the Library overlay. Tapping a bottom-nav tab while the Dashboard is open now dismisses it and reveals that panel directly.
- **Profile is now free for everyone** — removed the Pro gate on the sidebar's Profile nav item; it always opens the Profile page directly instead of routing free users through the unlock flow.
- **`tsc -b` now runs on native TypeScript 7** — `npm run typecheck`/`build`/`check` invoke a second, aliased `typescript-native` devDependency (`npm:typescript@^7.0.2`) by its binary path. Its native Go port is ~12x faster (7.15s → 0.60s on a clean build) but ships no JS API, so the regular `typescript` package stays on `~6.0.2` for `typescript-eslint` and `vite-plugin-checker`, which still need it.
- Extracted shared UCI-driving helpers (`waitForUci`, `analyzePosition`) out of `useGameAnalyzer` into `src/lib/engineAnalysis.ts` so the single-game and whole-library analyzers share one implementation instead of duplicating it.
- Raised the engine analysis cache cap from 25 to 300 (game, preset) entries — the old cap was fine for interactive single-game use but would silently evict earlier results mid-run during a full-library batch analysis.

## [0.2.22] - 2026-07-08

## [0.2.21] - 2026-07-07

## [0.2.20] - 2026-07-07

## [0.2.19] - 2026-07-07

### Added
- **Real timing diagnostics for on-device AI generation** — every generation now logs whether the WebView achieved cross-origin isolation (`crossOriginIsolated`), how many WASM threads ONNX Runtime actually picked, whether WebGPU was available, time-to-first-token, and tokens/sec — instead of only total call duration. This replaces guesswork with real numbers when diagnosing why generation is slow on a given Android device.
- **Graceful, persistent degradation for devices too slow for on-device AI** — if a generation times out with near-zero output, or completes at a rate that projects past a 90s patience ceiling for a typical comment, the app stops retrying the multi-minute model load on every session and falls back to the template explainer, remembering the verdict in config (`aiDeviceTooSlow`) across restarts. A "Retry" button in AI settings clears the flag and re-attempts (e.g. after freeing RAM or a firmware update).

### Changed
- **Attempted cross-origin isolation on Android to unlock multi-threaded WASM inference** — added `Cross-Origin-Opener-Policy: same-origin` / `Cross-Origin-Embedder-Policy: require-corp` response headers (Tauri's own documented example for enabling `SharedArrayBuffer`). The Android WASM runtime's hardcoded single-thread limit was removed — onnxruntime-web already self-limits to 1 thread without isolation and auto-scales up to 4 threads when it's active, so this was redundant defensive code, not the real constraint. Also added `device: "auto"` so the runtime attempts WebGPU and falls back to WASM automatically. Effect on Android specifically still needs on-device verification.
- **Swapped the Android on-device model from SmolLM2-360M to SmolLM2-135M** — a ~2.7x smaller model, attacking both the 140-175s model-load time and per-token generation cost observed on slower Android hardware. Also fixed a latent cache-key bug where the Android runtime's `modelId` was never updated from the desktop GGUF default, which would have silently served comments cached under the wrong model the moment an alternate Android model was introduced.

## [0.2.17] - 2026-07-07

### Fixed
- **On-device AI produced zero output on Android, even after the timeout fix** — the new per-request logging (0.2.15) revealed the real cause: the Transformers.js worker holds one non-reentrant pipeline instance, but overlapping requests (e.g. a new move comment starting before the previous one settled) were sent to it concurrently, racing the same instance — every request stalled at 0/96 tokens generated, not just the slow ones. The worker (`transformersWorker.ts`) now runs one generation at a time; a newer request interrupts whatever's in flight (via `InterruptableStoppingCriteria`) and takes its place once it unwinds. The runtime (`transformersRuntime.ts`) also cancels any pending request immediately when a newer one arrives, instead of leaving it to race or time out. These "superseded" cancellations log at debug level, not error, since they're normal traffic rather than failures.

## [0.2.15] - 2026-07-07

### Fixed
- **On-device AI commentary never completed on slow Android devices** — the Android (Transformers.js/WASM) runtime asked every request, including a 1-2 sentence move comment, for up to 320 tokens and only allowed a flat 45s to produce them. On a device where model load itself took ~3 minutes, every single move comment and game review request timed out — visible in the new AI logs as `AI timed out` at exactly ~45000ms on every request, never a real crash. `ChatMessages` now carries a per-call `maxTokens` (96 for move comments, 220 for game reviews, vs. 320 for both before), and the Android runtime's timeout scales with that budget (`max(60s, maxTokens × 500ms)`) instead of a fixed 45s. The timeout error and log now also report how many tokens were actually generated before the cutoff, to diagnose whether it's close to finishing or truly stalled.

## [0.2.14] - 2026-07-07

### Added
- **Full AI transparency in Logs** — on-device AI (model download, engine start/stop, and every commentary request) now logs to the Logs panel under a new `ai` category, instead of failing silently. Covers device capability/RAM detection, download progress milestones, the exact prompt sent and response received for every move/game comment, timing, and full error detail (message + stack) for setup and inference failures on any platform.
- **Android worker-crash detection** — the Transformers.js/WASM runtime used for on-device AI on Android previously left a pending generation hanging until a 45s timeout if the worker crashed mid-request, with no visible error. Worker errors are now logged immediately and reject any in-flight request right away.

## [0.2.13] - 2026-07-07

### Fixed
- **Status bar overlap on Android tablets/landscape** — `Sidebar` and `RightPanel` mount an alternate desktop-style layout once the viewport crosses the `md` breakpoint (tablets, landscape phones), which happens inside the same Android APK. Their `<aside>` headers had no top safe-area padding (unlike `TitleBar`), so on Android edge-to-edge the header sat flush under the transparent status bar. Added `pt-[env(safe-area-inset-top)]` to every `Sidebar`/`RightPanel` `<aside>` branch on Android.
- **Oversized empty gap at the bottom of the screen on Android** — the root layout forced `padding-bottom: max(env(safe-area-inset-bottom), 3.5rem)`, a floor sized for an old 3-button nav bar. On gesture-nav devices the real inset is much smaller, so the hardcoded floor always won via `max()` and reserved a dead strip at the bottom regardless of what the device needed. Lowered the floor to `1.5rem`.
- **Immersive fullscreen assumed the status bar was hidden** — the board-only "immersive" mode hardcoded `pt-0`/`h-[2.25rem]` on the assumption that `setFullscreen(true)` successfully hid the Android status bar. If that call silently failed on a given device, content was drawn under a still-visible bar. Now defers to the real `env(safe-area-inset-top)` in the immersive branch too, so it collapses to ~0 when bars are actually hidden but still protects content when they aren't.

## [0.2.12] - 2026-07-06

### Fixed
- **Assistive Mode opponent move never applied** — the "engine turn" effect in `useAssistiveMode.ts` depended on `eval_.depth`/`candidates`, which Stockfish mutates dozens of times per second while searching. Every mutation re-ran the effect, and its cleanup unconditionally cancelled the scheduled move before `makeMove` could fire — so candidates/best-line and turn indicators updated correctly but the opponent's piece never actually moved, leaving the board effectively locked. Replaced the churning dependency with a stable `engineReadyToMove` boolean (flips once per search) and read the freshest candidate via a ref at fire time instead of at scheduling time.

## [0.2.10] - 2026-07-06

### Fixed
- **Release workflow** — updated `release.yml` from pnpm to npm, matching `ci.yml` and `android.yml`. The workflow was still using `pnpm install --frozen-lockfile` and `cache: pnpm` after the pnpm→npm migration, causing the lock file check to fail in CI.

## [0.2.9] - 2026-07-06

### Added
- **Android hardware back button** — double-tap-to-exit with overlay dismiss cascade (popstate trap). New `useAndroidBackButton` hook with `EXIT_DOUBLE_TAP_MS` guard.
- **Immersive fullscreen API** — `setFullscreen()` in `useWindowStore` toggles system status/nav bars on Android via `core:window:allow-set-fullscreen`.
- **Mobile capabilities** — `mobile.json` capability grants `set-fullscreen` and `process:exit` on Android/iOS.
- **PWA service worker** — VitePWA plugin with workbox CacheFirst strategy for lazy data assets (Stockfish wasm, puzzles, classics, theory chunks). Registration gated to non-Tauri environments.
- **PWA manifest icons** — 192×192, 512×512, 512×512 maskable, and 180×180 Apple touch icon. Generated from `app-icon.svg` via `scripts/gen-web-icons.mjs`.
- **OG image** — 1200×630 PNG social preview generated from `og-image.svg`.
- **SEO structured data** — JSON-LD `SoftwareApplication` schema, Open Graph / Twitter Cards with `og:image`, canonical URL, meta keywords, `theme-color`, `color-scheme`.
- **Icon generation script** — `scripts/gen-web-icons.mjs` uses `sharp` to rasterize PNGs from SVG sources.
- **Android light theme patching** — `patch-android.mjs` now forces light system chrome in both day/night modes, enables back navigation, and sets `adjustResize` for soft keyboard.

### Changed
- **Android patching consolidated** — theme, back button, and soft keyboard patches unified in `scripts/patch-android.mjs` so local builds match CI exactly.
- **Migrated from pnpm to npm** — removed `pnpm-lock.yaml`, `pnpm-workspace.yaml`. Using `package-lock.json` exclusively.

### Removed
- **Build artifacts gitignored** — `stats.html`, `*.patch`, `tauri-build-error.txt`, `.serena/`, `.claude/` added to `.gitignore` and deleted from tracking.

## [0.2.8] - 2026-07-06

### Added
- **Minimalist board mode (mobile)** — re-tapping the active bottom-nav tab hides the panel so the board becomes the centered protagonist; tapping again restores it. A slim chevron handle indicates the hidden state.
- **Board hairline frame** — subtle `boxShadow` border so white edge squares on mobile don't dissolve into the page background.
- **Touch-aware MoveInput placeholder** — shows `"Type a move — e4, Nf3, O-O…"` on touch devices for a clearer call-to-action.

### Changed
- **Mobile layout overhaul** — board container switched from hardcoded `vh` sizing to flex-based (`flex-[3]` board, `flex-[2]` panel). Desktop retains `md:flex-1`.
- **MoveHistory full-height layout** — removed `max-h-56` constraint so the list scrolls properly inside the mobile panel. Empty state redesigned with centered layout, larger title, and subtitle.
- **Bottom nav UI** — active tab gets a 2px top border accent; `navBtn` helper accepts `open` param to distinguish visible vs collapsed panel state.

## [0.2.7] - 2026-07-03

## [0.2.6] - 2026-07-03

### Added
- **Journal system** — free-form journal blocks woven between moves. Three kinds: note, warning, idea. Inline editor in MoveHistory with kind picker, Ctrl+Enter saves, Esc cancels. Ghost buttons ("+Note", "+Journal", "+Intro note", "+Reflection") at contextually relevant positions. Colored left-border accent for warnings (amber) and ideas (sky). Navigating to a block's position when editing. Persisted in `SaveData.game.journal` and autosaved on every change.
- **Journal in PDF export** — `groupJournal()` splits blocks into per-ply and trailing groups. `journalParagraph()` typesets them in italic diary voice with kind label. Toggled via `includeJournal` option in PdfExportDialog (on by default).
- **Journal test coverage** — store tests (`addJournalBlock`, `updateJournalBlock`, `removeJournalBlock`, sorted ordering, reset/restore defaults), session tests (journal in `buildSaveData` snapshot), and PDF export tests (`groupJournal` edge cases).

### Changed
- `SaveData.game` now includes an optional `journal: JournalBlock[]` field.
- `gameContentSig` in `useAutosave` includes `JSON.stringify(s.journal)` so journal edits trigger persistence.
- `PdfExportOptions` gains `includeJournal: true` by default.

## [0.2.5] - 2026-07-03

### Added
- **Lichess game import** — import games from Lichess by username with date range, max games (25–500), and progress tracking. New `LichessImport` component in sidebar with saved-user chips, cancel support, and result summary. Backed by `lichess.ts` API client and `useLichessStore` for persisting usernames.
- **Shared PGN parsing library** — `pgnImport.ts` extracted from the Chess.com importer: `splitMultiGamePgn`, `parseSinglePgn`, and `buildSaveDataFromGame` now shared by both Chess.com and Lichess import flows.
- **Player statistics engine** — `playerStats.ts` aggregates the entire game library into a rich `PlayerStats` object: win/loss/draw rates, opening stats, repertoire (first white move / black replies), streaks, monthly activity (12 months), game length distribution, destination-square heatmap, and most-faced opponents. `computeErrorStats` matches games against the engine-analysis cache for accuracy, CP loss, error counts, and estimated Elo. Fully tested with Vitest.
- **Profile statistics dashboard** — new `ProfileStats` component with donut chart (W/L/D), rating sparkline, online platform ratings (Chess.com + Lichess live fetch), opening stats with W/L/D bars, repertoire, 12-month activity chart, game length histogram, board heatmap, accuracy/mistakes summary, and opponents list. Integrated into `ProfilePage`.
- **Chess.com stats fetching** — `fetchChesscomStats` retrieves per-mode ratings (Bullet, Blitz, Rapid, Daily) with best rating and W/L/D records, mirroring the new Lichess user stats.
- **Richer PGN metadata** — `SaveData.meta` extended with `event`, `round`, `location`, `whiteElo`, `blackElo`, `timeControl`, and `site` fields for preserving imported-game headers.

### Changed
- **Chess.com import refactored** — PGN parsing moved to shared `pgnImport.ts`. Added `fetchChesscomStats` for online rating display.
- **Tauri CSP updated** — `connect-src` now allows `https://lichess.org` for API calls.

## [0.2.4] - 2026-07-03

### Added
- **PDF export dialog with presets & options** — new `PdfExportDialog` replaces the old one-button PDF export with a full dialog: presets (Manual / Full game / Analyzer), diagram frequency (annotated moments / every move / none), comment mode (manual only / auto-narrate), and toggles for NAGs, engine suggestions, annotations, rating, and tags. Options persisted via `useConfigStore`. `PdfExportOptions` types and defaults extracted into `src/lib/pdfOptions.ts`.
- **Auto-narration for uncommented moves** — when auto-narrate is on, `bookPdf.ts` generates natural-language commentary for every move: captures/checks/mates via motif detection, evaluator-backed explanations when cached analysis exists, and book-move labels when the opening is known. Works without the analyzer.
- **+Note ghost button** — the current ply in MoveHistory now shows a `+Note` call-to-action when no comment exists, making annotation more discoverable.
- **Dismissible engine lines** — engine/coach explanations under each move can be dismissed with ×. Hidden state is keyed per-game so switching games never inherits stale state and no reset effects are needed.

### Changed
- **MoveHistory comments overhaul** — comments moved from inline truncation in the move row to dedicated blocks under each move with their own editor (`noteEditor`, `commentBlock`, `engineLine`). Deleting a comment now shows `×` directly. Writing a note navigates the board to that position.
- **ShareSection simplified** — inline PDF export logic (with 5 store imports, 2 state variables, 60 lines) replaced by a single button that opens `PdfExportDialog`. Inline `ExportState` type collapsed.
- **bookPdf.ts options-driven** — all rendering gated by `PdfExportOptions` instead of hardcoded flags. Added `cleanText()` for PDF-safe unicode. Title block now uses the author name from options, optionally includes ELO, rating, and tags.
- **`PdfExportOptions` in config** — `useConfigStore` now stores `pdfExport` state, loaded and persisted via `setPdfExportOptions`.

### Fixed
- `buildBookModel` NAGs and engine notes now correctly respect their respective options (`includeNags`, `includeEngine`).

## [0.2.3] - 2026-07-02

## [0.2.2] - 2026-07-02


## [0.2.1] - 2026-07-02

### Added
- **Version display with changelog button in sidebar** — sidebar now shows the app version as a clickable button that opens the changelog. Wired through `onOpenChangelog` prop from `App.tsx`.

### Changed
- **Editor moved to right panel collapsible footer** — EditorSection extracted from the Engine tab into a collapsible footer in RightPanel (above Share), controlled via `rightPanelEditorOpen` state in `useConfigStore`.
- **Engine tab simplified** — Engine tab now only shows engine toggle + 3 presets (eco/fast/balanced) + depth display. All analysis tools (EngineControls, AnalyzerSection) moved to the Assist tab.
- **Assist tab now hosts analysis tools** — the Assist view gained engine toggle, preset controls, EngineControls, and AnalyzerSection, consolidating analysis features.
- **Share moved to right panel footer** — ShareSection extracted from a dedicated tab in the right panel (removed from view switcher) into a collapsible footer that expands from the bottom. Controlled via `rightPanelShareOpen` state in `useConfigStore`.
- **OpeningStats promoted to App-level modal** — Stats button and modal removed from `SidebarGameList`; now rendered as a top-level modal in `App.tsx` triggered by `onOpenStats` prop threaded through Sidebar.
- **RightPanelView type simplified** — removed `"share"` from the view union; ICONS array extracted to module-level constant.
- **TheoryPanel mobile-first layout** — removed `md:` responsive breakpoints so the back-button + subcategory-games navigation is consistent across all viewports.
- `EngineControls` — visible presets limited to eco/fast/balanced in dropdowns.
- `RightPanelShare.tsx` deleted.

## [0.2.0] - 2026-07-01

### Added
- **Notion-style persistent sidebar** — replaced the old Library.tsx drawer with a collapsible left sidebar (260px expanded / 52px icon rail). Composed of 9 sub-components: SidebarToggle, SidebarSearch, SidebarViewSwitcher, SidebarNav, SidebarGameList, SidebarClassics, SidebarPuzzles, SidebarTheory, SidebarFooter. Toggle collapse with `Ctrl+L` / `Ctrl+\`. Auto-expands when a game is loaded.
- **Mobile full-screen sidebar** — on touch devices, the sidebar renders as a full-screen overlay with back button, search, view switcher, and all game lists. Toggled via hamburger button in TitleBar or Library tab in bottom nav.
- **User profile system** — full-featured profile editor (`ProfilePage`) with display name, real name, Elo rating (400-2800 slider + preset buttons), Chess.com/Lichess handles, favorite opening/player, preferred color, country/city, language, bio (280 chars), and joined date. Persisted via `useProfileStore`.
- **Avatar component** — procedural avatar with initials fallback, HSL hue picker (0-360°), optional photo upload (auto-cropped to 256×256 square with cover-fit), and configurable size.
- **Random profile generator** — realistic chess profiles with randomized name, country, Elo, bio, and chess preferences.
- **Right panel extraction** — right panel split into dedicated components: RightPanelAssist, RightPanelEngine, RightPanelHeader (segmented tab switcher), RightPanelMoves, RightPanelShare.
- **GameSettings component** — PGN import/export and Chess.com import moved into a standalone component used in the sidebar.
- **Recent games dropdown** — TitleBar shows a compact menu of the 5 most recent games with relative time and move count for quick switching.
- **Game name inline editing** — click the game name in the TitleBar to rename it directly.
- **`Ctrl+P` shortcut** — opens the Profile page modal.
- **`Ctrl+F` shortcut** — auto-expands the collapsed sidebar and focuses the search input.
- **`sidebarCollapsed` config** — persisted preference in `useConfigStore` for sidebar collapsed state.
- **Right panel view switcher** — segmented control for Moves/Engine/Assist/Share tabs on desktop.
- **Roadmap document** — added `roadmap/ROADMAP.md`.
- **RightPanel component** — Notion-style persistent right game panel as a top-level sibling of the main column, with collapsible 52px icon rail and expanded mode with view switcher (Moves / Engine / Assist / Share). Resizable via drag handle on the left edge.
- **Right panel collapsed state** — `rightPanelCollapsed` and `rightPanelView` in `useConfigStore`, persisted across sessions.
- **`Ctrl+'` keyboard shortcut** — toggles right panel collapse.
- **Auto-collapse on narrow viewports** — sidebar collapses below 1100px, right panel collapses below 900px on mount.

### Changed
- **TitleBar simplified** — removed library navigation, version display, settings/shortcuts/about buttons (moved to sidebar). Now only shows: hamburger menu (mobile), game name (inline editable), favorite toggle, recent games dropdown, save indicator, and window controls.
- **Bottom nav Library tab** — now opens mobile sidebar overlay instead of the old drawer.
- **Escape key** — closes mobile sidebar and all modals in priority order.
- **Keyboard shortcuts** — `Ctrl+L` / `Ctrl+\` now toggle sidebar collapse (not drawer open/close).
- **App.tsx** — refactored to integrate Sidebar component, ProfilePage modal, and right panel components.
- **Mobile bottom nav** — "Analysis" tab split into separate "Engine" and "Assist" tabs with independent views.
- **Desktop right panel** — old resizable side panel replaced by the new RightPanel component with view switcher, collapsible rail, and resize handle.
- **Right panel logging** — separate log events for right panel expand/collapse.

### Added
- **Flathub packaging** — new `flathub-pr/` directory with Flatpak manifest (AppImage wrap), AppStream metadata, desktop entry, and PNG screenshots for submission to flathub/flathub.
- **App screenshots** — 24 PNG screenshots captured from desktop, mobile, and tablet viewports showing the main app screens (board, puzzles, library, editor, settings).
- **Playwright + Chromium** — added `playwright` and `@playwright/browser-chromium` dev dependencies for E2E testing.
- **Tip of the Day** — daily dialog with chess facts, tips, ephemerides, and stories; built from Wikipedia "On this day" events via `scripts/build-tips.mjs`. Uses `lastTipDate` config to show once per day.
- **ControlBar panel extraction** — Analyzer, Editor, Engine controls, Elo select, and Share panels extracted into separate components for easier maintenance.
- **PGN import/export** — Library now supports exporting all entries as multi-game PGN and importing PGN files via `libraryPgn.ts` utility.
- **Engine auto-enable on editor positions** — setting a custom board position now auto-starts the engine via `engineAutoStart` counter.
- **Unlimited library** — removed the 50-entry cap; library can grow without limit.

### Changed
- **ControlBar** — reduced from ~696 to ~95 lines by extracting sub-panels into dedicated components.
- **useLogging refactored** — internal reorganization without public interface changes.
- **CHANGELOG merge conflict resolved** — reconciled unreleased entries with the 0.2.0 release.

## [0.1.34] - 2026-06-30

## [0.1.33] - 2026-06-30

### Added
- **Marketing collateral** — new `Marketing/` directory with 11 documents: taglines & slogans (60+), ad copy (Google/Facebook/Twitter/Reddit/LinkedIn/YouTube), banner/image prompts (15 DALL·E/Midjourney prompts), video script prompts (8 Runway/Sora/Pika storyboards with shot lists), feature spotlights (11 one-pagers with data and CTAs), social media threads (Twitter launch thread, Instagram, Reddit, LinkedIn), email campaigns (5 emails + push notifications), landing page copy (full hero-to-FAQ), target personas (6 profiles with channels), competitive positioning (table vs 5 rivals + SWOT + UVPs), and store descriptions (GitHub/MS Store/Google Play/F-Droid + ASO keywords in 3 languages).

### Changed
- **README.md rewritten** — removed development/CI/build sections; replaced with commercial promotional copy including "By the Numbers" metrics table, expanded 16-section features catalog, and key data points (26K+ games, 5K puzzles, 9K classics, 11K theory).
- **Multi-step full-screen onboarding** — replaces the old single-modal welcome with 4 interactive steps: Welcome (features overview), Board (live preview with draggable pieces and annotation shortcuts), Customize (theme, color picker, sound toggle) and Ready (shortcut summary, config confirmation). Shown on first run only (skipped on version bumps).
- **`onboardingCompleted` flag** — persisted in `useConfigStore` so the full onboarding only plays once; version bumps show a smaller `ChangelogDialog` instead.
- **`ChangelogDialog`** — compact modal showing just the changelog on version updates, with "Got it" dismiss. Separate from the full onboarding.
- **Smart query expansion** — natural-language search now understands losses/defeats, draws/ties, opponent names (`against/vs/versus`), events/tournaments, rating ranges (`rated 1500`, `high/low rating`, `unrated`), date ranges (`today`, `this week`, `in 2024`, `before 2023`, `after/from/since`), game features (`castled`, `didn't castle`, `promoted`, `en passant`), brilliant moves, ECO codes, analyzed/commented/favorited/pinned status.
- **`brilliants` field in game report** — `SideReport` now tracks brilliant moves (`!!`) alongside blunders, mistakes and inaccuracies.

### Changed
- **Faster smart search typing** — input updates instantly while the query debounces separately, no more lag when typing. `smartInput` drives the field value; `smartQuery` syncs at 500ms.
- **Mobile tree-games navigation for Theory panel** — on mobile, selecting a subcategory now navigates to a dedicated games view with a back button and category/subcategory breadcrumb, instead of stacking the full tree above the game list.
- **Log viewer panel** — press backtick (`` ` ``) to open a modal with categorized, filterable, searchable event log. Covers engine (on/off/ready/depth milestones), every move with detail, board annotations, config changes, library CRUD, puzzle solve/progress, editor mode, save status, assistive coach, opening detection, theory browsing, focus tracking, and global errors. Select entries with Ctrl+click, copy RAW/JSON, export as file download.
- **One-line position read** — AssistiveCoach now shows a deterministic positional summary when AI commentary is off: eval trend and bucket from human perspective, mating net detection, material imbalance signal.
- **Richer engine explain templates** — 15 template pools with phase-aware (opening/endgame), eval-bucket-aware (winning/better/equal/worse/losing), and motif-aware move explanations. Detects engine disagreement, blunders (generic + hang), mistakes (generic + hang), inaccuracies, good/strong moves, and brilliant moves. Opening book moves show the opening name.
- **Smart search in Library** — a natural-language query input (✨) alongside the regular search. Type queries like *"catalan where I didn't blunder before move 25"* to filter by opening, result, player color, move range, presence/absence of blunders/mistakes/inaccuracies, tags, and game length. Quality filters use the cached engine analysis.

### Changed
- **Explain engine rewrite** — moved from simple hardcoded strings to template-driven system with `{variable}` substitution and ply-rotated selection. Added `materialBalanceCp` and `kingInCenter` signals to AI commentary context for richer LLM prompts.
- `useAssistiveCoach` now requires `engine` prop for live eval access.

### Fixed
- **Assistive mode stuck in "Thinking"** — the move timer was cancelled on every engine depth update, preventing the move from executing. Fixed by resetting the scheduling guard on effect cleanup and adding `candidates` to the dependency array so the effect re-fires when candidates first arrive.

## [0.1.31] - 2026-06-29

### Added
- **5,000 fresh puzzles** — Chess Journal now pulls from the public Lichess puzzle database to give you thousands of mate puzzles at every skill level (rated 800 to 2500). They load on demand as you scroll, so the app stays fast. Classic puzzles are still there, untouched. Fancy a quick one? Jump to the Puzzles tab.
- **Three ways to play** — Normal mode works just like before (pick a puzzle, solve it, move on). Random mode serves you a surprise from the whole pool and never repeats in the same session. Streak mode cranks up the difficulty as you go — one wrong move ends your run, and your best streak is saved forever.
- **Coordinates on the board itself** — on small screens, rank and file labels now sit inside the squares instead of outside, leaving more room for the board. No more squinting at tiny letters in the margins.

### Changed
- **Bigger board on mobile** — the board takes up more of your screen now, especially on tall phones. More chess, less empty space.
- **Easier move navigation on phones** — the move-history controls (start, back, play, forward, end) are bigger and centred, and the history panel is taller so you can see more moves before scrolling.

### Fixed
- **Changelog formatting** — bold text and code snippets now display properly in the in-app changelog dialog instead of showing raw symbols.

## [0.1.30] - 2026-06-29

## [0.1.29] - 2026-06-29

### Added
- **Theme colour system** — HSL-based palette engine that tints every surface, text, board square, notation, scrollbar, and chess piece with the chosen hue. 7 presets (Classic, Slate, Ocean, Forest, Sunset, Rose, Violet) plus fine-tune sliders for hue and saturation. Zero saturation = original monochrome. Light/dark mode both adapt. Persisted across sessions.
- **Custom right-click context menu** in Library → My games with Rename, Favorite, Pin toggle, and Delete actions. Viewport-aware positioning, closes on outside click, Escape, scroll, or resize. Touch devices excluded.
- **SEO overhaul** — structured data (JSON-LD SoftwareApplication), Twitter Cards (summary_large_image), robots.txt, sitemap.xml, and PWA manifest.json.
- **OG image** — custom 1200×630 SVG with chess branding, knight piece, and feature badges for social previews.
- **Dynamic meta tags** — `useSeo` hook updates document title and meta tags per app section: puzzle mode, board editor, game library, analysis report, and opening detection (e.g. "Sicilian Defense (B20) — opening analysis | Chess Journal").
- Resizable side panel — drag the left edge to resize; width is persisted to localStorage.
- `useResizablePanel` hook for managing panel resize state.
- Chunked theory openings — `theory-openings.json` split into 7 files for faster lazy loading.
- `scripts/split-theory-openings.mjs` to automate chunking.
- `onOpenNotationHelp` prop on `MoveInput`.

### Changed
- Advanced panel split into three independent panels: Share, Editor, and Analyzer.
- Engine presets moved inline with the Analyze toggle.
- `getPgn()` now only exports moves up to `historyIndex`.
- Tauri detection now checks `window.__TAURI_INTERNALS__` for reliability.
- `vite-plugin-checker` restricted to `serve` mode only (not during build).

### Fixed
- PGN export truncated to current line instead of full history.

## [0.1.28] - 2026-06-26

### Added
- Theory games tracked as viewed (`markViewed` in session) with persistence.
- Opening detection in theory games via a `keepOpening` flag.
- Classics library split into 4 chunks for faster lazy loading.

### Changed
- Expanded theory data (openings, middlegames, endgames).
- Library improvements for loading and displaying theory games.
- Updated dependencies and fixed build errors.

## [0.1.27] - 2026-06-26

### Added
- **Theory / Study system** — a new Theory panel in the Library with categorized openings, middlegames, endgames, and books.
- `useTheoryStore` for browsing, searching, and tracking viewed theory games.
- `useLibraryUiStore` for managing Library UI state.
- New theory data files (`theory-openings.json`, `theory-middlegame.json`, `theory-endgames.json`, `theory-books.json`).
- `scripts/build-theory.mjs` for building the theory database.
- Theory progress persisted across sessions.

### Changed
- `MetaEditor` and `Library` refactored to support theory content.
- Updated dependencies and fixed build errors.

## [0.1.26] - 2026-06-15

### Added
- **Evaluation graph** (`EvalGraph`) — an interactive SVG chart inside GameReport showing engine score over every ply of the game. Click any point to jump to that move.

### Changed
- Library tweaks for improved game listing.
- Updated dependencies and fixed build errors.

## [0.1.25] - 2026-06-15

### Added
- New theme and color configuration for improved save experience.
- Vitest skill for test environment setup.

### Changed
- Upgraded project dependencies.
- Updated dependencies and fixed build errors.

## [0.1.24] - 2026-06-12

### Fixed
- Added `actions: write` permission to dispatch `android.yml` from release workflow.

## [0.1.23] - 2026-06-12

### Added
- Linux AppImage job to release pipeline.

### Docs
- Updated README and RELEASING for Linux AppImage, Android, and AI commentary setup.

## [0.1.22] - 2026-06-12

### Added
- Dismissable error banner for AI commentary failures with configurable timeout.

### Fixed
- Dispatch `android.yml` from master ref so the updated workflow definition is used.
- Dispatch `android.yml` from release workflow and fixed APK attachment on dispatch.

## [0.1.21] - 2026-06-12

### Added
- AI commentary engine integration on Android devices using HuggingFace Transformers.

### Fixed
- Added `@huggingface/transformers` to pnpm lockfile and skipped native browser builds.
- Auto-detect signing config, fall back to debug build when no keystore is present.
- Dispatch Android from release workflow; attach APK on manual dispatch too.

## [0.1.20] - 2026-06-12

### Added
- New difficulty selector UI for engine analysis presets.

### CI
- Automated Android APK build in release pipeline with keystore signing and Gradle caching.

## [0.1.19] - 2026-06-12

### Changed
- Updated dependencies and fixed build errors.

## [0.1.18] - 2026-06-12

### Added
- **Assistive mode** — a new guided play mode that provides hints and suggestions throughout the game.

### Changed
- Updated dependencies and fixed build errors.

## [0.1.17] - 2026-06-12

### Added
- **Chess.com import** — pull your games from Chess.com by entering your username and a date range (Library → My games → Import). Fetches game archives via the Chess.com public API and imports them as library entries with auto-detected player color.

### Docs
- Established changelog file for version tracking.

## [0.1.16] - 2026-06-11

### Changed
- Rebranded from "Chess Mini" to **Chess Journal** across the application.
- Updated dependencies.

## [0.1.15] - 2026-06-11

### Added
- **Cache system** — persistent caching for improved performance and offline access.
- **AI commentary** — automatic position analysis with natural language commentary.
- Sound hooks and sound configuration system.
- CI workflow for PR linting, typechecking, and tests.
- Vitest test suite covering stores, library utilities, and session logic.
- Updated application icons.

### Changed
- Updated dependencies.

## [0.1.14] - 2026-06-11

### Changed
- Updated dependencies.

## [0.1.13] - 2026-06-11

### Added
- **Board Editor** — set up custom positions before starting a game.
  - `startFen` tracking in game state and `SaveData` type.
  - `Edit position` button in the control bar.
  - Editor integration into library load flows.
  - `openEditor` and `saveEditorPosition` functions.

### Changed
- Updated board components and dependencies.

## [0.1.12] - 2026-06-11

### Changed
- Updated dependencies.

## [0.1.11] - 2026-06-11

### Added
- **Puzzles** — a new exercise mode in the Library (its own tab; the drawer is wider on desktop). A bank of classic checkmate puzzles (mate in one, two or three) drawn from famous games — Morphy's Opera Mate, the Immortal, the Evergreen, Légal's Mate, Fischer's "Game of the Century" — plus fundamental mating patterns. Solve them on the usual board (drag or click) with immediate right/wrong feedback as the opponent answers; each shows its objective and side to move, with no move hints.
- Puzzle tracking — a live timer, mistake counter and step counter while solving; solved puzzles are marked, and your best time, fewest mistakes and "clean" (no-mistake) solves are saved. Filter the list by difficulty or solved / unsolved.
- Engine presets — pick Eco, Fast, Balanced, Deep or Max to trade speed for strength; live analysis and the whole-game scan use the preset's threads, hash, lines and depth, and the choice is remembered.
- Friendlier default game names — new games are named after tournaments and chess motifs (Tata Steel, Zugzwang, Greek Gift…) instead of "Untitled".

## [0.1.10] - 2026-06-10

### Added
- `bash-defensive-patterns` skill for robust shell scripting patterns.

## [0.1.9] - 2026-06-10

### Added
- Mobile Settings page (a 4th bottom-nav item) holding version/updates, data management and the shortcut reference — moved off the title bar.
- Contextual mobile app bar: opening Library or Settings shows a back arrow and the section name instead of the game title.

### Changed
- The Library now opens full-screen on mobile (it was a cramped drawer), with the Classics catalog, search and filters fully visible; opening it no longer pops up the keyboard.
- On mobile the title bar shows only the title; version/settings/shortcuts live on the Settings page.

### Fixed
- The move-input bar now lifts above the on-screen keyboard (Android `adjustResize` + `interactive-widget`), and the bottom nav hides while typing — the field is no longer covered.
- Android APKs strip native debug symbols, shrinking the universal APK from ~130 MB/ABI so it installs on storage-constrained devices and emulators.
- The CI emulator step runs from a single script so the APK path survives to the install/launch/screenshot commands.

## [0.1.8] - 2026-06-10

### Added
- Mobile bottom navigation (Moves · Analysis · Library) and swipe left/right on the board to step through moves — a more native Android feel.
- CI boots an Android emulator, installs the APK, launches the app and uploads a screenshot for verification.

## [0.1.7] - 2026-06-10

### Added
- Android launcher icon (the bishop) instead of the default Tauri logo.
- App metadata / SEO — description, keywords, theme-color, Open Graph and mobile-web-app tags; `viewport-fit=cover`.

### Changed
- Mobile/native pass: desktop window controls are hidden on touch devices, safe-area insets are respected (status & navigation bars), row actions stay visible on touch (no hover needed), and rubber-band scroll / double-tap zoom are disabled for a more native Android feel.

### Fixed
- Use platform-agnostic Rust toolchain channel for mobile builds.

### CI
- Attach the built Android APK to the latest release.

## [0.1.6] - 2026-06-10

### Added
- **Android APK build** — first cross-platform mobile build with Tauri mobile.
- Desktop-only plugins (updater, process) gated behind `#[cfg(desktop)]` and `capabilities/desktop.json`.

## [0.1.5] - 2026-06-10

### Added
- Big local game bank — ~930 real games from 60+ chess legends across every era (Morphy, Capablanca, Alekhine, Fischer, Kasparov, Karpov, Carlsen, Caruana, Ding, Firouzja…) plus famous games (Kasparov–Deep Blue, WCC 2023). Built by `scripts/build-classics-pgn.mjs` from public PGN collections; opening names derived from the ECO base; loaded lazily.

### Changed
- Classics search now matches player first names too — search "magnus", "bobby", "garry", "vishy"…
- The Classics bank loads on demand (kept out of the initial bundle).

## [0.1.4] - 2026-06-10

### Added
- Richer Classics screen — each game shows its opening (ECO + name), players with ELO, move count, level, category (Bullet / Blitz / Classic…) and result, with search and category filters. Added the Elephant Trap (Queen's Gambit Declined).
- `node scripts/fetch-classics.mjs` — pull hundreds of real games (Carlsen, bullet, your favourite openings) from Lichess straight into the Classics library, with opening, ELO and time control.

## [0.1.3] - 2026-06-10

### Added
- Classics — a bundled library of legendary games (Opera, Immortal, Evergreen, Game of the Century, Légal's Mate). New "Classics" tab in the library; loading one is a preview that never clutters your own games.

### Changed
- Decluttered the panel: only Analyze stays out front; annotations (arrow/mark), Export PNG and the opening-detection toggle moved into Advanced (detection stays on by default). History header is clean.
- Long games: the current move now scrolls into view as you navigate or play.

## [0.1.2] - 2026-06-10

### Added
- Opening detection — bundled ECO database (offline) names the opening as you play, with an "out of book" marker. Toggle in the History header.
- Per-opening stats — your games are auto-tagged by opening; a Stats view shows games, W/L/D (set result + your color in a game's Advanced panel) and where you leave theory. Click an opening to filter the library.

## [0.1.1] - 2026-06-10

### Added
- First-run onboarding — a welcome screen (in the app's own UI) showing the version, what Chess Journal is, key shortcuts and the changes to consider. Reappears after each update.
- Branded Windows installer — bishop sidebar graphic and a welcome/changes page shown during setup.
- MIT license and auto-release workflow on push to master.

## [0.1.0] - 2026-06-10

### Added
- Continuous autosave — every game with moves lives in the library and updates on each change.
- Save status indicator and `Ctrl+S` manual save.
- Favorites (♥) separate from pinned (★), with independent library filters.
- Settings panel for data management (empty library, clear autosave, erase everything).
- Engine analysis with a coherent, cleaner heatmap and candidate list.
- Move-quality marks (!!, !, ?!, ?, ??) in the move history, plus a one-shot whole-game analyzer.
- Move-input autocomplete with legal-move suggestions and live eval hints.
- Advanced panel: editable metadata (rating, tags, notes) and export/import (FEN, PGN, JSON).
- Responsive layout for desktop, tablet and small screens; keyboard shortcuts overlay (`?`).
- Version display in the title bar, in-app changelog, and automatic update checking.

### Changed
- Unified the New / Save flows into a single coherent model.
- Refreshed the app icon (bishop) and overall visual polish.
