// draw.mjs — build-time generator for entry.png (1024x1024, deterministic).
// Pure Node stdlib: renders a front-page-style image with a built-in 5x7 bitmap
// font and a hand-rolled PNG encoder (zlib). No network, no timestamps, no
// randomness: the same input always produces the same bytes.
// Run: node draw.mjs   (writes entry.png next to this file)

import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const W = 1024;
const H = 1024;

// ---------- palette ----------
const PAPER = [246, 241, 231];
const INK = [26, 26, 26];
const NAVY = [20, 33, 61];
const RED = [180, 35, 24];
const GOLD = [201, 162, 39];
const TEAL = [15, 118, 110];
const BLUE = [30, 64, 175];
const WHITE = [255, 255, 255];
const GREY = [90, 90, 90];
const CARD = [255, 255, 255];
const RULE = [200, 190, 170];

// ---------- pixel buffer ----------
const buf = Buffer.alloc(W * H * 3);
function px(x, y, c) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2];
}
function rect(x, y, w, h, c) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) px(i, j, c);
}
function circle(cx, cy, r, c) {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r) px(x, y, c);
    }
  }
}

// ---------- 5x7 bitmap font ('1' = on) ----------
const FONT = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ',': ['00000', '00000', '00000', '00000', '01100', '00100', '01000'],
  ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
  ';': ['00000', '01100', '01100', '00000', '01100', '00100', '01000'],
  "'": ['00100', '00100', '01000', '00000', '00000', '00000', '00000'],
  '-': ['00000', '00000', '00000', '01110', '00000', '00000', '00000'],
  '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
  '?': ['01110', '10001', '00001', '00010', '00100', '00000', '00100'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  '(': ['00010', '00100', '01000', '01000', '01000', '00100', '00010'],
  ')': ['01000', '00100', '00010', '00010', '00010', '00100', '01000'],
  '&': ['01100', '10010', '10100', '01000', '10101', '10010', '01101'],
  '%': ['11001', '11010', '00010', '00100', '01000', '01011', '10011'],
  '+': ['00000', '00100', '00100', '11111', '00100', '00100', '00000'],
  '=': ['00000', '00000', '11111', '00000', '11111', '00000', '00000'],
  '"': ['01010', '01010', '00000', '00000', '00000', '00000', '00000'],
  $: ['00100', '01111', '10100', '01110', '00101', '11110', '00100'],
  '|': ['00100', '00100', '00100', '00100', '00100', '00100', '00100'],
};

function charWidth(scale) { return 5 * scale + scale; } // 5 cols + 1 col gap
function textWidth(s, scale) {
  return s.length * charWidth(scale) - scale;
}
function drawChar(ch, x, y, scale, c) {
  const g = FONT[ch];
  if (!g) return;
  for (let r = 0; r < 7; r++) {
    for (let col = 0; col < 5; col++) {
      if (g[r][col] === '1') rect(x + col * scale, y + r * scale, scale, scale, c);
    }
  }
}
function drawText(s, x, y, scale, c) {
  let cx = x;
  for (const ch of s.toUpperCase()) { drawChar(ch, cx, y, scale, c); cx += charWidth(scale); }
  return cx;
}
function drawTextCentered(s, cx, y, scale, c) {
  drawText(s, cx - Math.floor(textWidth(s, scale) / 2), y, scale, c);
}
// Word-wrap: returns array of lines that fit maxW.
function wrap(s, scale, maxW) {
  const words = s.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (textWidth(t, scale) <= maxW) { cur = t; continue; }
    if (cur) lines.push(cur);
    cur = w;
  }
  if (cur) lines.push(cur);
  return lines;
}
function drawWrapped(s, x, y, scale, c, maxW, lineH) {
  const lines = wrap(s, scale, maxW);
  lines.forEach((ln, i) => drawText(ln, x, y + i * lineH, scale, c));
  return y + lines.length * lineH;
}

// ---------- layout ----------
rect(0, 0, W, H, PAPER);

