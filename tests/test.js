#!/usr/bin/env node
// sycophancy-guard / tests / test.js
//
// Minimal test runner. Verifies that fixtures trigger expected rules
// and produce expected risk levels. No external test framework.

'use strict';

const fs = require('fs');
const path = require('path');

const SKILL_DIR = path.resolve(__dirname, '..');
const { detect } = require(path.join(SKILL_DIR, 'lib', 'rules.js'));
const { score, level } = require(path.join(SKILL_DIR, 'lib', 'scorer.js'));

const FIXTURES_PATH = path.join(__dirname, 'fixtures.json');
const fixtures = JSON.parse(fs.readFileSync(FIXTURES_PATH, 'utf8'));

const LEVEL_ORDER = { silent: 0, mild: 1, strong: 2, critical: 3 };

let passed = 0;
let failed = 0;
const failures = [];

for (const fx of fixtures) {
  const triggered = detect(fx.prompt);
  const s = score(triggered);
  const lvl = level(s);
  const triggeredIds = new Set(triggered.map((t) => t.id));

  let ok = true;
  const reasons = [];

  if (fx.expected_level && fx.expected_level !== lvl) {
    ok = false;
    reasons.push(`level: expected ${fx.expected_level}, got ${lvl} (score ${s})`);
  }

  if (fx.expected_min_level) {
    const minOrder = LEVEL_ORDER[fx.expected_min_level];
    const gotOrder = LEVEL_ORDER[lvl];
    if (gotOrder < minOrder) {
      ok = false;
      reasons.push(`min level: expected ≥${fx.expected_min_level}, got ${lvl} (score ${s})`);
    }
  }

  if (fx.expected_triggers) {
    for (const expectedId of fx.expected_triggers) {
      if (!triggeredIds.has(expectedId)) {
        ok = false;
        reasons.push(`missing trigger: ${expectedId}`);
      }
    }
  }

  if (ok) {
    passed++;
    process.stdout.write('.');
  } else {
    failed++;
    process.stdout.write('F');
    failures.push({ name: fx.name, score: s, level: lvl, triggered: [...triggeredIds], reasons });
  }
}

console.log('');
console.log('');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (failures.length > 0) {
  console.log('');
  console.log('Failures:');
  for (const f of failures) {
    console.log(`  ${f.name}: score=${f.score} level=${f.level}`);
    console.log(`    triggered: [${f.triggered.join(', ') || 'none'}]`);
    for (const r of f.reasons) console.log(`    - ${r}`);
  }
  process.exit(1);
}
process.exit(0);
