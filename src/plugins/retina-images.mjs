// Show `name@2x.png` screenshots at half their pixel size, and serve the full-size
// file to high-resolution screens, so they stay sharp without taking more room.

import { readFileSync } from 'node:fs';

const RETINA = /@2x\.png$/i;

// Width and height from the PNG header.
function pngSize(file) {
    const buf = readFileSync(file);
    if (buf.toString('ascii', 12, 16) !== 'IHDR') throw new Error(`${file.pathname} is not a PNG`);
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

export default function retinaImages() {
    return ({ fileURL, sourceFormat }) => fileURL && {
        name: 'retina-images',
        element: {
            filter: ['img'],
            visit(node, ctx) {
                const src = node.properties?.src;
                if (typeof src !== 'string' || !RETINA.test(src) || /^([a-z]+:|\/)/i.test(src)) return;

                const { width, height } = pngSize(new URL(decodeURI(src), fileURL));
                ctx.setProperty(node, 'width', Math.floor(width / 2));
                ctx.setProperty(node, 'height', Math.floor(height / 2));
                // MDX splits `densities` from a string; Markdown hands it to getImage as is.
                ctx.setProperty(node, 'densities', sourceFormat === 'mdx' ? '1 2' : [1, 2]);
            }
        }
    };
}
