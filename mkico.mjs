// Build a Windows .ico from docs/icon.png (Vista+ PNG-in-ICO container).
// Usage: node mkico.mjs [sourcePng] [outIco]
import fs from "node:fs";
import path from "node:path";

const src = process.argv[2] || path.join("docs", "icon.png");
const out = process.argv[3] || path.join("build", "icon.ico");

const png = fs.readFileSync(src);

// PNG IHDR: width/height are big-endian uint32 at offsets 16 and 20
if (png.toString("ascii", 1, 4) !== "PNG") {
  throw new Error(`${src} is not a PNG file`);
}
const w = png.readUInt32BE(16);
const h = png.readUInt32BE(20);
const dim = w > 255 || h > 255 ? 0 : w;

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(1, 4); // image count

const entry = Buffer.alloc(16);
entry.writeUInt8(dim, 0); // width  (0 = 256+)
entry.writeUInt8(dim, 1); // height
entry.writeUInt8(0, 2); // palette colours
entry.writeUInt8(0, 3); // reserved
entry.writeUInt16LE(1, 4); // colour planes
entry.writeUInt16LE(32, 6); // bits per pixel
entry.writeUInt32LE(png.length, 8); // payload size
entry.writeUInt32LE(6 + 16, 12); // payload offset

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, Buffer.concat([header, entry, png]));
console.log(`icon: ${src} (${w}x${h}) -> ${out} (${fs.statSync(out).size} bytes)`);
