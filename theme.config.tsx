import React from "react";
import { DocsThemeConfig } from "nextra-theme-docs";
import { useRouter } from "next/router";
import TelegramIcon from "./components/icons/telegram";
import Logo from "./components/icon";
import TwitterLogo from "./components/icons/twitter";
import DiscordIcon from "./components/icons/discord";
import GitHubIcon from "./components/icons/github";
import CopyPage from "./components/copy-page";

const config: DocsThemeConfig = {
  logo: <Logo />,
  docsRepositoryBase: "https://github.com/genlayerlabs/genlayer-docs/tree/main",
  footer: {
    text: "GenLayer Documentation",
  },
  sidebar: {
    defaultMenuCollapseLevel: 1,
  },
  navigation: true,
  head: (
    <>
      <meta name="description" content="GenLayer — the adjudication layer for the agentic economy" />
      <link rel="icon" href="/favicon.png" type="image/png" media="(prefers-color-scheme: light)" />
      <link rel="icon" href="/favicon-dark.png" type="image/png" media="(prefers-color-scheme: dark)" />
    </>
  ),
  navbar: {
    extraContent: (
      <div style={{ display: "flex", alignItems: "center" }}>
        <CopyPage />
        <a href="https://github.com/genlayerlabs" style={{ marginRight: 10 }}>
          <GitHubIcon />
        </a>
        <a href="https://t.me/genlayer" style={{ marginRight: 10 }}>
          <TelegramIcon />
        </a>
        <a href="https://x.com/GenLayer" style={{ marginRight: 10 }}>
          <TwitterLogo />
        </a>
        <a href="https://discord.gg/8Jm4v89VAu" style={{ marginRight: 10 }}>
          <DiscordIcon />
        </a>
      </div>
    ),
  },

  useNextSeoProps: () => {
    const { asPath } = useRouter();
    const isHomePage = asPath === "/";
    return {
      titleTemplate: isHomePage
        ? "GenLayer — The Adjudication Layer for the Agentic Economy"
        : "%s | GenLayer Documentation",
      openGraph: {
        type: "website",
        locale: "en_IE",
        url: "https://docs.genlayer.com/" + asPath,
        site_name: "GenLayer — The Adjudication Layer for the Agentic Economy",
        title: "GenLayer — The Adjudication Layer for the Agentic Economy",
        description:
          "Documentation for GenLayer, the adjudication layer for the agentic economy. Build Intelligent Contracts in Python, integrate the SDKs, and run a validator node.",
        images: [
          {
            url: "/assets/genlayer.png",
            width: 150,
            height: 55,
            alt: "GenLayer Logo",
          },
        ],
      },
      additionalLinkTags: [
        { rel: "icon", href: "./components/icon" },
        { rel: "apple-touch-icon", href: "./components/icon", sizes: "180x180" },
      ],
      additionalMetaTags: [
        {
          name: "description",
          content: "Documentation for GenLayer, the adjudication layer for the agentic economy. Build Intelligent Contracts in Python, integrate the SDKs, and run a validator node.",
        },
        {
          property: "og:description",
          content: "GenLayer — the adjudication layer for the agentic economy. Decentralized AI-validator consensus for contracts that need judgment, not just code.",
        },
        {
          property: "og:image",
          content: "https://docs.genlayer.com/assets/genlayer.png",
        },
      ],
    };
  },
};

export default config;
