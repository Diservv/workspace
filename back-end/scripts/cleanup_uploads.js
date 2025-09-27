#!/usr/bin/env node
// One-off cleanup script to delete old files in uploads folder.
// Usage: node cleanup_uploads.js --days 14

const fs = require('fs');
const path = require('path');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--days' && args[i+1]) { out.days = parseInt(args[i+1], 10); i++; }
    else if (a === '--uploads' && args[i+1]) { out.uploads = args[i+1]; i++; }
  }
  return out;
}

async function main() {
  const args = parseArgs();
  const retentionDays = args.days || parseInt(process.env.UPLOAD_RETENTION_DAYS || '14', 10);
  const uploadsDir = args.uploads || path.join(__dirname, '..', 'uploads');
  const msThreshold = retentionDays * 24 * 60 * 60 * 1000;
  console.log(`Running cleanup on ${uploadsDir} for files older than ${retentionDays} days`);
  try {
    const files = fs.readdirSync(uploadsDir);
    const now = Date.now();
    let removed = 0;
    for (const f of files) {
      try {
        const full = path.join(uploadsDir, f);
        const stat = fs.statSync(full);
        if (now - stat.mtimeMs > msThreshold) {
          fs.unlinkSync(full);
          console.log('Removed:', full);
          removed++;
        }
      } catch (e) {
        console.warn('Skipping file error:', f, e.message);
      }
    }
    console.log(`Done. Removed ${removed} files.`);
  } catch (err) {
    console.error('Cleanup failed:', err.message);
    process.exit(2);
  }
}

main();
