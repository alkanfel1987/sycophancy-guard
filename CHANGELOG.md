# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] — 2026-05-06

### Added
- **Cross-platform installer** (`install.js`) — auto-detects `~/.claude/`, backs up `settings.json`, registers the hook idempotently, copies slash-commands, runs a verification probe.
- **Uninstaller** (`uninstall.js`) — surgically removes only the sycophancy-guard hook, preserves other entries, leaves logs and local config untouched.
- **Stop hook** (`hooks/session-summary.js`) — at the end of every Claude Code session, writes a per-session markdown summary to `~/.claude/sycophancy-summaries/<date>-<session>.md` and emits a one-line stderr digest to the UI.
- **Slash-commands** in `commands/`:
  - `/sycophancy-stats` — invoke analyzer with arguments
  - `/sycophancy-feedback` — mark recent detections as TP / FP / unsure
  - `/sycophancy-toggle` — fast disable/enable without unregistering
- **Local config override** (`~/.claude/sycophancy-guard.local.json`):
  - `disabled_rules` — turn off specific categories
  - `thresholds` — custom risk-level cutoffs
  - `verbose` — emit a one-line stderr notice on every non-silent trigger
  - `enabled` — fast on/off without touching settings.json
  - `log_path`, `feedback_path` — relocate output files
- **Feedback ledger** (`lib/feedback.js`) — append-only `~/.claude/sycophancy-feedback.jsonl` with TP / FP / unsure verdicts per detection.
- **Per-category FP-rate** in analyzer output, with a "weak rules" warning when FP-rate ≥ 50% over ≥ 3 verdicts.
- **Env-var overrides**: `SYCOPHANCY_VERBOSE`, `SYCOPHANCY_LOG_PATH`, `SYCOPHANCY_FEEDBACK_PATH`, `SYCOPHANCY_CONFIG_PATH`, `SYCOPHANCY_DISABLED`.
- **package.json** with versioning, repo metadata, npm scripts (`test`, `install:hook`, `uninstall:hook`, `stats`).

### Changed
- `detector.js` now loads local config, applies `disabled_rules`, honors custom thresholds, supports verbose stderr output, and respects the `enabled` flag.
- `analyzer.js` now reads from configured log path (not hardcoded), shows feedback aggregates inline.
- `lib/scorer.js` exposes `levelWith(score, thresholds)` for runtime threshold injection.
- `lib/rules.js` `detect(prompt, { disabled_rules })` filter at the rule level.

### Fixed
- (carried from 0.1.0) Cyrillic word-boundary handling — replaced ASCII `\b` with Unicode-aware `(?<!\p{L})…(?!\p{L})` lookbehind/lookahead so Russian patterns actually match.

## [0.1.0] — 2026-05-05

### Added
- Initial release.
- 8 trigger categories (RU + EN): pre-loaded conclusions, ownership/sunk-cost, authority claims, affective signals (excitement/frustration/vulnerability), closed framing, social pressure, time pressure, manufactured consistency.
- `UserPromptSubmit` hook with calibration-notice injection.
- Append-only JSONL log at `~/.claude/sycophancy-log.jsonl`.
- Standalone analyzer with per-category frequency, score distribution, top high-risk excerpts.
- 14 RU+EN test fixtures, zero-dep test runner.
- MIT license.
