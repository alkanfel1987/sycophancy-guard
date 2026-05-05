#!/usr/bin/env node
// sycophancy-guard / hooks / detector.js
//
// UserPromptSubmit hook entry point. Reads JSON from stdin, runs trigger
// detection on the user prompt, logs to the configured log path, and
// returns hookSpecificOutput.additionalContext when risk ≥ threshold.
//
// Honors local config (~/.claude/sycophancy-guard.local.json):
//   - enabled / disabled
//   - disabled_rules
//   - thresholds
//   - verbose (writes a one-line notice to stderr the user can see)
//
// Designed to fail-open: any internal error → exit 0 with empty output,
// never block the user.

'use strict';

const fs = require('fs');
const path = require('path');

const SKILL_DIR = path.resolve(__dirname, '..');
const { detect } = require(path.join(SKILL_DIR, 'lib', 'rules.js'));
const { score, levelWith, buildContext } = require(path.join(SKILL_DIR, 'lib', 'scorer.js'));
const config = require(path.join(SKILL_DIR, 'lib', 'config.js'));

let stdin = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { stdin += chunk; });
process.stdin.on('end', () => {
  try {
    run(stdin);
  } catch (e) {
    process.stderr.write(`sycophancy-guard error: ${e.message}\n`);
    process.exit(0);
  }
});

function run(raw) {
  const cfg = config.load();

  if (!cfg.enabled) {
    process.exit(0);
    return;
  }

  if (!raw || !raw.trim()) {
    process.exit(0);
    return;
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (_) {
    process.exit(0);
    return;
  }

  const prompt = (data.prompt || '').toString();
  if (!prompt.trim() || prompt.trim().length < 12) {
    process.exit(0);
    return;
  }

  const triggered = detect(prompt, { disabled_rules: cfg.disabled_rules });
  const s = score(triggered);
  const lvl = levelWith(s, cfg.thresholds);

  logEntry(cfg.log_path, {
    ts: new Date().toISOString(),
    session_id: data.session_id || null,
    cwd: data.cwd || null,
    prompt_len: prompt.length,
    prompt_excerpt: prompt.slice(0, 200),
    score: s,
    level: lvl,
    triggers: triggered.map((t) => ({ id: t.id, sev: t.severity, n: t.match_count })),
  });

  if (lvl === 'silent') {
    process.exit(0);
    return;
  }

  if (cfg.verbose) {
    const summary = triggered.map((t) => t.id).join(', ');
    process.stderr.write(`sycophancy-guard: ${lvl} (${s}/10) — ${summary}\n`);
  }

  const ctx = buildContext(triggered, s, lvl);
  if (!ctx) {
    process.exit(0);
    return;
  }

  const output = {
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: ctx,
    },
  };
  process.stdout.write(JSON.stringify(output));
  process.exit(0);
}

function logEntry(logPath, entry) {
  try {
    const dir = path.dirname(logPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(logPath, JSON.stringify(entry) + '\n', 'utf8');
  } catch (_) {
    // logging failure must never break the hook
  }
}
