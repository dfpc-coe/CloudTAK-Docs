<h1 align='center'>CloudTAK Documentation</h1>

This repository contains the source files for the CloudTAK documentation. The site is built using MkDocs and the Material for MkDocs theme.

## Getting Started

To run the documentation server locally, you will need Python installed on your machine.

### Installation

It is generally a good idea to set up a virtual environment for the project dependencies, though you can install them globally if you prefer.

First, clone this repository and navigate into the directory.

Then install the required packages:

```bash
pip install -r requirements.txt
```

### Generating the Integrations Overview

The Integrations landing page is generated from the integration list published by
[CloudTAK-Known](https://github.com/dfpc-coe/CloudTAK-Known) at `https://api.cloudtak.io/index.json`.
Integrations whose repository is not publicly accessible are skipped. The generated page lives in `docs/integrations/` and is not committed, so run the generator before serving or building the site:

```bash
python3 bin/integrations.py
```

Each integration also gets a page built from the README of its repository, and a `logo.png` in the repository root is used
for its tile when present (transparent padding is trimmed at build time). Set `INTEGRATIONS_API` to a URL or local file path to generate from a different source, for example
a local CloudTAK-Known build, and `INTEGRATIONS_REPOS` to a directory of local repository checkouts to read the README and logo
from disk instead of GitHub.
The GitHub Pages workflow runs the generator on every build and rebuilds the site daily so the page stays in sync with the published list.

### Running the Development Server

You can start the local development server with the following command:

```bash
mkdocs serve
```

This will spin up a server at http://127.0.0.1:8000. The server supports hot-reloading, so any changes you save to the markdown files will automatically refresh the page in your browser.

## Editing Documentation

All documentation content is located in the `docs/` directory. The files are standard Markdown.

If you are adding a new page, make sure to also update the `nav` section in `mkdocs.yml` so that it appears in the site navigation menu.

### Project Structure

- `mkdocs.yml`: The main configuration file for the site.
- `requirements.txt`: Python dependencies for the docs site, including MkDocs plugins.
- `docs/`: Contains the markdown source files.
- `docs/assets/`: Images and custom stylesheets.
- `docs/integrations/`: Generated Integrations landing page, integration pages and logos (not committed).
- `bin/integrations.py`: Generator for the Integrations landing page.
- `overrides/`: HTML overrides for the theme.

## Building the Site

If you need to generate the static HTML files (for deployment, for example), run:

```bash
mkdocs build
```

The output will be generated in the `site/` directory.
