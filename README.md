<h1 align='center'>CloudTAK Documentation</h1>

This repository contains the source files for the CloudTAK documentation. The site is built with [Astro](https://astro.build) and the [Starlight](https://starlight.astro.build) documentation theme.

## Getting Started

To run the documentation server locally you will need Node.js 22 or newer.

### Installation

First, clone this repository and navigate into the directory, then install the dependencies:

```bash
npm install
```

### Generating the Integrations Section

The Integrations landing page is generated from the integration list published by
[CloudTAK-Known](https://github.com/dfpc-coe/CloudTAK-Known) at `https://api.cloudtak.io/index.json`.
Integrations whose repository is not publicly accessible are skipped. The generated pages live in `src/content/docs/integrations/` and are not committed, so run the generator before serving or building the site:

```bash
npm run integrations
```

Each integration also gets a page built from the README of its repository, and a `logo.png` in the repository root is used
for its tile when present (transparent padding is trimmed at build time). Set `INTEGRATIONS_API` to a URL or local file path to generate from a different source, for example
a local CloudTAK-Known build, and `INTEGRATIONS_REPOS` to a directory of local repository checkouts to read the README and logo
from disk instead of GitHub.
The GitHub Pages workflow runs the generator on every build and rebuilds the site daily so the page stays in sync with the published list.

### Running the Development Server

You can start the local development server with the following command:

```bash
npm run dev
```

This will spin up a server at http://localhost:4321. The server supports hot-reloading, so any changes you save to the markdown files will automatically refresh the page in your browser.

## Editing Documentation

All documentation content is located in the `src/content/docs/` directory. Pages are MDX files with a `title` in the frontmatter, and use Starlight's built-in components rather than custom HTML:

- Asides: `:::note`, `:::tip`, `:::caution` and `:::danger` blocks, optionally with a title such as `:::caution[Beta]`.
- Steps: wrap an ordered list in `<Steps>` to render numbered steps. Indent a screenshot under its step to show it below the instruction.
- Cards and buttons: `<CardGrid>`, `<LinkCard>`, `<Card>` and `<LinkButton>` from `@astrojs/starlight/components`.
- Inline icons: `<img class="icon" src="/icons/name.png" alt="Name" />` with the image stored in `public/icons/`.

See the [Starlight components reference](https://starlight.astro.build/components/using-components/) for the full list. Add a `description` to the frontmatter to show a lead paragraph under the page title. Visual styling comes from Starlight itself; `src/styles/custom.css` only sets fonts and colours through Starlight's CSS variables.

If you are adding a new page, make sure to also update the `sidebar` section in `astro.config.mjs` so that it appears in the site navigation.

### Project Structure

- `astro.config.mjs`: The main configuration file for the site, including the sidebar navigation.
- `src/content/docs/`: Contains the markdown source files.
- `src/content/docs/assets/`: Screenshots and images referenced from the docs.
- `src/content/docs/integrations/`: Generated Integrations landing page and integration pages (not committed).
- `src/styles/custom.css`: Fonts and colours, set through Starlight's CSS variables.
- `src/components/`: Starlight component overrides: the header with section tabs, the page-outline sidebar, the page title with its lead description, and the footer. Section tabs and footer links are derived from the `sidebar` in `astro.config.mjs`.
- `src/plugins/`: Markdown plugin that opens external links in a new tab.
- `public/`: Static files served as-is, including inline icons and generated integration logos (not committed).
- `bin/integrations.js`: Generator for the Integrations section.

## Building the Site

If you need to generate the static HTML files (for deployment, for example), run:

```bash
npm run build
```

The output will be generated in the `dist/` directory and can be previewed with `npm run preview`.
