const withNextra = require("nextra")({
  theme: "nextra-theme-docs",
  themeConfig: "./theme.config.tsx",
  latex: true,
});

const previousRedirects = [
  {
    old: "/getting-started/genlayer-simulator",
    new: "/developers/intelligent-contracts/tools/genlayer-studio",
  },
  {
    old: "/getting-started/genlayer-simulator/:page*",
    new: "/developers/intelligent-contracts/tools/genlayer-studio/:page*",
  },
  {
    old: "/getting-started/development-tips",
    new: "/developers/intelligent-contracts/tools/genlayer-studio/development-tips",
  },
  { old: "/getting-started/install-genlayer", new: "/getting-started" },
  { old: "/getting-started/writing-intelligent-contracts", new: "/core-concepts/intelligent-contracts" },
  {
    old: "/getting-started/writing-intelligent-contracts/:page*",
    new: "/developers/intelligent-contracts/first-contract",
  },
  { old: "/core-concepts/intelligent-contract", new: "/core-concepts/intelligent-contracts" },
  { old: "/concept", new: "/core-concepts" },
  { old: "/concept/optimistic-democracy/slashing", new: "/core-concepts/optimistic-democracy/slashing" },
  {
    old: "/simulator/usage-and-interaction/execute-transaction",
    new: "/genlayer-stack/genlayer-simulator/execute-transaction",
  },
  {
    old: "/simulator/intelligent-contract-syntax/constructor",
    new: "/core-concepts/intelligent-contracts/constructor",
  },
  {
    old: "/simulator/intelligent-contract-syntax/contract-class",
    new: "/core-concepts/intelligent-contracts/contract-class",
  },
  { old: "/simulator/intelligent-contract-syntax", new: "/core-concepts/intelligent-contracts" },
  { old: "/concept/optimistic-democracy/staking", new: "/core-concepts/optimistic-democracy/staking" },
  { old: "/simulator/installation", new: "/getting-started" },
  {
    old: "/overview/risks-and-security/universal-attacks",
    new: "/security-and-best-practices/universal-attacks",
  },
  { old: "/ideas", new: "/developers/intelligent-contracts/ideas" },
  { old: "/genlayer-stack/genlayer-simulator", new: "/genlayer-stack/genlayer-studio" },
  {
    old: "/genlayer-stack/genlayer-simulator/:page*",
    new: "/developers/intelligent-contracts/tools/genlayer-studio/:page*",
  },
  { old: "/build-with-genlayer/use-cases/llm-erc20", new: "/developers/intelligent-contracts/ideas" },
  {
    old: "/advanced-features/:page*",
    new: "/developers/intelligent-contracts/advanced-features/:page*",
  },
  { old: "/core-concepts/intelligent-contracts", new: "/developers/intelligent-contracts/introduction" },
  {
    old: "/core-concepts/intelligent-contracts/:page*",
    new: "/developers/intelligent-contracts/introduction",
  },
];

const actualRedirects = [
  { old: "/getting-started", new: "/developers" },

  { old: "/overview", new: "/understand-genlayer-protocol" },
  { old: "/overview/:page*", new: "/understand-genlayer-protocol/:page*" },

  { old: "/core-concepts", new: "/understand-genlayer-protocol/core-concepts" },
  { old: "/core-concepts/:page*", new: "/understand-genlayer-protocol/core-concepts/:page*" },

  { old: "/references", new: "/api-references" },
  { old: "/references/:page*", new: "/api-references/:page*" },
  {
    old: "/build-with-genlayer/intelligent-contracts",
    new: "/developers/intelligent-contracts/introduction",
  },
  {
    old: "/build-with-genlayer/intelligent-contracts/:page*",
    new: "/developers/intelligent-contracts/:page*",
  },
  {
    old: "/build-with-genlayer/intelligent-contracts/advanced-features/:page*",
    new: "/developers/intelligent-contracts/advanced-features/:page*",
  },
  {
    old: "/build-with-genlayer/use-cases/:page*",
    new: "/developers/intelligent-contracts/examples/:page*",
  },
  {
    old: "/build-with-genlayer/intelligent-contracts/learning-by-example",
    new: "/developers/intelligent-contracts/introduction",
  },
  {
    old: "/genlayer-stack/genlayer-js",
    new: "/developers/decentralized-applications/genlayer-js",
  },
  {
    old: "/genlayer-stack/genlayer-cli",
    new: "/developers/intelligent-contracts/tools/genlayer-cli",
  },
  {
    old: "/genlayer-stack/genlayer-studio",
    new: "/developers/intelligent-contracts/tools/genlayer-studio",
  },
  {
    old: "/genlayer-stack/genlayer-studio/:page*",
    new: "/developers/intelligent-contracts/tools/genlayer-studio/:page*",
  },
  {
    old: "/security-and-best-practices",
    new: "/developers/intelligent-contracts/security-and-best-practices/prompt-injection",
  },
  {
    old: "/security-and-best-practices/:page",
    new: "/developers/intelligent-contracts/security-and-best-practices/prompt-injection",
  },
  {
    old: "/about-genlayer/:page*",
    new: "/understand-genlayer-protocol/:page*",
  },
  {
    old: "/developers/decentralized-applications/testing-and-debugging",
    new: "/developers/decentralized-applications/testing",
  },
  {
    old: "/overview/what-is-genlayer",
    new: "/understand-genlayer-protocol",
  },
  {
    old: "/overview/genlayer-different",
    new: "/understand-genlayer-protocol/what-makes-genlayer-different",
  },
  {
    old: "/build-with-genlayer/use-cases",
    new: "/developers/intelligent-contracts/examples/storage",
  },
  {
    old: "/developers/intelligent-contracts/your-first-contract",
    new: "/developers/intelligent-contracts/first-contract",
  },
  {
    old: "/developers/intelligent-contracts/examples",
    new: "/developers/intelligent-contracts/examples/storage",
  },
  {
    old: "/developers/intelligent-contracts/advanced-features",
    new: "/developers/intelligent-contracts/advanced-features/contract-to-contract-interaction",
  },
  {
    old: "/developers/intelligent-contracts/testing-and-debugging",
    new: "/developers/intelligent-contracts/debugging",
  },
  {
    old: "/developers/intelligent-contracts/security-and-best-practices/",
    new: "/developers/intelligent-contracts/security-and-best-practices/prompt-injection",
  },
];

const nextConfig = withNextra({
  async redirects() {
    return [
      // Previous redirects
      ...previousRedirects.map(({ old, new: destination }) => ({
        source: old,
        destination,
        permanent: true,
      })),
      // Actual redirects
      ...actualRedirects.map(({ old, new: destination }) => ({
        source: old,
        destination,
        permanent: true,
      })),
    ];
  },
});

module.exports = nextConfig;
