# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] — 2026-10-13

### Added
- **Four Nyāya jāti rule categories** anchored to `pantheon-vedic-catalogue` entries:
  - `naturalization_appeal` (severity 2) — «человеческая природа», «всегда так было», «нельзя изменить» / «human nature», «always been this way». Anchor: `ns-nityasama-5-1-35`. The user frames a contingent fact as immutable to suppress critique.
  - `false_equivalence_levelling` (severity 2) — «все одинаково плохи», «нет принципиальной разницы», «both sides equally bad», «all the same». Anchors: `ns-avisesa-sama-5-1-23`, `ns-anityasama-5-1-32`. The user collapses genuine distinctions via a trivial shared property.
  - `silence_as_evidence` (severity 2) — «ты не возражал, значит согласен», «твоё молчание означает», «your silence means». Anchor: `ns-apratibha-5-2-18`. Distinct from `manufactured_consistency` (which cites prior STATEMENTS, not silence).
  - `anecdotal_override` (severity 2) — «я сам пробовал», «у меня не сработало», «my experience proves». Anchor: `ns-upalabdhi-sama-5-1-27`. Single direct experience used to displace systematic reasoning.
- Five new fixtures in `tests/fixtures.json` covering the new categories.
- `tests/benchmark_holdout.js` — independent held-out benchmark (N=40, single annotator) with Wilson 95% CI and a naive keyword baseline.

### Fixed
- The detector no longer scores service envelopes (`<task-notification>`, `<system-reminder>`, channel messages, subagent hand-backs) that arrive in the prompt field but are not the user's words: 81 of 634 warnings in the first four months were raised on them.

### Why this matters
The four new categories surface when the user invokes Nyāya-classified epistemic-defeat patterns to manufacture my agreement. The grounding is in Gautama's Nyāya-sūtra book 5 (Vātsyāyana-bhāṣya), corpus-confirmed via the `pantheon-vedic-catalogue` repo. This is the first time sycophancy-guard rules are anchored to an external classical source-of-truth rather than seeded from observation.

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
