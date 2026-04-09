#!/usr/bin/env node
// Generates a changelog JSON from git history of a tree JSON file.
// Usage: node gen-changelog.js [--tree=<name>]
//   --tree=<name>  Use data/trees/<name>.json as source and write to
//                  data/changelogs/<name>.json. Defaults to the legacy
//                  data/tree.json -> data/changelog.json paths.

const { execSync } = require('child_process');
const path = require('path');

const REPO = path.resolve(__dirname, '..');
const MAX_COMMITS = 50;

// Parse --tree=<name> argument
const treeArg = process.argv.slice(2).find(a => a.startsWith('--tree='));
const treeName = treeArg ? treeArg.split('=')[1] : null;

const FILE = treeName ? `data/trees/${treeName}.json` : 'data/tree.json';
const OUT_PATH = treeName
  ? path.join(REPO, 'data', 'changelogs', `${treeName}.json`)
  : path.join(REPO, 'data', 'changelog.json');

// Tree was fully restructured in this commit — treat it as the first version.
// Only generate changelog entries for commits after this one.
const EPOCH_COMMIT = 'e5a69d7';

function run(cmd) {
  return execSync(cmd, { cwd: REPO, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }).trim();
}

// Flatten tree into { id: node } map
function flattenTree(obj, map = {}) {
  if (!obj) return map;
  if (obj.id && obj.id !== 'root') {
    const { children, ...rest } = obj;
    map[obj.id] = rest;
  }
  if (obj.children) obj.children.forEach(c => flattenTree(c, map));
  return map;
}

function getTreeAtCommit(sha) {
  try {
    const json = run(`git show ${sha}:${FILE}`);
    return JSON.parse(json);
  } catch { return null; }
}

// Get commits that touched tree.json (only after the epoch commit)
const allLogLines = run(
  `git log --format="%H|%ai|%s" -n ${MAX_COMMITS} -- ${FILE}`
).split('\n').filter(Boolean);

// Include commits up to and including the epoch commit (epoch serves as baseline parent)
// but don't generate a changelog entry for the epoch commit itself
const epochIdx = allLogLines.findIndex(l => l.split('|')[0].startsWith(EPOCH_COMMIT));
const logLines = epochIdx === -1 ? allLogLines : allLogLines.slice(0, epochIdx + 1);

const changelog = [];

for (let i = 0; i < logLines.length; i++) {
  const [sha, date, ...msgParts] = logLines[i].split('|');
  const message = msgParts.join('|');
  const shortSha = sha.slice(0, 7);

  // Skip the epoch commit itself — it's only here as a baseline for diffing
  if (sha.startsWith(EPOCH_COMMIT)) continue;

  // Current commit tree vs parent commit tree
  const current = getTreeAtCommit(sha);
  const parent = i + 1 < logLines.length
    ? getTreeAtCommit(logLines[i + 1].split('|')[0])
    : null;

  if (!current) continue;

  const curMap = flattenTree(current);
  const prevMap = parent ? flattenTree(parent) : {};

  const changes = [];

  // Find added or modified nodes
  for (const [id, node] of Object.entries(curMap)) {
    if (!prevMap[id]) {
      changes.push({ id, action: 'added' });
    } else {
      const diffs = [];
      const prev = prevMap[id];
      for (const key of new Set([...Object.keys(node), ...Object.keys(prev)])) {
        if (key === 'id') continue;
        const a = JSON.stringify(prev[key]);
        const b = JSON.stringify(node[key]);
        if (a !== b) {
          diffs.push({ field: key, from: prev[key], to: node[key] });
        }
      }
      if (diffs.length) {
        changes.push({ id, action: 'modified', diffs });
      }
    }
  }

  // Find removed nodes
  for (const id of Object.keys(prevMap)) {
    if (!curMap[id]) {
      changes.push({ id, action: 'removed' });
    }
  }

  if (changes.length === 0) continue;

  changelog.push({
    date: date.split(' ')[0],
    commit: shortSha,
    message,
    changedIds: changes.map(c => c.id),
    changes,
  });
}

const fs = require('fs');
if(treeName) fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, JSON.stringify(changelog, null, 2));
console.log(`Generated ${changelog.length} changelog entries -> ${OUT_PATH}`);
