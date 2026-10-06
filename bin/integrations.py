#!/usr/bin/env python3
"""Generate the Integrations section from the list published at api.cloudtak.io.

Each integration gets a tile on the landing page and a page built from its repository README.
A logo.png in the repository root is used for the tile when present.
"""

import html
import io
import json
import os
import re
import sys
import urllib.error
import urllib.request
from datetime import date
from pathlib import Path

from PIL import Image

API = os.environ.get('INTEGRATIONS_API', 'https://api.cloudtak.io/index.json')
REPOS = os.environ.get('INTEGRATIONS_REPOS')
BRANCH = 'main'
OUT = Path(__file__).resolve().parent.parent / 'docs' / 'integrations'
LOGOS = OUT / 'logos'

SKIP_SCHEMES = ('http://', 'https://', '//', '#', 'mailto:', 'data:')

GITHUB_ICON = '<svg class="docs-card-github-icon" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 19c-4.3 1.4 -4.3 -2.5 -6 -3m12 5v-3.5c0 -1 .1 -1.4 -.5 -2c2.8 -.3 5.5 -1.4 5.5 -6a4.6 4.6 0 0 0 -1.3 -3.2a4.2 4.2 0 0 0 -.1 -3.2s-1.1 -.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0c-2.4 -1.6 -3.5 -1.3 -3.5 -1.3a4.2 4.2 0 0 0 -.1 3.2a4.6 4.6 0 0 0 -1.3 3.2c0 4.6 2.7 5.7 5.5 6c-.6 .6 -.6 1.2 -.5 2v3.5"/></svg>'

FALLBACK_ICON = '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 12l5 5l-1.5 1.5a3.536 3.536 0 1 1 -5 -5l1.5 -1.5"/><path d="M17 12l-5 -5l1.5 -1.5a3.536 3.536 0 1 1 5 5l-1.5 1.5"/><path d="M3 21l2.5 -2.5"/><path d="M18.5 5.5l2.5 -2.5"/><path d="M10 11l-2 2"/><path d="M13 14l-2 2"/></svg>'


def fetch(url, method='GET'):
    req = urllib.request.Request(url, method=method, headers={'User-Agent': 'CloudTAK-Docs'})
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            return res.read()
    except (urllib.error.HTTPError, urllib.error.URLError):
        return None


def load(source):
    if source.startswith(('http://', 'https://')):
        return json.loads(fetch(source).decode('utf-8'))
    return json.loads(Path(source).read_text())


def github_repo(url):
    match = re.match(r'https://github\.com/([^/]+)/([^/]+?)/?$', url)
    return (match.group(1), match.group(2)) if match else None


def repo_file(repo, path):
    owner, name = repo
    if REPOS:
        local = Path(REPOS) / name / path
        return local.read_bytes() if local.exists() else None
    return fetch(f'https://raw.githubusercontent.com/{owner}/{name}/{BRANCH}/{path}')


def absolute(repo, path, image):
    if path.startswith(SKIP_SCHEMES):
        return path
    path = path[2:] if path.startswith('./') else path.lstrip('/')
    owner, name = repo
    if image:
        return f'https://raw.githubusercontent.com/{owner}/{name}/{BRANCH}/{path}'
    return f'https://github.com/{owner}/{name}/blob/{BRANCH}/{path}'


def rewrite(markdown, repo):
    def md_link(match):
        bang, text, path, title = match.groups()
        return f'{bang}[{text}]({absolute(repo, path, bool(bang))}{title or ""})'

    def html_attr(match):
        attr, quote, path = match.groups()
        return f'{attr}={quote}{absolute(repo, path, attr == "src")}{quote}'

    markdown = re.sub(r'(!?)\[([^\]]*)\]\(([^)\s]+)(\s+"[^"]*")?\)', md_link, markdown)
    markdown = re.sub(r'\b(src|href)=([\'"])([^\'"]+)\2', html_attr, markdown)
    return markdown


def trim(png):
    image = Image.open(io.BytesIO(png)).convert('RGBA')
    bbox = image.getbbox()
    if bbox:
        image = image.crop(bbox)
    out = io.BytesIO()
    image.save(out, format='PNG')
    return out.getvalue()


