#!/usr/bin/env node
// Generate the Integrations section from the list published at api.cloudtak.io.
// Each integration gets a tile on the landing page and a page built from its repository README.
// A logo.png in the repository root is used for the tile when present.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const API = process.env.INTEGRATIONS_API || 'https://api.cloudtak.io/index.json';
const REPOS = process.env.INTEGRATIONS_REPOS;
const BRANCH = 'main';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'src', 'content', 'docs', 'integrations');
const LOGOS = path.join(ROOT, 'public', 'integrations', 'logos');

const SKIP_SCHEMES = ['http://', 'https://', '//', '#', 'mailto:', 'data:'];

const GITHUB_ICON = '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 19c-4.3 1.4 -4.3 -2.5 -6 -3m12 5v-3.5c0 -1 .1 -1.4 -.5 -2c2.8 -.3 5.5 -1.4 5.5 -6a4.6 4.6 0 0 0 -1.3 -3.2a4.2 4.2 0 0 0 -.1 -3.2s-1.1 -.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0c-2.4 -1.6 -3.5 -1.3 -3.5 -1.3a4.2 4.2 0 0 0 -.1 3.2a4.6 4.6 0 0 0 -1.3 3.2c0 4.6 2.7 5.7 5.5 6c-.6 .6 -.6 1.2 -.5 2v3.5"/></svg>';

const FALLBACK_ICON = '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 12l5 5l-1.5 1.5a3.536 3.536 0 1 1 -5 -5l1.5 -1.5"/><path d="M17 12l-5 -5l1.5 -1.5a3.536 3.536 0 1 1 5 5l-1.5 1.5"/><path d="M3 21l2.5 -2.5"/><path d="M18.5 5.5l2.5 -2.5"/><path d="M10 11l-2 2"/><path d="M13 14l-2 2"/></svg>';

async function fetchBytes(url) {
    try {
        const res = await fetch(url, { headers: { 'User-Agent': 'CloudTAK-Docs' }, signal: AbortSignal.timeout(30000) });
        if (!res.ok) return null;
        return Buffer.from(await res.arrayBuffer());
    } catch {
        return null;
    }
}

async function load(source) {
    if (/^https?:\/\//.test(source)) {
        const body = await fetchBytes(source);
        if (!body) throw new Error(`Failed to fetch ${source}`);
        return JSON.parse(body.toString('utf8'));
    }
    return JSON.parse(await fs.readFile(source, 'utf8'));
}

function githubRepo(url) {
    const match = url.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+?)\/?$/);
    return match ? { owner: match[1], name: match[2] } : null;
}

async function repoFile(repo, file) {
    if (REPOS) {
        try {
            return await fs.readFile(path.join(REPOS, repo.name, file));
        } catch {
            return null;
        }
    }
    return fetchBytes(`https://raw.githubusercontent.com/${repo.owner}/${repo.name}/${BRANCH}/${file}`);
}

function absolute(repo, target, image) {
    if (SKIP_SCHEMES.some((scheme) => target.startsWith(scheme))) return target;
    const file = target.startsWith('./') ? target.slice(2) : target.replace(/^\/+/, '');
    if (image) return `https://raw.githubusercontent.com/${repo.owner}/${repo.name}/${BRANCH}/${file}`;
    return `https://github.com/${repo.owner}/${repo.name}/blob/${BRANCH}/${file}`;
}

function rewrite(markdown, repo) {
    return markdown
        .replace(/(!?)\[([^\]]*)\]\(([^)\s]+)(\s+"[^"]*")?\)/g, (_, bang, text, target, title) => {
            return `${bang}[${text}](${absolute(repo, target, Boolean(bang))}${title || ''})`;
        })
        .replace(/\b(src|href)=(['"])([^'"]+)\2/g, (_, attr, quote, target) => {
            return `${attr}=${quote}${absolute(repo, target, attr === 'src')}${quote}`;
        });
}

