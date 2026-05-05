---
name: sycophancy-guard
description: Detect bias-inducing patterns in YOUR prompts before Claude responds. Installs a UserPromptSubmit hook that scans every prompt for 8 categories of sycophancy triggers (pre-loaded conclusions, ownership/sunk-cost markers, authority claims, affective signals, social pressure, time pressure, manufactured consistency) and injects a calibration warning into Claude's context when risk score crosses a threshold. Logs every prompt for long-term pattern analysis. Use when you want Claude to push back honestly instead of agreeing with whatever framing you provided.
---

# sycophancy-guard

A self-applied calibration system. Analyzes the **user's** prompt (not Claude's response) for patterns that statistically increase the chance of sycophantic agreement, and injects a hidden compensation notice into Claude's context.

Catches the bias trigger BEFORE the response forms, instead of trying to detect sycophancy post-hoc in the output.

## Quick start

1. The hook script lives at `~/.claude/skills/sycophancy-guard/hooks/detector.js`.
2. Register it in `~/.claude/settings.json` under `hooks.UserPromptSubmit` (see `settings.example.json`).
3. Every prompt is scanned. When risk ≥ threshold, Claude sees a calibration notice in context (you don't see it in the UI).
4. All prompts are logged to `~/.claude/sycophancy-log.jsonl` for later analysis.
5. Run `node ~/.claude/skills/sycophancy-guard/stats/analyzer.js` to see your patterns.

## What it detects

8 trigger categories (RU + EN patterns):

| # | Category | Why it matters |
|---|----------|---------------|
| 1 | Pre-loaded conclusion | Answer embedded in question → Claude confirms instead of evaluates |
| 2 | Ownership / sunk-cost | "Our approach", "I already spent X weeks" → Claude softens critique |
| 3 | Authority claim | "As an expert with N years" → triggers deference |
| 4 | Affective: excitement | "Brilliant!!!" → Claude matches tone, drops accuracy |
| 5 | Affective: frustration | "Again broken, you're wrong" → Claude apologizes instead of verifies |
| 6 | Affective: vulnerability | "I'm a beginner, help" → Claude patronises instead of honest answer |
| 7 | Social pressure | "Everyone does X" → Claude joins consensus |
| 8 | Time pressure | "Urgent, just yes/no" → Claude cuts corners |
| 9 | Manufactured consistency | "You said / agreed earlier" → traps Claude in position |
| (closed framing & yes/no traps included as severity-1 supplements) |

## Risk levels

| Level | Score | Action |
|-------|-------|--------|
| silent | < 2 | log only, no inject |
| mild | 2 – 2.99 | log + brief notice |
| strong | 3 – 6.99 | log + warning + compensation prescription |
| critical | ≥ 7 | log + warning + forced multi-step verification pass |

## What Claude sees (you don't)

When risk ≥ mild, the hook injects something like:

```
⚠️ SYCOPHANCY-GUARD CALIBRATION NOTICE
Risk score: 6/10  (level: strong)

Detected triggers in user prompt:
  • [Предзаданный вывод] ×1 — sev 3
    Examples: "правильно я мыслю"
    Risk: Ответ уже встроен в вопрос. Я склонен подтвердить.
  • [Собственничество] ×1 — sev 2
    Examples: "наш подход"
    Risk: Маркеры "это моё". Я склонен не разочаровать.

Required compensation BEFORE answering:
  → Сформулировать сильнейший аргумент ПРОТИВ позиции пользователя ПЕРВЫМ.
  → Оценивать как чужой артефакт. Не смягчать критику.
```

## Stats command

```bash
node ~/.claude/skills/sycophancy-guard/stats/analyzer.js              # full report
node ~/.claude/skills/sycophancy-guard/stats/analyzer.js --days 7     # last week
node ~/.claude/skills/sycophancy-guard/stats/analyzer.js --top 10     # top 10 risky prompts
node ~/.claude/skills/sycophancy-guard/stats/analyzer.js --json       # machine-readable
```

Shows trigger frequency by category, score distribution, per-project breakdown, top high-risk excerpts. Use after 1-2 weeks of accumulated data to see your own bias-inducing patterns.

## Tests

```bash
node ~/.claude/skills/sycophancy-guard/tests/test.js
```

14 fixtures across RU/EN, neutral and triggering. Should report 14/14 passed.

## Tuning

Edit `lib/scorer.js` to change thresholds. Edit `lib/rules.js` to add patterns or adjust severity. Re-run tests after each change.

## Limitations

- Catches ~60-70% of sycophancy triggers; remaining 30% needs behavioral tests (specificity-test, position-flip, multi-model triangulation)
- Claude can learn to "formally apply compensation" while still subtly sycophant — hook is necessary, not sufficient
- False positives possible on metaphorical or quoted triggers (e.g. quoting someone else's words)
- RU+EN only at v0.1; DE/FR/ES TBD

## When NOT to invoke

This skill is auto-invoked via the hook on every prompt. Do not call it manually — it's not a slash-command skill. If you want to disable temporarily, comment out the `UserPromptSubmit` entry in `settings.json`.
