import React from "react";
import { DocsThemeConfig } from "nextra-theme-docs";
import { useRouter } from "next/router";
import TelegramIcon from "./components/telegram";
import Logo from "./components/icon";
import TwitterLogo from "./components/twitter";
import DiscordIcon from "./components/discord";

const config: DocsThemeConfig = {
  logo: <Logo />,
  project: {
    link: "https://github.com/genlayerlabs/",
  },
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
      <meta name="description" content="GenLayer the intelligence layer of the Internet" />
    </>
  ),
  navbar: {
    extraContent: (
      <div style={{ display: "flex", alignItems: "center" }}>
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
        ? "GenLayer the intelligence layer of the Internet - Documentation"
        : "%s | Detailed GenLayer Documentation",
      openGraph: {
        type: "website",
        locale: "en_IE",
        url: "https://docs.genlayer.com/" + asPath,
        site_name: "GenLayer: the intelligence layer of the Internet - Documentation",
        title: "GenLayer: the intelligence layer of the Internet - Documentation",
        description:
          "Build and deploy AI-powered applications with GenLayer. Comprehensive documentation, guides, and API references for developers.",
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
          content: "Comprehensive documentation and guides on how to use GenLayer.",
        },
        {
          property: "og:description",
          content: "GenLayer the intelligence layer of the Internet - Documentation.",
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
