import React from 'react'
import { DocsThemeConfig } from 'nextra-theme-docs'
import { useRouter } from 'next/router'
import TelegramIcon from './components/telegram'
import Logo from './components/icon'

const config: DocsThemeConfig = {
  logo: <Logo />,
  project: {
    link: 'https://github.com/yeagerai/genlayer-docs',
  },
  chat: {
    icon: <TelegramIcon />,
    link: 'https://t.me/genlayer',
  },
  docsRepositoryBase: 'https://github.com/yeagerai/genlayer-docs',
  footer: {
    text: 'GenLayer Documentation',
  },
  useNextSeoProps: () => {
    const { asPath } = useRouter();
    const isHomePage = asPath === '/';
    return {
      titleTemplate: isHomePage ? '%s | GenLayer Documentation' : '%s | Detailed GenLayer Documentation',
      openGraph: {
        type: 'website',
        locale: 'en_IE',
        url: 'https://www.yourwebsite.com' + asPath,
        site_name: 'GenLayer Documentation',
      },
      additionalLinkTags: [
        { rel: 'icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', href: '/apple-icon.png', sizes: '180x180' }
      ],
      additionalMetaTags: [
        {
          name: 'description',
          content: 'Comprehensive documentation and guides on how to use GenLayer.'
        },
        {
          property: 'og:description',
          content: ' GenLayer the intelligence layer of the internet - Documentation.'
        },
        {
          property: 'og:image',
          content: 'https://www.yourwebsite.com/images/og-image.png'
        }
      ]
    }
  }
}

export default config
