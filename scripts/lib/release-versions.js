// Which node versions the docs publish. One rule, used by the setup guide
// (update-setup-guide-versions.js), the changelog page (generate-changelog.js)
// and the sync check (check-node-sync.js). Tested by scripts/test-release-versions.js.
//
// The rule:
// - A stable release (v0.6.0) is always published.
// - A release candidate (v0.6.0-rc.2) is published while its version has no
//   stable release yet, and only the newest rc of that version. It acts as the
//   current release until the stable one exists.
// - Once v0.6.0 exists, every v0.6.0-rc.N disappears from the docs.
// - Testnet builds (v0.2.0-testnetNNN) are kept in the changelog page only.
//
// Versions come from the changelog files synced from genlayer-node
// (content/validators/changelog/<version>.mdx). The node keeps one file per rc
// and never deletes them: the docs choose what to show.

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
  const versions = names.map(parseVersion).filter(Boolean).sort(compareDesc);
  const stable = new Set(versions.filter((v) => v.pre === null).map((v) => v.core));
  const newestRc = new Map();
  for (const v of versions) {
    if (v.pre === 'rc' && !newestRc.has(v.core)) newestRc.set(v.core, v.name);
  }
  return versions
    .filter((v) => {
      if (v.pre === 'testnet') return testnet;
      if (v.pre === 'rc') return !stable.has(v.core) && newestRc.get(v.core) === v.name;
      return true;
    })
    .map((v) => v.name);
}

/**
 * True when a changelog version may leave the docs: an rc is superseded once
 * its stable release or a newer rc of the same version exists.
 */
function isSuperseded(name, names) {
  const v = parseVersion(name);
  if (!v || v.pre !== 'rc') return false;
  return names.map(parseVersion).filter(Boolean)
    .some((o) => o.core === v.core && (o.pre === null || (o.pre === 'rc' && o.preNumber > v.preNumber)));
}

module.exports = { parseVersion, compareDesc, publishedVersions, isSuperseded };
