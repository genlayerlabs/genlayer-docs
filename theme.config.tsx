import React from 'react';
import { DocsThemeConfig } from 'nextra-theme-docs';
import { useRouter } from 'next/router';
import TelegramIcon from './components/telegram';
import Logo from './components/icon';
import TwitterLogo from './components/twitter';
import DiscordIcon from './components/discord';

const config: DocsThemeConfig = {
  logo: <Logo />,
  project: {
    link: 'https://github.com/yeagerai/genlayer-simulator',
  },
  docsRepositoryBase: 'https://github.com/yeagerai/genlayer-docs',
  footer: {
    text: 'GenLayer Documentation',
  },
  navbar: {
    extraContent: (
      <div style={{ display: 'flex', alignItems: 'center' }}>
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
    const isHomePage = asPath === '/';
    return {
      titleTemplate: isHomePage ? '%s | GenLayer Documentation' : '%s | Detailed GenLayer Documentation',
      openGraph: {
        type: 'website',
        locale: 'en_IE',
        url: 'https://docs.genlayer.com/' + asPath,
        site_name: 'GenLayer Documentation',
      },
      additionalLinkTags: [
        { rel: 'icon', href: './components/icon' },
        { rel: 'apple-touch-icon', href: './components/icon', sizes: '180x180' }
      ],
      additionalMetaTags: [
        {
          name: 'description',
          content: 'Comprehensive documentation and guides on how to use GenLayer.'
        },
        {
          property: 'og:description',
          content: 'GenLayer the intelligence layer of the internet - Documentation.'
        },
        {
          property: 'og:image',
          content: './components/icon'
        }
      ]
    }
  }
};

export default config;
