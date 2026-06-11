const path = require('path');
const { execFileSync } = require('child_process');

// Map of absolute file path -> last commit date (YYYY-MM-DD), built from a
// single `git log` pass. Returns {} when git is unavailable (e.g. shallow CI
// checkouts) — callers should fall back to fs mtime.
function buildGitDates() {
  const dates = {};
  try {
    const output = execFileSync('git', ['log', '--format=%cI', '--name-only', '--', 'pages'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
    let currentDate = null;
    for (const line of output.split('\n')) {
      if (/^\d{4}-\d{2}-\d{2}T/.test(line)) {
        currentDate = line.trim();
      } else if (line.startsWith('pages/') && currentDate) {
        const absPath = path.join(process.cwd(), line);
        if (!(absPath in dates)) {
          dates[absPath] = currentDate.slice(0, 10);
        }
      }
    }
  } catch (e) {
    // git unavailable — fall back to mtime in callers
  }
  return dates;
}

module.exports = { buildGitDates };
