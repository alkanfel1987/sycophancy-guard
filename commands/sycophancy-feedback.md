---
description: Mark recent sycophancy-guard detections as true-positive (TP) or false-positive (FP) to improve calibration over time
---

Help the user record verdicts on recent detections so the FP-rate per category becomes measurable.

Workflow:

1. Run this Node.js one-liner to fetch the last 5 non-silent detections:

```bash
node -e "console.log(JSON.stringify(require('$HOME/.claude/skills/sycophancy-guard/lib/feedback.js').recentDetections(5), null, 2))"
```

2. Show the user a numbered list of those detections with: timestamp, score/level, triggers, prompt excerpt.

3. Ask the user which one(s) they want to label, and for each: TP (the detection was real — that prompt did push toward sycophancy), FP (the detection was wrong — the trigger was a false alarm), or unsure. Optional comment.

4. For each verdict, append it via:

```bash
node -e "
const fb = require('$HOME/.claude/skills/sycophancy-guard/lib/feedback.js');
fb.appendFeedback({
  entry_ts: 'PASTE_TS',
  triggers: ['PASTE_TRIGGER_IDS'],
  prompt_excerpt: 'PASTE_EXCERPT',
  verdict: 'TP',
  comment: 'PASTE_COMMENT_OR_NULL'
});
console.log('saved');
"
```

5. Confirm to the user: "Saved N verdicts. Run /sycophancy-stats to see updated FP-rate per category."

6. If after saving any rule's FP-rate is ≥50% with ≥3 verdicts, suggest disabling it via `~/.claude/sycophancy-guard.local.json` with a `disabled_rules` array.

Keep the conversation tight — one numbered list, one round of verdict capture, save, confirm.
