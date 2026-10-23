import fs from "node:fs";
import zlib from "node:zlib"
const S = 32
const px = Buffer.alloc(S * S * 4)
const cx = 16, cy = 16, r = 13
for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
  const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy)
  const a = Math.max(0, Math.min(1, r - d + 0.5))
  const i = (y * S + x) * 4
  // soft mint-to-blue gradient dot
  px[i] = Math.round(110 + 20 * (y / S))
  px[i + 1] = Math.round(220 - 30 * (x / S))
  px[i + 2] = 250
  px[i + 3] = Math.round(a * 255)
}
const raw = Buffer.alloc(S * (S * 4 + 1))
for (let y = 0; y < S; y++) {
  raw[y * (S * 4 + 1)] = 0
  px.copy(raw, y * (S * 4 + 1) + 1, y * S * 4, (y + 1) * S * 4)
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const t = Buffer.from(type, "ascii")
  const body = Buffer.concat([t, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body) >>> 0)
  return Buffer.concat([len, body, crc])
}
let table = null
function crc32(buf) {
  if (!table) {
    table = []
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; table[n] = c >>> 0 }
  }
  let c = 0xffffffff
  for (const b of buf) c = table[(c ^ b) & 0xff] ^ (c >>> 8)
  return c ^ 0xffffffff
}
const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(S, 0); ihdr.writeUInt32BE(S, 4); ihdr[8] = 8; ihdr[9] = 6
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", zlib.deflateSync(raw)),
  chunk("IEND", Buffer.alloc(0)),
])
fs.writeFileSync("tray.png", png)
console.log("PNG", png.length, "bytes")
console.log(png.toString("base64"))
