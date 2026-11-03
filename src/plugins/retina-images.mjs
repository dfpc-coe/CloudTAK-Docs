// Show `name@2x.png` screenshots at half their pixel size from the full-size file, so they
// stay sharp without taking more room. No srcset: with one, the browser reports the half
// size as the natural size, and image zoom would never open them any larger.

import { readFileSync } from 'node:fs';

const RETINA = /@2x\.png$/i;

// Width and height from the PNG header.
function pngSize(file) {
    const buf = readFileSync(file);
    if (buf.toString('ascii', 12, 16) !== 'IHDR') throw new Error(`${file.pathname} is not a PNG`);
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

export default function retinaImages() {
    return ({ fileURL }) => fileURL && {
        name: 'retina-images',
        element: {
            filter: ['img'],
            visit(node, ctx) {
                const src = node.properties?.src;
                if (typeof src !== 'string' || !RETINA.test(src) || /^([a-z]+:|\/)/i.test(src)) return;

                const { width, height } = pngSize(new URL(decodeURI(src), fileURL));
                ctx.setProperty(node, 'width', width);
                ctx.setProperty(node, 'height', height);
                ctx.setProperty(node, 'style', `width: ${Math.floor(width / 2)}px`);
            }
        }
    };
}
