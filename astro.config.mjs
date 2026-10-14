import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightImageZoom from 'starlight-image-zoom';
import { satteri } from '@astrojs/markdown-satteri';
import externalLinks from './src/plugins/external-links.mjs';

export default defineConfig({
    site: 'https://docs.cloudtak.io',
    redirects: {
        '/docs': '/'
    },
    markdown: {
        processor: satteri({
            hastPlugins: [externalLinks('https://docs.cloudtak.io')]
        })
    },
    integrations: [
        starlight({
            title: 'CloudTAK Documentation',
            description: 'Official documentation for CloudTAK',
            logo: {
                src: './src/assets/cloudtak-text.svg',
                replacesTitle: true
            },
            favicon: '/favicon-96x96.png',
            social: [
                { icon: 'github', label: 'GitHub', href: 'https://github.com/dfpc-coe/CloudTAK' }
            ],
            tableOfContents: false,
            markdown: {
                headingLinks: false
            },
            editLink: {
                baseUrl: 'https://github.com/dfpc-coe/CloudTAK-Docs/edit/main/'
            },
            lastUpdated: true,
            customCss: [
                '@fontsource/roboto/400.css',
                '@fontsource/roboto/500.css',
                '@fontsource/roboto/700.css',
                '@fontsource/roboto-mono/400.css',
                './src/styles/custom.css'
            ],
            components: {
                Header: './src/components/Header.astro',
                Sidebar: './src/components/Sidebar.astro',
                PageTitle: './src/components/PageTitle.astro',
                Footer: './src/components/Footer.astro'
            },
            plugins: [starlightImageZoom()],
            sidebar: [
                { label: 'Deploy', slug: 'deploy' },
                { label: 'Develop', slug: 'develop' },
                { label: 'Plugins', slug: 'plugin' },
                { label: 'Administration', slug: 'admin' },
                { label: 'Styling', slug: 'styling' },
                { label: 'User Guide', slug: 'user' },
                {
                    label: 'Integrations',
                    items: [
                        { label: 'Overview', slug: 'integrations' },
                        { label: 'Documentation', slug: 'etl' },
                        { label: 'Catalog', collapsed: true, items: [{ autogenerate: { directory: 'integrations' } }] }
                    ]
                }
            ]
        })
    ]
});
