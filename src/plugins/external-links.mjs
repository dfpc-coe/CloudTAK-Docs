// Open links that leave the documentation site in a new tab.

export default function externalLinks(site) {
    return {
        name: 'external-links',
        element: {
            filter: ['a'],
            visit(node, ctx) {
                const href = node.properties?.href;
                if (typeof href !== 'string' || !/^(https?:)?\/\//.test(href) || href.startsWith(site)) return;
                ctx.setProperty(node, 'target', '_blank');
                ctx.setProperty(node, 'rel', 'noopener');
            }
        }
    };
}
