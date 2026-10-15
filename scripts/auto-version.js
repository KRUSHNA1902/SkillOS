#!/usr/bin/env node

/**
 * SkillOS Automatic Versioning Script
 * 
 * Auto-increments or sets semantic versions (e.g. 19.2.3 -> 19.2.4)
 * and keeps root package.json, workspace packages, package-lock.json,
 * and client version files (version.json, version.ts) in sync.
 *
 * Usage:
 *   node scripts/auto-version.js              # Defaults to patch increment (19.2.3 -> 19.2.4)
 *   node scripts/auto-version.js patch        # Bumps patch
 *   node scripts/auto-version.js minor        # Bumps minor (19.2.3 -> 19.3.0)
 *   node scripts/auto-version.js major        # Bumps major (19.2.3 -> 20.0.0)
 *   node scripts/auto-version.js set 19.2.3   # Explicitly sets version to 19.2.3
 *   node scripts/auto-version.js current     # Prints current version
 *   node scripts/auto-version.js --stage      # Also stages updated files in git
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const SEMVER_REGEX = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+([0-9A-Za-z.-]+))?$/;

const TARGET_FILES = {
  rootPackage: path.join(ROOT_DIR, 'package.json'),
  clientPackage: path.join(ROOT_DIR, 'code', 'client', 'package.json'),
  serverPackage: path.join(ROOT_DIR, 'code', 'server', 'package.json'),
  packageLock: path.join(ROOT_DIR, 'package-lock.json'),
  clientVersionTs: path.join(ROOT_DIR, 'code', 'client', 'src', 'version.ts'),
  clientVersionJson: path.join(ROOT_DIR, 'code', 'client', 'src', 'version.json'),
};

function readJsonFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

function writeJsonFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function getCurrentVersion() {
  const rootPkg = readJsonFile(TARGET_FILES.rootPackage);
  if (rootPkg && rootPkg.version) {
    return rootPkg.version;
  }
  return '1.0.0';
}

function parseSemVer(versionStr) {
  const match = String(versionStr).trim().match(SEMVER_REGEX);
  if (!match) {
    throw new Error(`Invalid SemVer format: "${versionStr}". Expected format like "19.2.3".`);
  }
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4] || '',
    build: match[5] || '',
  };
}

function bumpVersion(currentVersion, type) {
  const { major, minor, patch } = parseSemVer(currentVersion);

  switch (type.toLowerCase()) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

function getLatestGitCommitHash() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: ROOT_DIR, stdio: ['pipe', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'local';
  }
}

function updateAllFiles(newVersion, shouldStage = false) {
  const changedFiles = [];
  const buildDate = new Date().toISOString();
  const commitHash = getLatestGitCommitHash();

  // 1. Root package.json
  if (fs.existsSync(TARGET_FILES.rootPackage)) {
    const pkg = readJsonFile(TARGET_FILES.rootPackage);
    pkg.version = newVersion;
    writeJsonFile(TARGET_FILES.rootPackage, pkg);
    changedFiles.push(TARGET_FILES.rootPackage);
  }

  // 2. Client package.json
  if (fs.existsSync(TARGET_FILES.clientPackage)) {
    const pkg = readJsonFile(TARGET_FILES.clientPackage);
    pkg.version = newVersion;
    writeJsonFile(TARGET_FILES.clientPackage, pkg);
    changedFiles.push(TARGET_FILES.clientPackage);
  }

  // 3. Server package.json
  if (fs.existsSync(TARGET_FILES.serverPackage)) {
    const pkg = readJsonFile(TARGET_FILES.serverPackage);
    pkg.version = newVersion;
    writeJsonFile(TARGET_FILES.serverPackage, pkg);
    changedFiles.push(TARGET_FILES.serverPackage);
  }

  // 4. package-lock.json
  if (fs.existsSync(TARGET_FILES.packageLock)) {
    try {
      const lock = readJsonFile(TARGET_FILES.packageLock);
      lock.version = newVersion;
      if (lock.packages) {
        if (lock.packages['']) {
          lock.packages[''].version = newVersion;
        }
        if (lock.packages['code/client']) {
          lock.packages['code/client'].version = newVersion;
        }
        if (lock.packages['code/server']) {
          lock.packages['code/server'].version = newVersion;
        }
      }
      writeJsonFile(TARGET_FILES.packageLock, lock);
      changedFiles.push(TARGET_FILES.packageLock);
    } catch (e) {
      console.warn(`[Auto-Version] Warning: Failed to update package-lock.json: ${e.message}`);
    }
  }

  // 5. Client code/client/src/version.json
  try {
    const versionJsonDir = path.dirname(TARGET_FILES.clientVersionJson);
    if (!fs.existsSync(versionJsonDir)) {
      fs.mkdirSync(versionJsonDir, { recursive: true });
    }
    const versionData = {
      version: newVersion,
      updatedAt: buildDate,
      commit: commitHash,
    };
    writeJsonFile(TARGET_FILES.clientVersionJson, versionData);
    changedFiles.push(TARGET_FILES.clientVersionJson);
  } catch (e) {
    console.warn(`[Auto-Version] Warning: Failed to create client version.json: ${e.message}`);
  }

  // 6. Client code/client/src/version.ts
  try {
    const versionTsDir = path.dirname(TARGET_FILES.clientVersionTs);
    if (!fs.existsSync(versionTsDir)) {
      fs.mkdirSync(versionTsDir, { recursive: true });
    }
    const versionTsContent = `/**
 * Automatically generated by scripts/auto-version.js
 * Do not edit directly.
 */
