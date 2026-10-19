// Which node versions the docs publish. One rule, used by the setup guide
// (update-setup-guide-versions.js), the changelog page (generate-changelog.js)
// and the sync check (check-node-sync.js). Tested by scripts/test-release-versions.js.
//
// The rule: the docs publish every version that has a changelog file in the
// node repo (content/validators/changelog/<version>.mdx, synced from
// genlayer-node docs/changelog/). The node decides what is published:
// - each release candidate gets its own file (v0.6.0-rc.1, v0.6.0-rc.2, ...);
// - the node removes the rc files when it decides to (for example when v0.6.0
//   is released), and the next sync removes them from the docs.
// The changelog page lists them all (plus testnet builds). The setup guide
// lists only the current release line, the major.minor of the newest version
// (during v0.6.0-rc.N that is v0.6.x), and names the newest one; a stable
// release sorts above its own rcs.

// v0.6.0, v0.6.0-rc.2, v0.2.0-testnet005
const VERSION_RE = /^v(\d+)\.(\d+)\.(\d+)(?:-(rc)\.(\d+)|-(testnet)(\d+))?$/;

function parseVersion(name) {
  const m = name.match(VERSION_RE);
  if (!m) return null;
  return {
    name,
    core: `${m[1]}.${m[2]}.${m[3]}`,
    parts: [Number(m[1]), Number(m[2]), Number(m[3])],
    pre: m[4] || m[6] || null, // null for a stable release
    preNumber: Number(m[5] || m[7] || 0),
  };
}

// Newest first. A stable release sorts above its own pre-releases.
function compareDesc(a, b) {
  for (let i = 0; i < 3; i++) {
    if (a.parts[i] !== b.parts[i]) return b.parts[i] - a.parts[i];
  }
  if (!a.pre !== !b.pre) return a.pre ? 1 : -1;
  return b.preNumber - a.preNumber;
}

/**
 * The versions the docs publish, newest first.
 * @param {string[]} names version names (changelog file names without .mdx)
 * @param {{testnet?: boolean}} options testnet: keep testnet builds (changelog page)
 */
function publishedVersions(names, { testnet = false } = {}) {
  return names
    .map(parseVersion)
    .filter(Boolean)
    .filter((v) => testnet || v.pre !== 'testnet')
    .sort(compareDesc)
    .map((v) => v.name);
}

/**
 * The current release line: the published versions with the same major.minor
 * as the newest one. Input and output are newest first.
 */
function currentLine(versions) {
  if (versions.length === 0) return [];
  const line = (name) => parseVersion(name).parts.slice(0, 2).join('.');
  const current = line(versions[0]);
  return versions.filter((v) => line(v) === current);
}

/**
 * True when a changelog version may leave the docs without failing the sync
 * check: the node removes rc files on purpose; a stable release never leaves.
 */
function mayLeave(name) {
  const v = parseVersion(name);
  return Boolean(v && v.pre === 'rc');
}

module.exports = { parseVersion, compareDesc, publishedVersions, currentLine, mayLeave };
