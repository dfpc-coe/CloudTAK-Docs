import type { StarlightRouteData } from '@astrojs/starlight/route-data';

type Entry = StarlightRouteData['sidebar'][number];

export interface Section {
    label: string;
    href: string;
    isCurrent: boolean;
}

export function firstLink(entry: Entry): { href: string } | undefined {
    if (entry.type === 'link') return entry;
    for (const child of entry.entries) {
        const link = firstLink(child);
        if (link) return link;
    }
}

export function hasCurrent(entry: Entry): boolean {
    return entry.type === 'link' ? entry.isCurrent : entry.entries.some(hasCurrent);
}

/** Top-level sidebar entries from astro.config.mjs, used as the header tabs and footer links. */
export function sections(sidebar: Entry[]): Section[] {
    return sidebar.flatMap((entry) => {
        const link = firstLink(entry);
        return link ? [{ label: entry.label, href: link.href, isCurrent: hasCurrent(entry) }] : [];
    });
}

/** Sidebar label of the current page. */
export function currentLabel(sidebar: Entry[]): string | undefined {
    for (const entry of sidebar) {
        if (entry.type === 'link') {
            if (entry.isCurrent) return entry.label;
        } else {
            const label = currentLabel(entry.entries);
            if (label) return label;
        }
    }
}