// Masthead
rect(0, 0, W, 104, NAVY);
drawTextCentered('THE WORLD IN ONE DAY', W / 2, 16, 7, WHITE);
drawTextCentered('FRIDAY 20 NOVEMBER 2026', W / 2, 72, 3, GOLD);
rect(0, 104, W, 6, RED);

// Lead story: Trump defers the Iran war decision (left text, right calendar illustration)
const LX = 32, LW = 600;
drawText("MIDDLE EAST - THE DAY'S TOP STORY", LX, 128, 2, RED);
drawText('TRUMP DEFERS IRAN', LX, 156, 5, INK);
drawText('WAR DECISION TO 2027', LX, 196, 5, INK);
drawWrapped(
  "Trump tells Fox News there is no rush on a decision over war with Iran: the US will 'see what happens' after January 1. The hint came during his trip to China for the APEC summit.",
  LX, 252, 2, INK, LW, 18);
drawText('"WE WILL SEE WHAT HAPPENS AFTER JANUARY 1"', LX, 338, 2, RED);
rect(LX, 372, LW, 2, RULE);
drawText('FOX NEWS, IN CHINA  |  DECISION PUSHED TO 2027', LX, 384, 2, GREY);

// Lead illustration: a January 2027 calendar page, the 1st circled in red
const IX = 668, IY = 118, IW = 324, IH = 286;
rect(IX, IY, IW, 212, CARD);
rect(IX, IY, IW, 2, NAVY); rect(IX, IY, 2, 212, NAVY);
rect(IX + IW - 2, IY, 2, 212, NAVY); rect(IX, IY + 210, IW, 2, NAVY);
rect(IX, IY, IW, 40, RED);
drawTextCentered('JANUARY 2027', IX + IW / 2, IY + 13, 2, WHITE);
// calendar grid: 7 columns, 4 rows
const CW = IW / 7, CH = 43, GY = IY + 40;
for (let c = 1; c < 7; c++) rect(IX + Math.floor(c * CW), GY, 1, 172, RULE);
for (let r = 1; r < 4; r++) rect(IX, GY + r * CH, IW, 1, RULE);
for (let d = 1; d <= 28; d++) {
  const col = (d - 1) % 7, row = Math.floor((d - 1) / 7);
  const cx = IX + Math.floor(col * CW) + 8, cy = GY + row * CH + 8;
  if (d === 1) {
    circle(IX + Math.floor(col * CW + CW / 2), GY + row * CH + Math.floor(CH / 2), 17, RED);
    drawText('1', IX + Math.floor(col * CW + CW / 2) - 3, GY + row * CH + 12, 2, WHITE);
  } else {
    drawText(String(d), cx, cy, 1, GREY);
  }
}
// caption band under the calendar
rect(IX, IY + 212, IW, 74, NAVY);
drawTextCentered('DECISION DEFERRED', IX + IW / 2, IY + 226, 2, WHITE);
drawTextCentered('PAST 1 JANUARY 2027', IX + IW / 2, IY + 252, 2, GOLD);

// Divider
rect(32, 420, 960, 2, RULE);

