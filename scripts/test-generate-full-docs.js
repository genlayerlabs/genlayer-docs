const assert = require('assert');
const { absolutizeLinks, cleanMdxContent } = require('./generate-full-docs');

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
