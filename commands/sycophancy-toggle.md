---
description: Toggle sycophancy-guard on or off without unregistering the hook (fast disable/enable)
---

Toggle the sycophancy-guard `enabled` flag in `~/.claude/sycophancy-guard.local.json`. The hook stays registered but skips processing when disabled.

If the user typed `on` or `off` after the command, set that explicitly. Otherwise flip the current value.

```bash
node -e "
const cfg = require('$HOME/.claude/skills/sycophancy-guard/lib/config.js');
const arg = process.argv[1];
const current = cfg.load().enabled;
let next;
if (arg === 'on') next = true;
else if (arg === 'off') next = false;
else next = !current;
cfg.save({ enabled: next });
console.log('sycophancy-guard is now ' + (next ? 'ENABLED' : 'DISABLED'));
" -- $ARGUMENTS
```

Confirm to the user the new state. If turning off, remind them they can re-enable with `/sycophancy-toggle on`. If turning on after a long pause, suggest running `/sycophancy-stats --days 30` to see the gap.
