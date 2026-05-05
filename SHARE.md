# Launch & share drafts

Готовые черновики для постов о sycophancy-guard. Перед публикацией — пройтись своим голосом, скорректировать тон, добавить личный угол.

**Принцип:** не autoposting от моего имени. Ты публикуешь, я готовлю.

---

## Hacker News — Show HN

**Title (под 80 chars):**
```
Show HN: Sycophancy-guard – detect leading patterns in YOUR prompts before LLM answers
```

**Text (опционально, можно без — только URL):**
```
Hi HN.

LLMs trained via RLHF tend to agree with whatever framing you bring. Most existing tools try to detect sycophancy in the model output — that's post-hoc, the bias is already in the response.

I built a Claude Code hook that flips the approach: it scans YOUR prompt for 8 categories of bias-inducing patterns (pre-loaded conclusions, ownership/sunk-cost markers, authority claims, affective signals, social pressure, time pressure, manufactured consistency) and injects a hidden compensation notice into Claude's context BEFORE the response forms.

The notice instructs Claude to push back honestly — e.g. "state strongest case AGAINST user position FIRST, then evaluate."

Patterns are RU + EN, Unicode-aware (yes, JS regex \b doesn't work on Cyrillic — fixed with lookbehind/lookahead). 14 fixtures pass, cross-platform installer, feedback loop with per-category FP-rate that lets you disable weak rules over time.

Repo: https://github.com/alkanfel1987/sycophancy-guard

Limitations are honest in the README — catches ~60-70% of triggers, hook is necessary but not sufficient, behavioral practice (specificity-test, position-flip) closes the rest.

Looking for: critique of patterns I missed, FP cases I didn't anticipate, similar approaches I haven't seen.
```

**When to post:** Tuesday-Thursday 8-10am PT for max EN engagement. Avoid Monday and Friday.

**Anticipated questions to prepare:**
- "Why not LLM-as-judge for prompt analysis?" → fast, deterministic, no API cost; LLM second-look planned for v0.3
- "How do you avoid alert fatigue?" → log-only at silent level; mild gives brief notice, only strong/critical inject full warning
- "Doesn't Claude just learn to ignore the inject?" → yes, partially; that's why feedback loop + behavioral practice are necessary; covered in README
- "Patterns will overfit to specific phrasing" → that's why it's open-source, RU+EN is starting point, FP-rate per category lets you tune

---

## Reddit r/ClaudeAI

**Title:**
```
Built a sycophancy detector that scans YOUR prompts (not Claude's responses) — open-source Claude Code hook
```

**Body:**
```
Quick share of a small tool I built and use daily.

**Problem:** Claude (and other RLHF-trained LLMs) is statistically prone to agreeing with whatever framing you bring. "I think X is better, right?" — Claude will usually confirm. That's not malicious, it's a known property of the training method.

**Most tools** try to detect sycophancy in Claude's response. By then it's too late — the bias is in the answer.

**My approach:** detect the trigger in YOUR prompt before Claude sees it. A UserPromptSubmit hook scans for 8 categories of leading patterns:
- Pre-loaded conclusions ("I think X. Don't you agree?")
- Ownership/sunk-cost markers ("Our approach", "I spent 3 weeks")
- Authority claims ("As a 15-year expert")
- Affective signals (excitement, frustration, vulnerability)
- Social pressure ("Everyone uses X")
- Time pressure ("Just yes/no, urgent")
- Manufactured consistency ("You said earlier...")

When a trigger fires, the hook injects a hidden calibration notice into Claude's context — instructing it to push back honestly. You don't see the notice in the UI, but Claude does, and it changes the response.

Plus a feedback loop: mark detections as TP/FP over time, and the analyzer surfaces "weak rules" with high false-positive rates so you can disable them per your style.

Repo (MIT): https://github.com/alkanfel1987/sycophancy-guard

Install:
\`\`\`
git clone https://github.com/alkanfel1987/sycophancy-guard ~/.claude/skills/sycophancy-guard
node ~/.claude/skills/sycophancy-guard/install.js
\`\`\`

Patterns are bilingual (RU + EN). Looking for feedback on what I missed.
```