def readme_page(integration, repo, readme, today):
    owner, name = repo
    return '\n'.join([
        '---',
        f'title: {json.dumps(integration["name"])}',
        '---',
        '',
        rewrite(readme, repo).rstrip(),
        '',
        '---',
        '',
        '!!! info',
        f'    This page is generated daily from the README of [{owner}/{name}](https://github.com/{owner}/{name}) (last fetched {today}).',
        '    Changes should be made in that repository.',
        '',
    ])


def tile(integration, slug, logo):
    name = html.escape(integration['name'])
    url = html.escape(integration['url'])
    repo = html.escape(integration['url'].removeprefix('https://github.com/'))
    description = html.escape(integration.get('description') or '')

    if logo:
        logo_html = f'    <span class="docs-card-logo"><img src="logos/{slug}.png" alt=""></span>'
    else:
        logo_html = f'    <span class="docs-card-logo docs-card-logo--fallback">{FALLBACK_ICON}</span>'

    lines = [
        '  <div class="docs-card docs-card-compact docs-card-integration">',
        logo_html,
        f'    <h3><a class="docs-card-link" href="{slug}/">{name}</a></h3>',
    ]
    if description:
        lines.append(f'    <p>{description}</p>')
    lines.append(f'    <a class="docs-card-github" href="{url}" title="{repo}" aria-label="{name} on GitHub">{GITHUB_ICON}</a>')
    lines.append('  </div>')
    return '\n'.join(lines)


def main():
    payload = load(API)
    today = date.today().isoformat()

    OUT.mkdir(parents=True, exist_ok=True)
    LOGOS.mkdir(exist_ok=True)
    for stale in [*OUT.glob('*.md'), *LOGOS.glob('*.png')]:
        stale.unlink()

    integrations = []
    for integration in sorted(payload.get('integrations', []), key=lambda i: i['name'].lower()):
        repo = github_repo(integration['url'])
        if not repo:
            print(f'skip {integration["name"]}: {integration["url"]} is not a GitHub repository', file=sys.stderr)
            continue

        readme = repo_file(repo, 'README.md')
        if readme is None:
            print(f'skip {integration["name"]}: README.md is not publicly accessible', file=sys.stderr)
            continue

        slug = repo[1]
        logo = repo_file(repo, 'logo.png')
        if logo:
            (LOGOS / f'{slug}.png').write_bytes(trim(logo))

        (OUT / f'{slug}.md').write_text(readme_page(integration, repo, readme.decode('utf-8'), today))
        integrations.append((integration, slug, bool(logo)))

    if not integrations:
        print(f'{API} returned no integrations', file=sys.stderr)
        sys.exit(1)

    page = [
        '# Integrations',
        '',
        'CloudTAK integrations are ETL tasks maintained by DFPC that bring non-TAK data sources into a TAK Server.',
        '',
        '<div class="docs-card-grid docs-card-grid--one">',
        '  <a class="docs-card" href="../etl/">',
        '    <span class="docs-card-icon">📘</span>',
        '    <h3>Documentation</h3>',
        '    <p>Learn how connections, layers and ETL tasks fit together, and how to build, publish and configure an integration of your own.</p>',
        '    <span class="docs-card-meta">Best for administrators and integration developers</span>',
        '  </a>',
        '</div>',
        '',
        '## Available Integrations',
        '',
        'Only integrations with a public source repository are listed. Select an integration to read its setup and configuration documentation, or use the GitHub icon to go straight to the source repository.',
        f'The list is published at [api.cloudtak.io](https://api.cloudtak.io) and was last fetched on {today}.',
        '',
        '<input class="docs-filter" type="search" placeholder="Search integrations" aria-label="Search integrations" data-filter="integration-list">',
        '',
        '<div class="docs-card-grid docs-card-grid--four" id="integration-list">',
        *(tile(i, slug, logo) for i, slug, logo in integrations),
        '</div>',
        '',
        '<p class="docs-filter-empty" data-filter-empty="integration-list" hidden>No integrations match your search.</p>',
        '',
    ]
    (OUT / 'index.md').write_text('\n'.join(page))

    summary = [
        '* [Home](index.md)',
        '* [Documentation](../etl.md)',
        '* Catalog',
        *(f'    * [{i["name"]}]({slug}.md)' for i, slug, _ in integrations),
    ]
    (OUT / 'SUMMARY.md').write_text('\n'.join(summary) + '\n')

    with_logo = sum(1 for _, _, logo in integrations if logo)
    print(f'wrote {len(integrations)} integrations ({with_logo} with logos) to {OUT}', file=sys.stderr)


if __name__ == '__main__':
    main()