// Story grid: 2 x 2 cards
const cards = [
  { x: 32, y: 436, kicker: 'WEATHER', kc: BLUE, head: 'CYCLONE AKVAN HITS ODISHA',
    body: "300,000 evacuated and 423 rescue teams deployed as the severe cyclone makes landfall on India's east coast.",
    icon: 'cyclone' },
  { x: 528, y: 436, kicker: 'JUSTICE', kc: TEAL, head: 'ICJ: MYANMAR COMMITTED GENOCIDE',
    body: 'The Hague rules 9-6 the 2017 crackdown was genocide, the first state ever found guilty. 10,000 were killed.',
    icon: 'scales' },
  { x: 32, y: 632, kicker: 'CULTURE', kc: RED, head: 'GTA VI SALES PASS $1.8BN',
    body: "Rockstar's blockbuster has already overtaken The Odyssey's global box-office run, a day after launch.",
    icon: 'pad' },
  { x: 528, y: 632, kicker: 'SPACE', kc: NAVY, head: 'HAYABUSA2 DROPS ASTEROID LANDING',
    body: "Engine trouble forces Japan's probe to scrap its asteroid landing and change course, JAXA says.",
    icon: 'probe' },
];
for (const card of cards) {
  rect(card.x, card.y, 464, 180, CARD);
  rect(card.x, card.y, 464, 2, card.kc);
  rect(card.x, card.y, 2, 180, card.kc);
  rect(card.x + 462, card.y, 2, 180, card.kc);
  rect(card.x, card.y + 178, 464, 2, card.kc);
  drawText(card.kicker, card.x + 16, card.y + 14, 2, card.kc);
  const headLines = wrap(card.head, 3, 380);
  headLines.slice(0, 2).forEach((ln, i) => drawText(ln, card.x + 16, card.y + 40 + i * 26, 3, INK));
  drawWrapped(card.body, card.x + 16, card.y + 40 + Math.min(headLines.length, 2) * 26 + 8, 2, INK, 432, 18);
  // icon, top-right 56x56
  const ox = card.x + 392, oy = card.y + 12;
  if (card.icon === 'cyclone') {
    circle(ox + 28, oy + 28, 24, BLUE);
    circle(ox + 28, oy + 28, 19, WHITE);
    circle(ox + 28, oy + 28, 14, BLUE);
    circle(ox + 28, oy + 28, 9, WHITE);
    circle(ox + 28, oy + 28, 4, BLUE);
  } else if (card.icon === 'scales') {
    rect(ox + 27, oy + 6, 2, 34, TEAL);
    rect(ox + 10, oy + 10, 36, 2, TEAL);
    rect(ox + 6, oy + 20, 12, 3, TEAL); rect(ox + 38, oy + 20, 12, 3, TEAL);
    rect(ox + 22, oy + 40, 12, 3, TEAL);
  } else if (card.icon === 'pad') {
    rect(ox + 4, oy + 14, 48, 24, INK);
    circle(ox + 16, oy + 26, 4, WHITE);
    circle(ox + 40, oy + 26, 4, GOLD);
    rect(ox + 34, oy + 20, 3, 3, RED); rect(ox + 43, oy + 20, 3, 3, RED);
    rect(ox + 34, oy + 29, 3, 3, RED); rect(ox + 43, oy + 29, 3, 3, RED);
  } else if (card.icon === 'probe') {
    circle(ox + 36, oy + 34, 13, GREY);
    circle(ox + 32, oy + 30, 4, [160, 160, 160]);
    rect(ox + 6, oy + 10, 16, 10, GOLD);
    rect(ox + 22, oy + 13, 8, 3, WHITE);
    rect(ox + 6, oy + 38, 12, 3, [180, 180, 180]);
  }
}

// Diplomacy strip
rect(32, 828, 960, 64, [16, 60, 66]);
circle(56, 860, 10, GOLD);
drawText('DIPLOMACY - EUROPE READY FOR TALKS WITH RUSSIA', 78, 840, 3, WHITE);
drawText('EU LEADERS SAY THEY ARE OPEN TO NEGOTIATIONS TO END THE WAR IN UKRAINE.', 78, 868, 2, [190, 220, 220]);

// Ticker
rect(0, 952, W, 72, [12, 12, 12]);
drawText('NORTH KOREA EXPANDS YONGBYON ENRICHMENT  |  HOUTHIS HIT RIYADH TOWER', 32, 966, 2, WHITE);
drawText("US-VENEZUELA RESTORE MILITARY TIES  |  ANTHROPIC $1.5TN  |  CHILDREN'S DAY", 32, 992, 2, [200, 200, 200]);

// ---------- PNG encode (deterministic: filter 0, zlib level 9) ----------
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  crcTable[n] = c >>> 0;
}
function crc32(b) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < b.length; i++) c = crcTable[(c ^ b[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'ascii'), data])), 8 + data.length);
  return out;
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
const raw = Buffer.alloc(H * (1 + W * 3));
for (let y = 0; y < H; y++) {
  raw[y * (1 + W * 3)] = 0;
  buf.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3);
}
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);
writeFileSync(new URL('./entry.png', import.meta.url), png);
console.log('wrote entry.png', png.length, 'bytes');