function stripTitle(markdown) {
    return markdown.replace(/^\s*(#\s[^\n]*|<h1\b[^>]*>[\s\S]*?<\/h1>)\s*\n/, '');
}

async function trim(png) {
    const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let left = info.width, top = info.height, right = -1, bottom = -1;
    for (let y = 0; y < info.height; y++) {
        for (let x = 0; x < info.width; x++) {
            if (data[(y * info.width + x) * info.channels + info.channels - 1] === 0) continue;
            if (x < left) left = x;
            if (x > right) right = x;
            if (y < top) top = y;
            if (y > bottom) bottom = y;
        }
    }
    if (right < 0) return sharp(png).png().toBuffer();
    return sharp(png).extract({ left, top, width: right - left + 1, height: bottom - top + 1 }).png().toBuffer();
}

function escape(text) {
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function readmePage(integration, repo, readme, today) {
    const source = `${repo.owner}/${repo.name}`;
    return [
        '---',
        `title: ${JSON.stringify(integration.name)}`,
        `editUrl: https://github.com/${source}/edit/${BRANCH}/README.md`,
        '---',
        '',
        stripTitle(rewrite(readme, repo)).trim(),
        '',
        '---',
        '',
        ':::note',
        `This page is generated daily from the README of [${source}](https://github.com/${source}) (last fetched ${today}).`,
        'Changes should be made in that repository.',
        ':::',
        ''
    ].join('\n');
}

function tile(integration, slug, logo) {
    const name = escape(integration.name);
    const url = escape(integration.url);
    const repo = escape(integration.url.replace(/^https:\/\/github\.com\//, ''));
    const description = escape(integration.description || '');

    const lines = [
        '  <div class="tile">',
        logo
            ? `    <span class="tile-logo"><img src="/integrations/logos/${slug}.png" alt=""></span>`
            : `    <span class="tile-logo tile-logo--fallback">${FALLBACK_ICON}</span>`,
        `    <p class="tile-title"><a href="/integrations/${slug}/">${name}</a></p>`
    ];
    if (description) lines.push(`    <p>${description}</p>`);
    lines.push(`    <a class="tile-github" href="${url}" title="${repo}" aria-label="${name} on GitHub">${GITHUB_ICON}</a>`);
    lines.push('  </div>');
    return lines.join('\n');
}

function indexPage(integrations, today) {
    return [
        '---',
        'title: Integrations',
        'description: ETL tasks maintained by DFPC that bring non-TAK data sources into a TAK Server.',
        'sidebar:',
        '  hidden: true',
        '---',
        '',
        'CloudTAK integrations are ETL tasks maintained by DFPC that bring non-TAK data sources into a TAK Server.',
        'New to integrations? The [ETL documentation](/etl/) explains how connections, layers and ETL tasks fit together, and how to build, publish and configure an integration of your own.',
        '',
        '## Available Integrations',
        '',
        'Only integrations with a public source repository are listed. Select an integration to read its setup and configuration documentation, or use the GitHub icon to go straight to the source repository.',
        `The list is published at [api.cloudtak.io](https://api.cloudtak.io) and was last fetched on ${today}.`,
        '',
        '<input class="tile-filter" type="search" placeholder="Search integrations" aria-label="Search integrations" data-filter="integration-list">',
        '',
        '<div class="tiles not-content" id="integration-list">',
        ...integrations.map(({ integration, slug, logo }) => tile(integration, slug, logo)),
        '</div>',
        '',
        '<p data-filter-empty="integration-list" hidden>No integrations match your search.</p>',
        '',
        '<script src="/filter.js" defer></script>',
        ''
    ].join('\n');
}

async function clean(dir, ext) {
    await fs.mkdir(dir, { recursive: true });
    for (const file of await fs.readdir(dir)) {
        if (file.endsWith(ext)) await fs.unlink(path.join(dir, file));
    }
}

async function main() {
    const payload = await load(API);
    const today = new Date().toISOString().slice(0, 10);

    await clean(OUT, '.md');
    await clean(LOGOS, '.png');

    const integrations = [];
    const listed = (payload.integrations || []).sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    for (const integration of listed) {
        const repo = githubRepo(integration.url);
        if (!repo) {
            console.error(`skip ${integration.name}: ${integration.url} is not a GitHub repository`);
            continue;
        }

        const readme = await repoFile(repo, 'README.md');
        if (!readme) {
            console.error(`skip ${integration.name}: README.md is not publicly accessible`);
            continue;
        }

        const slug = repo.name;
        const logo = await repoFile(repo, 'logo.png');
        if (logo) await fs.writeFile(path.join(LOGOS, `${slug}.png`), await trim(logo));

        await fs.writeFile(path.join(OUT, `${slug}.md`), readmePage(integration, repo, readme.toString('utf8'), today));
        integrations.push({ integration, slug, logo: Boolean(logo) });
    }

    if (!integrations.length) {
        console.error(`${API} returned no integrations`);
        process.exit(1);
    }

    await fs.writeFile(path.join(OUT, 'index.md'), indexPage(integrations, today));

    const withLogo = integrations.filter((i) => i.logo).length;
    console.error(`wrote ${integrations.length} integrations (${withLogo} with logos) to ${OUT}`);
}

await main();
