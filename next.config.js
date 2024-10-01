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
    ];
  },
});

console.log("Final config:", nextConfig);

module.exports = nextConfig;