export const APP_VERSION = '${newVersion}';
export const APP_BUILD_DATE = '${buildDate}';
export const APP_COMMIT = '${commitHash}';

export default {
  version: APP_VERSION,
  buildDate: APP_BUILD_DATE,
  commit: APP_COMMIT,
};
`;
    fs.writeFileSync(TARGET_FILES.clientVersionTs, versionTsContent, 'utf8');
    changedFiles.push(TARGET_FILES.clientVersionTs);
  } catch (e) {
    console.warn(`[Auto-Version] Warning: Failed to create client version.ts: ${e.message}`);
  }

  // 7. Stage updated files if requested (e.g. called from git pre-commit hook)
  if (shouldStage && changedFiles.length > 0) {
    try {
      const relativeFiles = changedFiles.map((f) => `"${path.relative(ROOT_DIR, f)}"`).join(' ');
      execSync(`git add ${relativeFiles}`, { cwd: ROOT_DIR, stdio: ['pipe', 'pipe', 'ignore'] });
    } catch (e) {
      console.warn(`[Auto-Version] Warning: Could not automatically stage files with git: ${e.message}`);
    }
  }

  return changedFiles;
}

function main() {
  const args = process.argv.slice(2);
  const shouldStage = args.includes('--stage');
  const isDryRun = args.includes('--dry-run');
  const cleanArgs = args.filter((arg) => !arg.startsWith('--'));

  const command = cleanArgs[0] || 'patch';
  const currentVersion = getCurrentVersion();

  if (command === 'current' || command === 'get') {
    console.log(currentVersion);
    return;
  }

  let newVersion;

  if (command === 'set') {
    const explicitVersion = cleanArgs[1];
    if (!explicitVersion) {
      console.error('Error: "set" command requires a version string. Example: node scripts/auto-version.js set 19.2.3');
      process.exit(1);
    }
    parseSemVer(explicitVersion); // Validates format
    newVersion = explicitVersion;
  } else if (['patch', 'minor', 'major'].includes(command.toLowerCase())) {
    newVersion = bumpVersion(currentVersion, command);
  } else if (SEMVER_REGEX.test(command)) {
    // Allows direct syntax: node scripts/auto-version.js 19.2.3
    newVersion = command;
  } else {
    console.error(`Unknown command or invalid version: "${command}".`);
    console.error('Allowed commands: patch, minor, major, set <version>, current, or an explicit version like 19.2.3.');
    process.exit(1);
  }

  if (isDryRun) {
    console.log(`[Dry Run] Current version: ${currentVersion}`);
    console.log(`[Dry Run] Would update to: ${newVersion}`);
    return;
  }

  const changed = updateAllFiles(newVersion, shouldStage);
  console.log(`\x1b[32m✔\x1b[0m [SkillOS Auto-Version] Version updated: \x1b[33m${currentVersion}\x1b[0m -> \x1b[32m${newVersion}\x1b[0m`);
  if (shouldStage) {
    console.log(`  \x1b[90m(Staged ${changed.length} version files for this commit)\x1b[0m`);
  }
}

main();
