// sycophancy-guard / lib / feedback.js
// Append-only feedback ledger. Stores user verdicts on past detections
// (true positive / false positive) so analyzer can compute per-category
// FP-rate and surface weak rules.

'use strict';

const fs = require('fs');
const path = require('path');
const config = require('./config.js');

const VALID_VERDICTS = new Set(['TP', 'FP', 'unsure']);

/**
 * Read last N non-silent entries from the detection log.
 * Useful for /sycophancy-feedback flow to show recent items.
 */
function recentDetections(n = 5) {
  const cfg = config.load();
  if (!fs.existsSync(cfg.log_path)) return [];

  const raw = fs.readFileSync(cfg.log_path, 'utf8');
  const lines = raw.split('\n').filter((l) => l.trim());
  const out = [];
  for (let i = lines.length - 1; i >= 0 && out.length < n; i--) {
    try {
      const e = JSON.parse(lines[i]);
      if (e.level && e.level !== 'silent') out.push(e);
    } catch (_) {}
  }
  return out;
}

/**
 * Append a feedback entry. Pass the original log entry (or its ts as id),
 * a verdict in {'TP','FP','unsure'}, and an optional comment.
 */
function appendFeedback({ entry_ts, triggers, prompt_excerpt, verdict, comment }) {
  if (!VALID_VERDICTS.has(verdict)) {
    throw new Error(`invalid verdict: ${verdict}. Use TP, FP, or unsure.`);
  }
  const cfg = config.load();
  const dir = path.dirname(cfg.feedback_path);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const record = {
    ts: new Date().toISOString(),
    entry_ts: entry_ts || null,
    verdict,
    triggers: triggers || [],
    prompt_excerpt: prompt_excerpt || null,
    comment: comment || null,
  };
  fs.appendFileSync(cfg.feedback_path, JSON.stringify(record) + '\n', 'utf8');
  return record;
}

/**
 * Load all feedback. Returns array of records.
 */
function loadAllFeedback() {
  const cfg = config.load();
  if (!fs.existsSync(cfg.feedback_path)) return [];
  const raw = fs.readFileSync(cfg.feedback_path, 'utf8');
  const out = [];
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    try { out.push(JSON.parse(line)); } catch (_) {}
  }
  return out;
}

/**
 * Aggregate feedback per trigger category. Returns map:
 *   { rule_id: { tp: N, fp: N, unsure: N, fp_rate: 0.xx } }
 */
function aggregateByRule() {
  const records = loadAllFeedback();
  const agg = {};
  for (const r of records) {
    for (const t of r.triggers || []) {
      if (!agg[t]) agg[t] = { TP: 0, FP: 0, unsure: 0, total: 0 };
      agg[t][r.verdict] = (agg[t][r.verdict] || 0) + 1;
      agg[t].total += 1;
    }
  }
  for (const id of Object.keys(agg)) {
    const a = agg[id];
    const judged = a.TP + a.FP;
    a.fp_rate = judged > 0 ? a.FP / judged : null;
  }
  return agg;
}

module.exports = {
  recentDetections,
  appendFeedback,
  loadAllFeedback,
  aggregateByRule,
  VALID_VERDICTS,
};
