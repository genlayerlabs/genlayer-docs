// Which node versions the setup guide names. Read by scripts/update-setup-guide-versions.js
// (npm run node-update-setup-guide), tested by scripts/test-setup-guide-versions.js.
//
// versionChannel:
//   'stable'  The guide names stable releases only: the version list, the
//             `export version=` line, and a list command that filters out
//             release candidates (`grep -v "rc"`). Default.
//   'all'     The guide names the newest version including release candidates
//             (for example v0.6.0-rc.2), and the list command keeps them.
//
// Versions come from the changelog files synced from genlayer-node
// (content/validators/changelog/*.mdx). With 'all', a release candidate shows up
// only once the node repo has a changelog file for it (docs/changelog/v0.6.0-rc.2.md).
//
// Flipping the channel is a one-line docs PR; no node release is needed.

module.exports = {
  versionChannel: 'stable',
};
