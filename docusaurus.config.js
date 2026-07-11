// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'PreciCore Docs',
  tagline: 'Precision beyond the human hand.',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://docs.precicore.ca',
  baseUrl: '/',

  organizationName: 'poisnoir',
  projectName: 'precicore-docs',

  onBrokenLinks: 'throw',

  headTags: [
    { tagName: 'link', attributes: { rel: 'preconnect', href: 'https://fonts.googleapis.com' } },
    { tagName: 'link', attributes: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' } },
  ],

  markdown: {
    mermaid: true,
  },

  themes: [
    '@docusaurus/theme-mermaid',
  ],

  plugins: [
    ['@easyops-cn/docusaurus-search-local', {
      hashed: true,
      indexBlog: false,
      docsRouteBasePath: '/docs',
    }],
  ],

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          editUrl: undefined,
          showLastUpdateTime: false,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.5,
          ignorePatterns: ['/tags/**'],
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/social-card.svg',
      announcementBar: {
        id: 'precicore-v01',
        content: 'v0.1 · MIT Licensed · Open source surgical robotics stack — <a href="https://github.com/poisnoir" target="_blank" rel="noopener">View on GitHub →</a>',
        backgroundColor: '#f0ece4',
        textColor: '#1a1a1a',
        isCloseable: true,
      },
      colorMode: {
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: 'PreciCore Docs',
        logo: {
          alt: 'PreciCore Logo',
          src: 'img/logo.svg',
        },
        items: [
          { type: 'html', position: 'left', value: '<span class="nav-version">v0.1</span>' },
          { to: '/docs/spine/intro', label: 'Spine', position: 'left' },
          { to: '/docs/spine-nodes/intro', label: 'Spine Nodes', position: 'left' },
          { type: 'html', position: 'right', value: '<span class="nav-search-hint"><kbd>/</kbd></span>' },
          { href: 'https://github.com/poisnoir', label: 'GitHub', position: 'right' },
          { href: 'https://precicore.ca', label: 'Website', position: 'right' },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              { label: 'Spine', to: '/docs/spine/intro' },
              { label: 'Spine Nodes', to: '/docs/spine-nodes/intro' },
              { label: 'Changelog', to: '/changelog' },
            ],
          },
          {
            title: 'Community',
            items: [
              { label: 'GitHub', href: 'https://github.com/poisnoir' },
              { label: 'Website', href: 'https://precicore.ca' },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} PreciCore. Built with Docusaurus.`,
      },
      mermaid: {
        theme: { light: 'neutral', dark: 'dark' },
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['go', 'zig', 'bash', 'json'],
      },
    }),
};

export default config;
