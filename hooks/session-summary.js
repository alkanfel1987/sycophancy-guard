#!/usr/bin/env node
// sycophancy-guard / hooks / session-summary.js
//
// Stop hook. When a Claude Code session ends, reads session_id from stdin,
// filters the detection log for this session's entries, and:
//   1. Writes a markdown summary to ~/.claude/sycophancy-summaries/<date>-<session-short>.md
//   2. Emits a compact one-line summary on stderr (Claude Code surfaces it in UI)
//
// Designed to fail-open: any error → exit 0 silently.

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const SKILL_DIR = path.resolve(__dirname, '..');
const config = require(path.join(SKILL_DIR, 'lib', 'config.js'));

let stdin = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { stdin += chunk; });
process.stdin.on('end', () => {
  try {
    run(stdin);
  } catch (e) {
    process.stderr.write(`sycophancy-guard summary error: ${e.message}\n`);
    process.exit(0);
  }
});

function run(raw) {
  const cfg = config.load();
  if (!cfg.enabled) { process.exit(0); return; }
  if (!fs.existsSync(cfg.log_path)) { process.exit(0); return; }

  let data = {};
  try { data = JSON.parse(raw || '{}'); } catch (_) {}
  const sessionId = data.session_id || null;
  if (!sessionId) { process.exit(0); return; }

  const entries = readEntries(cfg.log_path).filter((e) => e.session_id === sessionId);
  if (entries.length === 0) { process.exit(0); return; }

  const summary = aggregate(entries);
  const md = renderMarkdown(summary, sessionId, data.cwd);
  writeSummaryFile(sessionId, md);

  const oneLine = renderOneLine(summary);
  if (oneLine) process.stderr.write(oneLine + '\n');

  process.exit(0);
}

function readEntries(logPath) {
  const raw = fs.readFileSync(logPath, 'utf8');
  const out = [];
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    try { out.push(JSON.parse(line)); } catch (_) {}
  }
  return out;
}

function aggregate(entries) {
  const agg = {
    total: entries.length,
    by_level: { silent: 0, mild: 0, strong: 0, critical: 0 },
    by_trigger: {},
    score_sum: 0,
    score_max: 0,
    high_risk: [],
    first_ts: null,
    last_ts: null,
  };
  for (const e of entries) {
    agg.by_level[e.level] = (agg.by_level[e.level] || 0) + 1;
    agg.score_sum += e.score || 0;
    if ((e.score || 0) > agg.score_max) agg.score_max = e.score;
    if (!agg.first_ts || e.ts < agg.first_ts) agg.first_ts = e.ts;
    if (!agg.last_ts || e.ts > agg.last_ts) agg.last_ts = e.ts;
    for (const t of e.triggers || []) {
      if (!agg.by_trigger[t.id]) agg.by_trigger[t.id] = 0;
      agg.by_trigger[t.id] += 1;
    }
    if (e.level && e.level !== 'silent') {
      agg.high_risk.push({
        ts: e.ts, score: e.score, level: e.level,
        excerpt: e.prompt_excerpt,
        triggers: (e.triggers || []).map((t) => t.id),
      });
    }
  }
  agg.score_avg = agg.total > 0 ? agg.score_sum / agg.total : 0;
  agg.high_risk.sort((a, b) => b.score - a.score);
  return agg;
}

function renderMarkdown(s, sessionId, cwd) {
  const lines = [];
  const shortId = sessionId.slice(0, 8);
  lines.push(`# Sycophancy-guard session summary — ${shortId}`);
  lines.push('');
  lines.push(`- **Session ID:** \`${sessionId}\``);
  if (cwd) lines.push(`- **Project:** \`${cwd}\``);
  lines.push(`- **Window:** ${s.first_ts || '-'} → ${s.last_ts || '-'}`);
  lines.push(`- **Prompts analyzed:** ${s.total}`);
  lines.push(`- **Avg risk:** ${s.score_avg.toFixed(2)} / 10`);
  lines.push(`- **Max risk:** ${s.score_max} / 10`);
  lines.push('');
  lines.push('## Risk distribution');
  lines.push('');
  lines.push('| Level | Count | Share |');
  lines.push('|-------|-------|-------|');
  for (const lvl of ['silent', 'mild', 'strong', 'critical']) {
    const c = s.by_level[lvl] || 0;
    const pct = s.total > 0 ? ((c / s.total) * 100).toFixed(1) : '0.0';
    lines.push(`| ${lvl} | ${c} | ${pct}% |`);
  }
  lines.push('');
  if (Object.keys(s.by_trigger).length > 0) {
    lines.push('## Trigger frequency');
    lines.push('');
    lines.push('| Category | Count |');
    lines.push('|----------|-------|');
    const sorted = Object.entries(s.by_trigger).sort((a, b) => b[1] - a[1]);
    for (const [id, n] of sorted) lines.push(`| ${id} | ${n} |`);
    lines.push('');
  }
  if (s.high_risk.length > 0) {
    lines.push('## High-risk prompts');
    lines.push('');
    for (const ex of s.high_risk) {
      lines.push(`- **[${ex.score}/10 ${ex.level}]** ${ex.ts.slice(0, 16)}`);
      lines.push(`  - Triggers: \`${ex.triggers.join(', ')}\``);
      lines.push(`  - Excerpt: "${(ex.excerpt || '').slice(0, 200).replace(/\n/g, ' ')}"`);
    }
    lines.push('');
  } else {
    lines.push('_No non-silent detections in this session._');
    lines.push('');
  }
  lines.push('---');
  lines.push('');
  lines.push('**Next:**');
  lines.push('- Run `/sycophancy-feedback` to mark high-risk detections as TP/FP');
  lines.push('- Run `/sycophancy-stats` for lifetime trends');
  return lines.join('\n');
}

function renderOneLine(s) {
  const nonSilent = s.total - (s.by_level.silent || 0);
  if (nonSilent === 0) {
    return `🛡️ sycophancy-guard: session clean — ${s.total} prompts, all silent`;
  }
  const topTrigger = Object.entries(s.by_trigger).sort((a, b) => b[1] - a[1])[0];
  const top = topTrigger ? topTrigger[0] : 'unknown';
  return `🛡️ sycophancy-guard: ${nonSilent}/${s.total} non-silent (max ${s.score_max}/10), top trigger: ${top}`;
}

function writeSummaryFile(sessionId, md) {
  const dir = path.join(os.homedir(), '.claude', 'sycophancy-summaries');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const date = new Date().toISOString().slice(0, 10);
  const shortId = sessionId.slice(0, 8);
  const file = path.join(dir, `${date}-${shortId}.md`);
  fs.writeFileSync(file, md, 'utf8');
}
