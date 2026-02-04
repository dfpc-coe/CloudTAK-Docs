<h1 align='center'>CloudTAK Documentation</h1>

This repository contains the source files for the CloudTAK documentation. The site is built using MkDocs and the Material for MkDocs theme.

## Getting Started

To run the documentation server locally, you will need Python installed on your machine.

### Installation

It is generally a good idea to set up a virtual environment for the project dependencies, though you can install them globally if you prefer.

First, clone this repository and navigate into the directory.

Then install the required packages:

```bash
pip install mkdocs mkdocs-material
```

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
- `docs/`: Contains the markdown source files.
- `docs/assets/`: Images and custom stylesheets.
- `overrides/`: HTML overrides for the theme.

## Building the Site

If you need to generate the static HTML files (for deployment, for example), run:

```bash
mkdocs build
```

The output will be generated in the `site/` directory.
