#!/usr/bin/env node
// sycophancy-guard / uninstall.js
//
// Removes the UserPromptSubmit hook entry from settings.json (preserving
// other entries) and removes installed slash-commands. Does NOT delete the
// skill folder itself, the log file, or the local config — those are kept
// in case you reinstall.

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const SETTINGS_PATH = path.join(CLAUDE_DIR, 'settings.json');
const COMMANDS_DIR = path.join(CLAUDE_DIR, 'commands');

function log(msg) { console.log(`[uninstall] ${msg}`); }

function unregister() {
  if (!fs.existsSync(SETTINGS_PATH)) {
    log('No settings.json — nothing to unregister');
    return;
  }
  const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
  if (!settings.hooks || !Array.isArray(settings.hooks.UserPromptSubmit)) {
    log('No UserPromptSubmit hooks — nothing to unregister');
    return;
  }
  const before = settings.hooks.UserPromptSubmit.length;
  settings.hooks.UserPromptSubmit = settings.hooks.UserPromptSubmit.filter((entry) => {
    const hooks = (entry && entry.hooks) || [];
    return !hooks.some((h) => h.command && h.command.includes('sycophancy-guard'));
  });
  const after = settings.hooks.UserPromptSubmit.length;
  if (after === 0) delete settings.hooks.UserPromptSubmit;

  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2) + '\n', 'utf8');
  log(`Removed ${before - after} hook entry/entries from settings.json`);
}

function removeCommands() {
  if (!fs.existsSync(COMMANDS_DIR)) return;
  for (const f of fs.readdirSync(COMMANDS_DIR)) {
    if (f.startsWith('sycophancy-')) {
      fs.unlinkSync(path.join(COMMANDS_DIR, f));
      log(`Removed slash-command: /${f.replace(/\.md$/, '')}`);
    }
  }
}

function summary() {
  console.log('');
  console.log('═══ Uninstall complete ═══');
  console.log('');
  console.log('Preserved (you may delete manually):');
  console.log(`  ~/.claude/sycophancy-log.jsonl`);
  console.log(`  ~/.claude/sycophancy-feedback.jsonl`);
  console.log(`  ~/.claude/sycophancy-guard.local.json`);
  console.log(`  ${path.resolve(__dirname)}  (the skill folder)`);
  console.log('');
}

function main() {
  console.log('');
  console.log('═══ sycophancy-guard uninstaller ═══');
  console.log('');
  unregister();
  removeCommands();
  summary();
}

main();
