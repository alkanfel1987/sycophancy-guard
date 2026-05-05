---
description: Show sycophancy-guard stats — frequency of bias-inducing patterns in your prompts, per-category FP-rate from feedback, top high-risk excerpts
---

Run the sycophancy-guard analyzer and report the results.

Execute (substitute `$ARGUMENTS` with whatever the user typed after the command, or leave empty for full report):

```bash
node ~/.claude/skills/sycophancy-guard/stats/analyzer.js $ARGUMENTS
```

Common argument patterns:
- no args → full lifetime report
- `--days 7` → last 7 days
- `--top 10` → show top 10 high-risk excerpts
- `--json` → machine-readable JSON

After running, summarize key takeaways in 3-4 bullet points:
1. Most frequent trigger category (this is the user's biggest framing bias)
2. Avg risk score and trend if window comparison is meaningful
3. Any "weak rules" warning at the bottom (FP-rate ≥50% with ≥3 verdicts)
4. Notable high-risk prompts if any

Do not just dump the raw output. Interpret it for the user.
