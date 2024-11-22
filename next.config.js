const withNextra = require("nextra")({
  theme: "nextra-theme-docs",
  themeConfig: "./theme.config.tsx",
});

const nextConfig = withNextra({
  async redirects() {
    return [
      {
        source: "/getting-started/genlayer-simulator",
        destination: "/genlayer-stack/genlayer-simulator",
        permanent: true,
      },
      {
        source: "/getting-started/genlayer-simulator/:page*",
        destination: "/genlayer-stack/genlayer-simulator/:page*",
        permanent: true,
      },
      {
        source: "/getting-started/development-tips",
        destination: "/genlayer-stack/genlayer-simulator/development-tips",
        permanent: true,
      },
      {
        source: "/getting-started/install-genlayer",
        destination: "/getting-started",
        permanent: true,
      },
      {
        source: "/getting-started/writing-intelligent-contracts",
        destination: "/core-concepts/intelligent-contracts",
        permanent: true,
      },
      {
        source: "/getting-started/writing-intelligent-contracts/:page*",
        destination: "/core-concepts/intelligent-contracts/:page*",
        permanent: true,
      },
      {
        source: "/core-concepts/intelligent-contract",
        destination: "/core-concepts/intelligent-contracts",
        permanent: true,
      },
      {
        source: "/concept",
        destination: "/core-concepts",
        permanent: true,
      },
      {
        source: "/concept/optimistic-democracy/slashing",
        destination: "/core-concepts/optimistic-democracy/slashing",
        permanent: true,
      },
      {
        source: "/simulator/usage-and-interaction/execute-transaction",
        destination: "/genlayer-stack/genlayer-simulator/execute-transaction",
        permanent: true,
      },
      {
        source: "/simulator/intelligent-contract-syntax/constructor",
        destination: "/core-concepts/intelligent-contracts/constructor",
        permanent: true,
      },
      {
        source: "/simulator/intelligent-contract-syntax/contract-class",
        destination: "/core-concepts/intelligent-contracts/contract-class",
        permanent: true,
      },
      {
        source: "/simulator/intelligent-contract-syntax",
        destination: "/core-concepts/intelligent-contracts",
        permanent: true,
      },
      {
        source: "/concept/optimistic-democracy/staking",
        destination: "/core-concepts/optimistic-democracy/staking",
        permanent: true,
      },
      {
        source: "/simulator/installation",
        destination: "/getting-started",
        permanent: true,
      },
      {
        source: "/overview/risks-and-security/universal-attacks",
        destination: "/security-and-best-practices/universal-attacks",
        permanent: true,
      },
      {
        source: "/ideas",
        destination: "/build-with-genlayer/ideas",
        permanent: true,
      },
      {
        source: "/build-with-genlayer/use-cases/llm-erc20",
        destination: "/build-with-genlayer/use-cases/llm-token",
        permanent: true,
      },
    ];
  },
});

console.log("Final config:", nextConfig);

module.exports = nextConfig;
