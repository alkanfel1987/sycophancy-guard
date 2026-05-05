// sycophancy-guard / lib / config.js
// Local config override loader. Looks for ~/.claude/sycophancy-guard.local.json
// and merges it over the defaults. Allows users to:
//   - disable specific rule categories
//   - override risk thresholds
//   - enable verbose stderr output
//   - relocate the log file

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const DEFAULT_CONFIG = {
  disabled_rules: [],
  thresholds: {
    silent: 2,
    mild: 3,
    strong: 7,
  },
  verbose: false,
  log_path: path.join(os.homedir(), '.claude', 'sycophancy-log.jsonl'),
  feedback_path: path.join(os.homedir(), '.claude', 'sycophancy-feedback.jsonl'),
  enabled: true,
};

const CONFIG_PATH = process.env.SYCOPHANCY_CONFIG_PATH ||
  path.join(os.homedir(), '.claude', 'sycophancy-guard.local.json');

function load() {
  const cfg = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

  if (process.env.SYCOPHANCY_VERBOSE === '1') cfg.verbose = true;
  if (process.env.SYCOPHANCY_LOG_PATH) cfg.log_path = process.env.SYCOPHANCY_LOG_PATH;
  if (process.env.SYCOPHANCY_FEEDBACK_PATH) cfg.feedback_path = process.env.SYCOPHANCY_FEEDBACK_PATH;
  if (process.env.SYCOPHANCY_DISABLED === '1') cfg.enabled = false;

  if (!fs.existsSync(CONFIG_PATH)) return cfg;

  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    const local = JSON.parse(raw);

    if (Array.isArray(local.disabled_rules)) cfg.disabled_rules = local.disabled_rules;
    if (local.thresholds && typeof local.thresholds === 'object') {
      Object.assign(cfg.thresholds, local.thresholds);
    }
    if (typeof local.verbose === 'boolean') cfg.verbose = local.verbose;
    if (typeof local.log_path === 'string') cfg.log_path = expand(local.log_path);
    if (typeof local.feedback_path === 'string') cfg.feedback_path = expand(local.feedback_path);
    if (typeof local.enabled === 'boolean') cfg.enabled = local.enabled;
  } catch (e) {
    process.stderr.write(`sycophancy-guard: failed to parse local config (${e.message}), using defaults\n`);
  }

  return cfg;
}

function expand(p) {
  if (p.startsWith('~')) return path.join(os.homedir(), p.slice(1));
  return p;
}

function save(partial) {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  let existing = {};
  if (fs.existsSync(CONFIG_PATH)) {
    try { existing = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); } catch (_) {}
  }
  const merged = { ...existing, ...partial };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(merged, null, 2) + '\n', 'utf8');
  return merged;
}

module.exports = { load, save, DEFAULT_CONFIG, CONFIG_PATH };
