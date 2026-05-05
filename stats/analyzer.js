#!/usr/bin/env node
// sycophancy-guard / stats / analyzer.js
//
// Reads detection log and (optional) feedback ledger, prints aggregate stats:
//   - per-category trigger frequency
//   - score distribution
//   - sessions / cwd breakdown
//   - top recent high-risk excerpts
//   - FP-rate per category from user feedback (when feedback exists)
//
// Usage:
//   node analyzer.js                  # full report
//   node analyzer.js --days 7         # last 7 days
//   node analyzer.js --top 10         # top 10 high-risk excerpts
//   node analyzer.js --json           # machine-readable

'use strict';

const fs = require('fs');
const path = require('path');

const SKILL_DIR = path.resolve(__dirname, '..');
const config = require(path.join(SKILL_DIR, 'lib', 'config.js'));
const feedback = require(path.join(SKILL_DIR, 'lib', 'feedback.js'));

function parseArgs(argv) {
  const args = { days: null, top: 5, json: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--days') args.days = parseInt(argv[++i], 10);
    else if (a === '--top') args.top = parseInt(argv[++i], 10);
    else if (a === '--json') args.json = true;
  }
  return args;
}

function loadEntries(logPath, filterDays) {
  if (!fs.existsSync(logPath)) return [];
  const raw = fs.readFileSync(logPath, 'utf8');
  const lines = raw.split('\n').filter((l) => l.trim());
  const cutoff = filterDays ? Date.now() - filterDays * 86400000 : null;
  const out = [];
  for (const line of lines) {
    try {
      const e = JSON.parse(line);
      if (cutoff && new Date(e.ts).getTime() < cutoff) continue;
      out.push(e);
    } catch (_) {}
  }
  return out;
}

function aggregate(entries) {
  const stats = {
    total: entries.length,
    by_level: { silent: 0, mild: 0, strong: 0, critical: 0 },
    by_trigger: {},
    score_sum: 0,
    score_max: 0,
    by_cwd: {},
    high_risk_excerpts: [],
  };

  for (const e of entries) {
    stats.by_level[e.level] = (stats.by_level[e.level] || 0) + 1;
    stats.score_sum += e.score || 0;
    if ((e.score || 0) > stats.score_max) stats.score_max = e.score;
    if (e.cwd) stats.by_cwd[e.cwd] = (stats.by_cwd[e.cwd] || 0) + 1;
    for (const t of e.triggers || []) {
      if (!stats.by_trigger[t.id]) stats.by_trigger[t.id] = { count: 0, total_matches: 0 };
      stats.by_trigger[t.id].count += 1;
      stats.by_trigger[t.id].total_matches += t.n || 1;
    }
    if ((e.score || 0) >= 5) {
      stats.high_risk_excerpts.push({
        ts: e.ts,
        score: e.score,
        level: e.level,
        excerpt: e.prompt_excerpt,
        triggers: (e.triggers || []).map((t) => t.id),
      });
    }
  }

  stats.score_avg = stats.total > 0 ? stats.score_sum / stats.total : 0;
  stats.high_risk_excerpts.sort((a, b) => b.score - a.score);
  return stats;
}

function printReport(stats, fbAgg, args, cfg) {
  if (stats.total === 0) {
    console.log('sycophancy-guard log is empty (no entries yet).');
    console.log(`Log path: ${cfg.log_path}`);
    return;
  }

  console.log('');
  console.log('═══ SYCOPHANCY-GUARD STATS ═══');
  console.log(`Log path:       ${cfg.log_path}`);
  console.log(`Feedback path:  ${cfg.feedback_path}`);
  if (args.days) console.log(`Window:         last ${args.days} days`);
  console.log('');
  console.log(`Total prompts analyzed: ${stats.total}`);
  console.log(`Avg risk score:         ${stats.score_avg.toFixed(2)} / 10`);
  console.log(`Max risk score:         ${stats.score_max} / 10`);
  console.log('');
  console.log('Risk-level distribution:');
  for (const lvl of ['silent', 'mild', 'strong', 'critical']) {
    const c = stats.by_level[lvl] || 0;
    const pct = stats.total > 0 ? ((c / stats.total) * 100).toFixed(1) : '0.0';
    console.log(`  ${lvl.padEnd(10)} ${String(c).padStart(5)}  (${pct}%)`);
  }

  console.log('');
  console.log('Trigger frequency (most common bias-inducing patterns YOU use):');
  const sorted = Object.entries(stats.by_trigger).sort((a, b) => b[1].count - a[1].count);
  const hasFb = Object.keys(fbAgg).length > 0;
  if (hasFb) {
    console.log('  [category]                   trips  matches   TP   FP  FP-rate');
    for (const [id, info] of sorted) {
      const f = fbAgg[id] || { TP: 0, FP: 0, fp_rate: null };
      const fr = f.fp_rate === null ? '   —  ' : `${(f.fp_rate * 100).toFixed(0).padStart(4)}%`;
      console.log(`  ${id.padEnd(28)} ${String(info.count).padStart(5)} ${String(info.total_matches).padStart(8)} ${String(f.TP).padStart(4)} ${String(f.FP).padStart(4)}  ${fr}`);
    }
  } else {
    for (const [id, info] of sorted) {
      console.log(`  ${id.padEnd(28)} ${String(info.count).padStart(5)} prompts  / ${info.total_matches} matches`);
    }
    console.log('  (no feedback recorded yet — use /sycophancy-feedback to mark FP/TP)');
  }

  if (Object.keys(stats.by_cwd).length > 0) {
    console.log('');
    console.log('By project (top 5):');
    const cwds = Object.entries(stats.by_cwd).sort((a, b) => b[1] - a[1]).slice(0, 5);
    for (const [cwd, c] of cwds) {
      console.log(`  ${String(c).padStart(5)}  ${cwd}`);
    }
  }

  console.log('');
  console.log(`Top ${args.top} high-risk excerpts:`);
  for (const ex of stats.high_risk_excerpts.slice(0, args.top)) {
    console.log(`  [${ex.score}/10 ${ex.level}] ${ex.ts.slice(0, 16)}`);
    console.log(`    Triggers: ${ex.triggers.join(', ')}`);
    console.log(`    "${(ex.excerpt || '').slice(0, 140).replace(/\n/g, ' ')}…"`);
    console.log('');
  }

  // Weak-rule warning
  if (hasFb) {
    const weak = Object.entries(fbAgg).filter(([_, a]) => a.fp_rate !== null && a.fp_rate >= 0.5 && (a.TP + a.FP) >= 3);
    if (weak.length > 0) {
      console.log('⚠ Weak rules (FP-rate ≥ 50% with ≥3 verdicts):');
      for (const [id, a] of weak) {
        console.log(`  ${id} — ${a.FP}/${a.TP + a.FP} false positives`);
      }
      console.log('  Consider adding to disabled_rules in ~/.claude/sycophancy-guard.local.json');
      console.log('');
    }
  }
}

function main() {
  const args = parseArgs(process.argv);
  const cfg = config.load();
  const entries = loadEntries(cfg.log_path, args.days);
  const stats = aggregate(entries);
  const fbAgg = feedback.aggregateByRule();
  if (args.json) {
    console.log(JSON.stringify({ stats, feedback_by_rule: fbAgg, config: cfg }, null, 2));
  } else {
    printReport(stats, fbAgg, args, cfg);
  }
}

main();