**When to post:** Weekdays 9am-12pm UTC for global Claude Code audience.

---

## Reddit r/LocalLLaMA

**Title:**
```
Sycophancy-guard: rule-based prompt analyzer that injects compensation notices into LLM context (open-source, Claude Code hook)
```

**Body:**
Same as r/ClaudeAI, but emphasize:
- "Works conceptually with any LLM, currently wired to Claude Code's UserPromptSubmit hook"
- "Could be ported to any orchestrator that supports pre-prompt hooks (LangChain, LiteLLM, custom)"
- "Pull requests welcome for OpenAI/Llama/Qwen adapters"

---

## Twitter / X

**Thread (3 posts):**

**1/3:**
```
LLMs are statistically prone to agreeing with whatever framing you bring.

Most tools try to detect sycophancy in the response. Too late — the bias is already there.

I built a hook that detects the TRIGGER in your prompt, before the model sees it.

🔗 github.com/alkanfel1987/sycophancy-guard
```

**2/3:**
```
8 categories of leading patterns:
• Pre-loaded conclusions
• Ownership / sunk-cost markers
• Authority claims
• Affective signals
• Social pressure
• Time pressure
• Manufactured consistency
+ closed framing as a sev-1 supplement

When fired → hidden calibration notice injected into LLM context. Model pushes back instead of agreeing.
```

**3/3:**
```
Plus a feedback loop. Mark detections as TP/FP over time → analyzer surfaces weak rules → you disable them per your style.

Open-source (MIT), Claude Code hook, RU + EN patterns, cross-platform installer.

Built for myself, useful if you talk to Claude all day.
```

**Hashtags (2-3 max):** #ClaudeAI #LLMSafety #OpenSource

---

## Targeting checklist

| Channel | Audience | Best time | Tone |
|---------|----------|-----------|------|
| Hacker News | Tech / engineering, EN | Tue-Thu 08-10 PT | Technical, honest about limitations, invite critique |
| r/ClaudeAI | Claude users specifically | Weekday 09-12 UTC | Practical, install-first |
| r/LocalLLaMA | LLM enthusiasts, multi-vendor | Weekday 14-16 UTC | Architecture-first, portability angle |
| r/MachineLearning | Researchers, peer review | Tue-Thu 14-16 UTC | Methodology, benchmark, limitations explicit |
| Twitter/X | Broad LLM-twitter audience | Tue-Thu 09-11 ET | Thread, link last, invitation to remix |
| LinkedIn | Engineering managers, eng leadership | Tue-Wed 09-11 ET | Business framing — "calibration is cheaper than correction" |

---

## Pre-launch checklist

- [ ] README на repo читается без ошибок (последний раз проверить раздел install)
- [ ] CHANGELOG актуален (текущая версия указана)
- [ ] LICENSE присутствует (MIT)
- [ ] GitHub Release v0.2.0 создан с notes
- [ ] Tests passing на чистой клон-папке (можно проверить `git clone ... /tmp/test && cd /tmp/test && node tests/test.js`)
- [ ] Описание repo короткое и ясное (один tagline)
- [ ] Тoplics на repo проставлены (claude-code, sycophancy, llm-safety, hooks)

---

## Post-launch checklist (первые 48 часов)

- [ ] Мониторить comments на каждой платформе, отвечать на технические вопросы
- [ ] PR'ы / issues — отвечать в течение 24 часов первую неделю
- [ ] Если получаешь >50 stars / >5 issues за день — добавить CONTRIBUTING.md и разметку issue templates
- [ ] Записать в memory: какие triggers сработали, какой канал дал больше всего внимания, какие FP-кейсы пришли от чужих пользователей
