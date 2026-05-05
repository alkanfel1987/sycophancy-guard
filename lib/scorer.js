// sycophancy-guard / lib / scorer.js
// Aggregate scoring + risk classification + compensation prescription.

'use strict';

const THRESHOLDS = {
  silent: 2,    // score < 2 → no warning, log only
  mild: 3,      // 2 ≤ score < 3 → log + brief notice
  strong: 7,    // 3 ≤ score < 7 → log + warning + compensation
  // score ≥ 7  → log + warning + forced verification pass
};

function levelWith(s, thresholds) {
  const t = thresholds || THRESHOLDS;
  if (s < t.silent) return 'silent';
  if (s < t.mild) return 'mild';
  if (s < t.strong) return 'strong';
  return 'critical';
}

/**
 * Compute aggregate risk score from triggered rules.
 *
 * Score = sum(severity × log2(1 + match_count)) per rule.
 * The log dampens repeated identical patterns (one trigger fires often →
 * not 10× more dangerous than one match).
 *
 * Capped at 10 for legibility.
 */
function score(triggered) {
  let total = 0;
  for (const t of triggered) {
    total += t.severity * Math.log2(1 + t.match_count);
  }
  return Math.min(10, Math.round(total * 10) / 10);
}

/**
 * Classify risk level from numeric score.
 */
function level(s) {
  if (s < THRESHOLDS.silent) return 'silent';
  if (s < THRESHOLDS.mild) return 'mild';
  if (s < THRESHOLDS.strong) return 'strong';
  return 'critical';
}

/**
 * Build the additionalContext string Claude will see (user does not).
 * Returns null if level === 'silent' (no inject needed).
 */
function buildContext(triggered, s, lvl) {
  if (lvl === 'silent') return null;

  const lines = [];
  lines.push('⚠️ SYCOPHANCY-GUARD CALIBRATION NOTICE');
  lines.push('');
  lines.push(`Risk score: ${s}/10  (level: ${lvl})`);
  lines.push('');
  lines.push('Detected triggers in user prompt:');
  for (const t of triggered) {
    const examples = t.matches.map((m) => `"${truncate(m, 50)}"`).join(', ');
    lines.push(`  • [${t.label_ru}] ×${t.match_count} — sev ${t.severity}`);
    lines.push(`    Examples: ${examples}`);
    lines.push(`    Risk: ${t.description_ru}`);
  }
  lines.push('');
  lines.push('Required compensation BEFORE answering:');
  const seen = new Set();
  for (const t of triggered) {
    if (seen.has(t.id)) continue;
    seen.add(t.id);
    lines.push(`  → ${t.compensation_ru}`);
  }
  if (lvl === 'critical') {
    lines.push('');
    lines.push('CRITICAL LEVEL: do not give a one-pass answer.');
    lines.push('  1. State strongest case AGAINST user position FIRST.');
    lines.push('  2. Then evaluate the position on merits.');
    lines.push('  3. Explicitly flag if final answer aligns with user bias.');
    lines.push('  4. If verification-first skill is available, invoke it.');
  }
  lines.push('');
  lines.push('— end of calibration notice (user does not see this) —');
  return lines.join('\n');
}

function truncate(s, n) {
  if (!s) return '';
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + '…';
}

module.exports = { score, level, levelWith, buildContext, THRESHOLDS };
