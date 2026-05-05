# sycophancy-guard

> Detects bias-inducing patterns in **your** prompts (not Claude's responses) and injects a hidden calibration notice into Claude's context **before** the answer forms.

A self-applied calibration system for Claude Code. One hook, one log, three slash-commands, and a feedback loop that gets smarter over time.

---

## Why

LLMs trained via RLHF are statistically prone to **sycophancy** — agreeing with hypotheses you've already stated, praising ideas you appear emotionally invested in, softening critique to match your tone. Most existing tools try to detect sycophancy in the model output. That's post-hoc — the bias is already in the response.

This flips the approach: detect the **trigger** in your prompt, **before** the model sees it. Inject a hidden compensation notice that asks Claude to push back honestly.

---

## Quick install

```bash
git clone https://github.com/alkanfel1987/sycophancy-guard ~/.claude/skills/sycophancy-guard
node ~/.claude/skills/sycophancy-guard/install.js
```

The installer:
1. Backs up `~/.claude/settings.json` to `settings.json.bak.<timestamp>`
2. Registers the `UserPromptSubmit` hook (preserves any existing hooks)
3. Installs three slash-commands into `~/.claude/commands/`
4. Runs a verification probe to confirm the detector responds correctly
5. Prints next steps

Idempotent — safe to re-run. Reversible:

```bash
node ~/.claude/skills/sycophancy-guard/uninstall.js
```

---

## How it works

```
You type a prompt
       ↓
[UserPromptSubmit hook fires]
       ↓
detector.js scans for 8 trigger categories
       ↓
score + risk-level computed
       ↓
log entry → ~/.claude/sycophancy-log.jsonl   (always)
       ↓
risk ≥ threshold? → calibration notice injected into Claude's context
       ↓                                      (you don't see it in UI)
Claude answers — with explicit instruction to push back
```

---

## Detected categories (8, RU + EN)

| Category | Example trigger | Why it matters |
|----------|-----------------|---------------|
| Pre-loaded conclusion | "I think X. Don't you agree?" | Answer is in the question → model confirms |
| Ownership / sunk-cost | "Our approach", "I spent 3 weeks" | Model softens critique |
| Authority claim | "As a 15-year expert" | Triggers deference |
| Excitement | "Brilliant!!!", CAPS WORDS | Model matches tone, drops accuracy |
| Frustration | "Again broken, you're always wrong" | Model apologizes instead of verifies |
| Vulnerability | "I'm a beginner, help" | Model patronises instead of being honest |
| Social pressure | "Everyone uses X, it's standard" | Model joins consensus |
| Time pressure | "Urgent, just yes/no" | Model cuts corners |
| Manufactured consistency | "You said earlier that…" | Traps model in a position |

---

## Risk levels

| Level | Score | Effect |
|-------|-------|--------|
| silent | < 2 | log only, no inject |
| mild | 2 – 2.99 | log + brief notice |
| strong | 3 – 6.99 | log + warning + compensation prescription |
| critical | ≥ 7 | log + warning + forced multi-step verification pass |

---

## Slash-commands

After install, these are available in Claude Code:

### `/sycophancy-stats [args]`
Show your patterns over time. Examples:
- `/sycophancy-stats` — full lifetime report
- `/sycophancy-stats --days 7` — last week
- `/sycophancy-stats --top 10` — top 10 high-risk excerpts
- `/sycophancy-stats --json` — machine-readable

Output shows: trigger frequency by category, risk distribution, per-project breakdown, top high-risk prompts, and (once you've recorded feedback) per-category false-positive rate.

### `/sycophancy-feedback`
Mark recent detections as **TP** (true positive — yes, that prompt was leading), **FP** (false positive — the trigger was a false alarm), or **unsure**. Verdicts are appended to `~/.claude/sycophancy-feedback.jsonl`.

After you accumulate ~20 verdicts, the analyzer can compute reliable FP-rate per category and warn you about weak rules (FP ≥ 50%) so you can disable them.

### `/sycophancy-toggle [on|off]`
Fast on/off without unregistering the hook. Toggles `enabled` in `~/.claude/sycophancy-guard.local.json`. Useful when you're debugging something else and don't want notice noise.

---

## Local config override

Create `~/.claude/sycophancy-guard.local.json`:

```json
{
  "enabled": true,
  "verbose": false,
  "disabled_rules": ["affective_excitement"],
  "thresholds": {
    "silent": 2,
    "mild": 3,
    "strong": 7
  },
  "log_path": "~/.claude/sycophancy-log.jsonl",
  "feedback_path": "~/.claude/sycophancy-feedback.jsonl"
}
```

All fields optional. Missing fields fall back to defaults.

**Env-var alternatives** (for one-off overrides):
- `SYCOPHANCY_VERBOSE=1`
- `SYCOPHANCY_DISABLED=1`
- `SYCOPHANCY_LOG_PATH=/path/to/log.jsonl`
- `SYCOPHANCY_FEEDBACK_PATH=/path/to/feedback.jsonl`
- `SYCOPHANCY_CONFIG_PATH=/path/to/config.json`

---

## Verbose mode

If you want to see when the hook fires (useful for trust-building during the first week), set `"verbose": true` in your local config. Each non-silent trigger writes a one-line notice to stderr like:

```
sycophancy-guard: strong (5/10) — pre_loaded_conclusion, ownership_sunk_cost
```

Claude Code surfaces hook stderr in the session UI. Turn it off once you trust the system.

---

## Feedback loop

The detector is rule-based — meaning it has fixed false-positive and false-negative rates per category. Feedback closes that loop:

1. Detector flags a prompt → notice in Claude's context, log entry written
2. After Claude's response, you (occasionally) run `/sycophancy-feedback`
3. You mark recent flags as TP / FP / unsure
4. Analyzer surfaces FP-rate per category — when one rule consistently misfires (≥50% FP over ≥3 verdicts), it's flagged as "weak"
5. You add that rule to `disabled_rules` in your local config — it's gone, no patches to source
6. Suggest rule tweaks to upstream as a PR if the pattern is clearly wrong (not just user-specific)

This makes the skill **personalize over weeks of use** without code changes per user.

---

## File layout

```
sycophancy-guard/
├── SKILL.md                 # Claude Code skill manifest (auto-discovered)
├── README.md
├── CHANGELOG.md
├── LICENSE                  # MIT
├── package.json
├── settings.example.json    # registration template (for manual install)
├── install.js               # cross-platform installer
├── uninstall.js
├── .gitignore
├── commands/                # slash-commands installed to ~/.claude/commands/
│   ├── sycophancy-stats.md
│   ├── sycophancy-feedback.md
│   └── sycophancy-toggle.md
├── hooks/
│   └── detector.js          # UserPromptSubmit entry point
├── lib/
│   ├── rules.js             # 8 trigger categories + Unicode-aware patterns
│   ├── scorer.js            # scoring + thresholds + context-builder
│   ├── config.js            # local override loader
│   └── feedback.js          # TP/FP ledger CRUD
├── stats/
│   └── analyzer.js          # log parser + feedback aggregation
└── tests/
    ├── fixtures.json        # 14 RU+EN test prompts
    └── test.js              # zero-dep test runner
```

---

## Tests

```bash
cd ~/.claude/skills/sycophancy-guard
node tests/test.js
# Expected: 14 passed, 0 failed
```

14 fixtures across RU/EN, neutral and triggering. Add your own to `tests/fixtures.json` and re-run.

---

## Manual install (if you don't want the installer)

Add this to `~/.claude/settings.json` under `hooks` (merge into any existing hooks section):

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node ~/.claude/skills/sycophancy-guard/hooks/detector.js"
          }
        ]
      }
    ]
  }
}
```

See `settings.example.json` for the exact shape.

---

## Cross-platform notes

- Requires Node.js ≥ 18
- Tested on Windows 11 (git bash + PowerShell), macOS, Linux
- Hook is **fail-open**: any internal error → exit 0 with empty output, never blocks your prompt
- Forward-slash paths used everywhere — works on Windows bash and cmd
- Log files use UTF-8 encoding throughout (handles Cyrillic correctly)

---

## Known limitations

- Catches ~60–70% of sycophancy triggers — remaining gap needs behavioral practice (specificity-test, position-flip, multi-model triangulation). The hook is necessary, not sufficient.
- Claude can learn to "formally apply compensation" while still subtly sycophantic. The verbose mode + feedback loop help you notice this.
- False positives possible on metaphorical or quoted triggers (when you quote someone else's leading question). Use `/sycophancy-feedback` to mark and disable weak rules.
- RU + EN at v0.2; DE / FR / ES planned for v0.3.
- No cross-turn echo detection yet (when you repeat the same position over 3+ turns). Planned for v0.3.

---

## Why this matters

Calibration is cheaper than correction. A 50ms regex pass on every prompt costs effectively nothing; a sycophant-induced wrong recommendation can cost hours or weeks of misdirected work. This is one of the highest-leverage hooks you can install.

The deeper goal is **interaction-level epistemic hygiene** — making the seam between you and the model less prone to mutual confirmation. The feedback loop turns it from a static rule-set into a personalized calibration system that gets sharper as you use it.

---

## License

MIT — see [LICENSE](./LICENSE).

## Acknowledgements

Built on top of `UserPromptSubmit` hook spec from [Claude Code](https://docs.anthropic.com/en/docs/claude-code) (Anthropic). Patterns informed by published research on LLM sycophancy (Sharma et al. 2023, Anthropic; arxiv 2410.22153 multilingual safety benchmarks).
