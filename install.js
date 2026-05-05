#!/usr/bin/env node
// sycophancy-guard / install.js
//
// Cross-platform installer. Performs:
//   1. Validates Node.js version (≥18)
//   2. Resolves ~/.claude/settings.json
//   3. Backs up settings.json → settings.json.bak.<timestamp>
//   4. Adds UserPromptSubmit hook entry, preserving any existing hooks
//   5. Copies slash-command markdown files into ~/.claude/commands/
//   6. Verifies installation by running detector on a test prompt
//
// Idempotent: if hook is already registered, prints status and exits.
// Reversible: run uninstall.js to remove.

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const SKILL_DIR = path.resolve(__dirname);
const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const SETTINGS_PATH = path.join(CLAUDE_DIR, 'settings.json');
const COMMANDS_DIR = path.join(CLAUDE_DIR, 'commands');
const HOOK_COMMAND = `node ${normalizeForHook(path.join(SKILL_DIR, 'hooks', 'detector.js'))}`;

function normalizeForHook(p) {
  // Use forward slashes — works on Windows bash and cmd
  return p.replace(/\\/g, '/');
}

function log(msg) { console.log(`[install] ${msg}`); }
function warn(msg) { console.warn(`[install] WARN: ${msg}`); }
function fail(msg) { console.error(`[install] FAIL: ${msg}`); process.exit(1); }

function checkNodeVersion() {
  const major = parseInt(process.versions.node.split('.')[0], 10);
  if (major < 18) fail(`Node.js ≥18 required. Found ${process.versions.node}`);
  log(`Node.js ${process.versions.node} ✓`);
}

function ensureClaudeDir() {
  if (!fs.existsSync(CLAUDE_DIR)) fail(`~/.claude directory not found at ${CLAUDE_DIR}. Is Claude Code installed?`);
  log(`Found ${CLAUDE_DIR}`);
}

function backupSettings() {
  if (!fs.existsSync(SETTINGS_PATH)) {
    log('No existing settings.json — will create');
    return null;
  }
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${SETTINGS_PATH}.bak.${ts}`;
  fs.copyFileSync(SETTINGS_PATH, backupPath);
  log(`Backed up settings.json → ${backupPath}`);
  return backupPath;
}

function loadSettings() {
  if (!fs.existsSync(SETTINGS_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
  } catch (e) {
    fail(`settings.json is not valid JSON: ${e.message}`);
  }
}

function registerHook(settings) {
  if (!settings.hooks) settings.hooks = {};
  if (!Array.isArray(settings.hooks.UserPromptSubmit)) settings.hooks.UserPromptSubmit = [];

  const already = settings.hooks.UserPromptSubmit.some((entry) => {
    const hooks = (entry && entry.hooks) || [];
    return hooks.some((h) => h.command && h.command.includes('sycophancy-guard'));
  });

  if (already) {
    log('Hook already registered — skipping');
    return false;
  }

  settings.hooks.UserPromptSubmit.push({
    hooks: [{ type: 'command', command: HOOK_COMMAND }],
  });
  log('Added UserPromptSubmit hook entry');
  return true;
}

function writeSettings(settings) {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2) + '\n', 'utf8');
  log(`Wrote ${SETTINGS_PATH}`);
}

function copyCommands() {
  if (!fs.existsSync(COMMANDS_DIR)) fs.mkdirSync(COMMANDS_DIR, { recursive: true });
  const srcDir = path.join(SKILL_DIR, 'commands');
  if (!fs.existsSync(srcDir)) {
    warn('commands/ directory missing in skill — skipping slash-commands setup');
    return;
  }
  const files = fs.readdirSync(srcDir).filter((f) => f.endsWith('.md'));
  for (const f of files) {
    fs.copyFileSync(path.join(srcDir, f), path.join(COMMANDS_DIR, f));
    log(`Installed slash-command: /${f.replace(/\.md$/, '')}`);
  }
}

function verify() {
  const testPayload = JSON.stringify({
    session_id: 'install-verify',
    cwd: process.cwd(),
    prompt: 'Я думаю, что наш подход правильный. Подтверди, я прав?',
  });
  const detectorPath = path.join(SKILL_DIR, 'hooks', 'detector.js');
  const r = spawnSync('node', [detectorPath], { input: testPayload, encoding: 'utf8' });
  if (r.status !== 0) {
    warn(`detector exit code ${r.status}: ${r.stderr}`);
    return false;
  }
  let out;
  try { out = JSON.parse(r.stdout); } catch (_) {
    warn('detector output is not valid JSON');
    return false;
  }
  if (out.hookSpecificOutput && out.hookSpecificOutput.additionalContext) {
    log('Verification: detector responds correctly to a strong-trigger prompt ✓');
    return true;
  }
  warn('detector did not return expected calibration notice');
  return false;
}

function summary() {
  console.log('');
  console.log('═══ Installation complete ═══');
  console.log('');
  console.log('Next steps:');
  console.log('  • Send any prompt — hook will analyze it silently');
  console.log('  • Run /sycophancy-stats in Claude Code to see your patterns');
  console.log('  • Run /sycophancy-feedback to mark recent detections as TP/FP');
  console.log('  • Run /sycophancy-toggle to disable temporarily');
  console.log('');
  console.log('Custom config (optional):');
  console.log(`  Edit ${path.join(CLAUDE_DIR, 'sycophancy-guard.local.json')}`);
  console.log('');
  console.log('To uninstall:');
  console.log(`  node ${path.join(SKILL_DIR, 'uninstall.js')}`);
  console.log('');
}

function main() {
  console.log('');
  console.log('═══ sycophancy-guard installer ═══');
  console.log('');
  checkNodeVersion();
  ensureClaudeDir();
  backupSettings();
  const settings = loadSettings();
  const changed = registerHook(settings);
  if (changed) writeSettings(settings);
  copyCommands();
  verify();
  summary();
}

main();
