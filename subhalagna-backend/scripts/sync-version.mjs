/**
 * @fileoverview SubhaLagna v3.0.0 — Automated Version Synchronization
 * @description  Synchronizes version headers project-wide using Backend as Master.
 *               - [v3.0.0 changes]
 *               - Initial implementation of the permanent versioning solution.
 * @author       SubhaLagna Team
 * @version      3.0.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Configuration
const MASTER_PACKAGE = path.resolve(__dirname, '../package.json');
const TARGET_ROOT = path.resolve(__dirname, '../../');
const TARGET_EXTENSIONS = ['.js', '.jsx'];
const EXCLUDE_DIRS = ['node_modules', '.git', 'dist', 'build', 'uploads', 'brain'];

// 2. Read Master Version
const packageData = JSON.parse(fs.readFileSync(MASTER_PACKAGE, 'utf8'));
const version = packageData.version;
console.log(`🚀 Master Version Detected: ${version}`);

/**
 * Recursively sync versions in a directory
 * @param {string} dir
 */
function syncDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(file)) {
        syncDirectory(fullPath);
      }
    } else if (TARGET_EXTENSIONS.includes(path.extname(file))) {
      syncFile(fullPath);
    }
  }
}

/**
 * Update version strings and standards in a single file
 * @param {string} filePath
 */
function syncFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Tag Modernization: @fileoverview -> @file
  if (content.includes('@fileoverview')) {
    content = content.replace(/@fileoverview/g, '@file       ');
    changed = true;
  }

  // 2. Pattern A: @version X.X.X
  const versionRegex = /@version\s+(\d+\.\d+\.\d+)/g;
  if (versionRegex.test(content)) {
    content = content.replace(versionRegex, `@version      ${version}`);
    changed = true;
  }

  // 3. Pattern B: SubhaLagna vX.X.X
  const nameVersionRegex = /SubhaLagna v(\d+\.\d+\.\d+)/g;
  if (nameVersionRegex.test(content)) {
    content = content.replace(nameVersionRegex, `SubhaLagna v${version}`);
    changed = true;
  }

  // 4. Strict Mode Enforcement (Backend Node.js files only)
  if (filePath.includes('subhalagna-backend') && filePath.endsWith('.js')) {
    // Remove existing strict mode (global or duplicate) to ensure it stays at Line 1
    const strictRegex = /^['"]use strict['"];?\s*/gm;
    if (strictRegex.test(content)) {
      content = content.replace(strictRegex, '');
    }
    content = '"use strict";\n\n' + content;
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Synced: ${path.relative(TARGET_ROOT, filePath)}`);
  }
}

/**
 * Handle individual package.json sync
 */
function syncFrontendPackage() {
  const frontendPackagePath = path.resolve(TARGET_ROOT, 'subhalagna-frontend/package.json');
  if (fs.existsSync(frontendPackagePath)) {
    const data = JSON.parse(fs.readFileSync(frontendPackagePath, 'utf8'));
    if (data.version !== version) {
      data.version = version;
      fs.writeFileSync(frontendPackagePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
      console.log('✨ Synced: subhalagna-frontend/package.json');
    }
  }
}

// ── EXECUTION ──
console.log('⏳ Starting global version synchronization...');
syncDirectory(TARGET_ROOT);
syncFrontendPackage();
console.log('\n🌟 Synchronization Complete. All files are now at v' + version);
