const assert = require('assert');
const { absolutizeLinks, cleanMdxContent } = require('./generate-full-docs');
const { findRelativeLink } = require('./check-llm-exports');

// Unit tests for the markdown export transforms in generate-full-docs.js
const PAGE = 'https://docs.genlayer.com/developers/intelligent-contracts/tooling-setup';
const cases = [
  ['fragment link', '[Environments](#environments)', `[Environments](${PAGE}#environments)`],
  ['root-relative link', '[Setup](/validators/setup-guide)', '[Setup](https://docs.genlayer.com/validators/setup-guide)'],
  ['dot-relative link', '[Deploy](./deploying)', '[Deploy](https://docs.genlayer.com/developers/intelligent-contracts/deploying)'],
  ['parent-relative link', '[Up](../decentralized-applications/testing)', '[Up](https://docs.genlayer.com/developers/decentralized-applications/testing)'],
  ['angle-bracket inline link', '[Setup](</validators/setup-guide>)', '[Setup](<https://docs.genlayer.com/validators/setup-guide>)'],
  ['reference definition', '[guide]: /validators/setup-guide', '[guide]: https://docs.genlayer.com/validators/setup-guide'],
  ['angle-bracket reference definition', '[guide]: </validators/setup-guide>', '[guide]: <https://docs.genlayer.com/validators/setup-guide>'],
  ['angle-bracket reference definition with title', '[guide]: </validators/setup-guide> "Guide"', '[guide]: <https://docs.genlayer.com/validators/setup-guide> "Guide"'],
  ['image', '![Logo](/morpheus.png)', '![Logo](https://docs.genlayer.com/morpheus.png)'],
  ['href attribute', '<a href="/developers">x</a>', '<a href="https://docs.genlayer.com/developers">x</a>'],
  ['absolute link untouched', '[X](https://example.com/a)', '[X](https://example.com/a)'],
  ['mailto untouched', '[Mail](mailto:a@b.c)', '[Mail](mailto:a@b.c)'],
  ['inline code untouched', '`[x](/y)`', '`[x](/y)`'],
  ['fenced code untouched', '```\n[x](/y)\n```', '```\n[x](/y)\n```'],
];
for (const [name, input, expected] of cases) {
  assert.strictEqual(absolutizeLinks(input, PAGE), expected, name);
  console.log(`ok - ${name}`);
}

assert.strictEqual(
  cleanMdxContent('<img src="/morpheus.png" alt="Morpheus" width="300" />'),
  '![Morpheus](/morpheus.png)'
);
console.log('ok - <img> converted to markdown image');

// Integration: everything the converter emits must pass the build checker,
// and the checker must still catch links the converter would have fixed
for (const [name, input] of cases) {
  const output = absolutizeLinks(input, PAGE);
  assert.strictEqual(findRelativeLink(output), null, `checker rejects converter output: ${name}`);
}
console.log('ok - checker accepts all converter output');

for (const bad of ['[x](/y)', '[x](<./y>)', '[x](#frag)', '![i](img.png)']) {
  assert.ok(findRelativeLink(bad), `checker misses relative link: ${bad}`);
}
console.log('ok - checker flags relative links (bare and angle-bracketed)');
