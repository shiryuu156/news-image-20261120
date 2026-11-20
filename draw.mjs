// news-image-20261120 — fresh pixel renderer, written from scratch.
// Draws a 1024x1024 front-page image for Friday 20 November 2026.
// Pure Node stdlib: hand-built 5x7 bitmap letterforms + a small PNG writer.
// No network, no timestamps, no randomness — same bytes every run.

import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const W = 1024;
const H = 1024;

// ---------------------------------------------------------------- palette
const INK = {
  paper: [247, 242, 230],
  navy: [15, 27, 63],
  navySoft: [24, 40, 84],
  crimson: [178, 34, 34],
  scarlet: [196, 30, 30],
  gold: [212, 175, 55],
  black: [12, 12, 12],
  grey: [90, 86, 78],
  faint: [205, 198, 184],
  white: [255, 255, 255],
  blue: [30, 64, 175],
  teal: [13, 116, 110],
  tealDark: [10, 68, 68],
  rust: [176, 58, 32],
  slate: [100, 104, 112],
  dark: [18, 18, 18],
};

// ------------------------------------------------------- 5x7 letterforms
// Each glyph is 7 rows of 5 cells; '#' is a filled cell. Drawn by hand here.
const GLYPHS = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".####", "#....", "#....", "#....", "#....", "#....", ".####"],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".####", "#....", "#....", "#.###", "#...#", "#...#", ".###."],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: [".###.", "..#..", "..#..", "..#..", "..#..", "..#..", ".###."],
  J: ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  N: ["#...#", "##..#", "##..#", "#.#.#", "#..##", "#..##", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
  "0": [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "3": ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  "6": [".###.", "#....", "#....", "####.", "#...#", "#...#", ".###."],
  "7": ["#####", "....#", "...#.", "...#.", "..#..", "..#..", "..#.."],
  "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "....#", ".###."],
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
  ".": [".....", ".....", ".....", ".....", ".....", ".....", "..#.."],
  ",": [".....", ".....", ".....", ".....", ".....", "..#..", ".#..."],
  "'": ["..#..", "..#..", ".....", ".....", ".....", ".....", "....."],
  '"': [".#.#.", ".#.#.", ".....", ".....", ".....", ".....", "....."],
  ":": [".....", "..#..", ".....", ".....", ".....", "..#..", "....."],
  ";": [".....", "..#..", ".....", ".....", ".....", "..#..", ".#..."],
  "!": ["..#..", "..#..", "..#..", "..#..", "..#..", ".....", "..#.."],
  "?": [".###.", "#...#", "....#", "...#.", "..#..", ".....", "..#.."],
  $: ["..#..", ".####", "#.#.#", ".###.", "..#.#", "####.", "..#.."],
  "%": ["##..#", "##.#.", "....#", "...#.", "..#..", ".#...", "#..##"],
  "-": [".....", ".....", ".....", "#####", ".....", ".....", "....."],
  "(": ["...##", "..#..", ".#...", ".#...", ".#...", "..#..", "...##"],
  ")": ["##...", "..#..", "...#.", "...#.", "...#.", "..#..", "##..."],
  "/": ["....#", "....#", "...#.", "..#..", ".#...", "#....", "#...."],
  "&": [".##..", "#..#.", "#..#.", ".#...", "#.#.#", "#..#.", ".##.#"],
  "+": [".....", "..#..", "..#..", "#####", "..#..", "..#..", "....."],
  "=": [".....", ".....", "#####", ".....", "#####", ".....", "....."],
  "_": [".....", ".....", ".....", ".....", ".....", ".....", "#####"],
  "|": ["..#..", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
};

// ---------------------------------------------------------------- canvas
const px = new Uint8Array(W * H * 3);

function put(x, y, c) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = c[0];
  px[i + 1] = c[1];
  px[i + 2] = c[2];
}

function fill(x, y, w, h, c) {
  const x0 = Math.max(0, x);
  const y0 = Math.max(0, y);
  const x1 = Math.min(W, x + w);
  const y1 = Math.min(H, y + h);
  for (let yy = y0; yy < y1; yy++) {
    for (let xx = x0; xx < x1; xx++) put(xx, yy, c);
  }
}

function frame(x, y, w, h, c, t = 3) {
  fill(x, y, w, t, c);
  fill(x, y + h - t, w, t, c);
  fill(x, y, t, h, c);
  fill(x + w - t, y, t, h, c);
}

function disc(cx, cy, r, c) {
  for (let yy = -r; yy <= r; yy++) {
    for (let xx = -r; xx <= r; xx++) {
      if (xx * xx + yy * yy <= r * r) put(cx + xx, cy + yy, c);
    }
  }
}

function ring(cx, cy, r, thick, c) {
  const half = thick / 2;
  for (let yy = -r - 2; yy <= r + 2; yy++) {
    for (let xx = -r - 2; xx <= r + 2; xx++) {
      const d = Math.sqrt(xx * xx + yy * yy);
      if (Math.abs(d - r) <= half) put(cx + xx, cy + yy, c);
    }
  }
}

function line(x0, y0, x1, y1, c) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  for (let s = 0; s <= steps; s++) {
    put(Math.round(x0 + (dx * s) / steps), Math.round(y0 + (dy * s) / steps), c);
  }
}

// ------------------------------------------------------------------ text
function glyphFor(ch) {
  return GLYPHS[ch] ?? GLYPHS[" "];
}

function measure(text, s) {
  if (!text) return 0;
  return text.length * 6 * s - s;
}

function drawGlyph(ch, x, y, s, c) {
  const rows = glyphFor(ch);
  for (let r = 0; r < 7; r++) {
    for (let col = 0; col < 5; col++) {
      if (rows[r][col] === "#") fill(x + col * s, y + r * s, s, s, c);
    }
  }
}

function drawText(text, x, y, s, c) {
  const upper = String(text).toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    drawGlyph(upper[i], x + i * 6 * s, y, s, c);
  }
}

function drawCentred(text, cx, y, s, c) {
  drawText(text, cx - Math.floor(measure(text, s) / 2), y, s, c);
}

function wrapLines(text, maxW, s) {
  const words = String(text).toUpperCase().split(/\s+/).filter(Boolean);
  const out = [];
  let cur = "";
  for (const w of words) {
    const trial = cur ? cur + " " + w : w;
    if (measure(trial, s) <= maxW || !cur) {
      cur = trial;
    } else {
      out.push(cur);
      cur = w;
    }
  }
  if (cur) out.push(cur);
  return out;
}

function drawPara(text, x, y, maxW, s, leading, c) {
  const lines = wrapLines(text, maxW, s);
  lines.forEach((ln, i) => drawText(ln, x, y + i * leading, s, c));
  return lines.length;
}

// ------------------------------------------------------------- masthead
function drawMasthead() {
  fill(0, 0, W, 112, INK.navy);
  drawCentred("THE WORLD IN ONE DAY", W / 2, 24, 7, INK.white);
  drawCentred("FRIDAY 20 NOVEMBER 2026", W / 2, 82, 3, INK.gold);
  fill(0, 112, W, 6, INK.crimson);
}

// ------------------------------------------------------------ calendar
function drawCalendar(x, y, w) {
  const headerH = 34;
  const cellW = Math.floor(w / 7);
  const gridW = cellW * 7;
  const cellH = 44;
  const rows = 4;
  const gridY = y + headerH;
  const gridH = cellH * rows;
  const footY = gridY + gridH;

  fill(x, y, gridW, headerH, INK.crimson);
  drawCentred("JANUARY 2027", x + Math.floor(gridW / 2), y + 8, 2, INK.white);

  fill(x, gridY, gridW, gridH, INK.white);
  for (let c = 0; c <= 7; c++) fill(x + c * cellW, gridY, 1, gridH, INK.faint);
  for (let r = 0; r <= rows; r++) fill(x, gridY + r * cellH, gridW, 1, INK.faint);

  for (let d = 1; d <= 28; d++) {
    const col = (d - 1) % 7;
    const row = Math.floor((d - 1) / 7);
    const cx = x + col * cellW;
    const cy = gridY + row * cellH;
    if (d === 1) {
      disc(cx + Math.floor(cellW / 2), cy + Math.floor(cellH / 2), 17, INK.scarlet);
      drawText("1", cx + Math.floor(cellW / 2) - 5, cy + Math.floor(cellH / 2) - 7, 2, INK.white);
    } else {
      drawText(String(d), cx + 6, cy + 6, 2, INK.black);
    }
  }

  fill(x, footY, gridW, 56, INK.navy);
  drawCentred("DECISION DEFERRED", x + Math.floor(gridW / 2), footY + 8, 2, INK.white);
  drawCentred("PAST 1 JANUARY 2027", x + Math.floor(gridW / 2), footY + 30, 2, INK.gold);
  return footY + 56;
}

// ------------------------------------------------------------- lead story
function drawLead() {
  const lx = 32;
  const lw = 560;
  drawText("MIDDLE EAST - THE DAY'S TOP STORY", lx, 132, 2, INK.crimson);
  drawText("TRUMP DEFERS IRAN", lx, 160, 4, INK.black);
  drawText("WAR DECISION TO 2027", lx, 196, 4, INK.black);
  drawPara(
    "TRUMP TELLS FOX NEWS THERE IS NO RUSH ON A DECISION OVER WAR WITH IRAN: " +
      "THE US WILL 'SEE WHAT HAPPENS' AFTER JANUARY 1. THE HINT CAME DURING " +
      "HIS TRIP TO CHINA FOR THE APEC SUMMIT.",
    lx, 248, lw, 2, 20, INK.black
  );
  drawText('"WE WILL SEE WHAT HAPPENS AFTER JANUARY 1"', lx, 352, 2, INK.crimson);
  fill(lx, 382, lw, 2, INK.faint);
  drawText("FOX NEWS, IN CHINA | DECISION PUSHED TO 2027", lx, 392, 2, INK.grey);

  drawCalendar(620, 130, 372);
}

// ------------------------------------------------------------ story boxes
function cycloneIcon(cx, cy) {
  ring(cx, cy, 20, 4, INK.blue);
  ring(cx, cy, 13, 4, INK.blue);
  disc(cx, cy, 5, INK.blue);
}

function scalesIcon(cx, cy) {
  line(cx, cy - 18, cx, cy + 16, INK.teal);
  line(cx - 20, cy - 14, cx + 20, cy - 14, INK.teal);
  line(cx - 20, cy - 14, cx - 20, cy + 2, INK.teal);
  line(cx + 20, cy - 14, cx + 20, cy + 2, INK.teal);
  disc(cx - 20, cy + 6, 7, INK.teal);
  disc(cx + 20, cy + 6, 7, INK.teal);
  disc(cx, cy - 18, 4, INK.teal);
}

function controllerIcon(cx, cy) {
  fill(cx - 24, cy - 12, 48, 24, INK.dark);
  disc(cx - 12, cy, 4, INK.white);
  disc(cx + 12, cy, 4, INK.gold);
}

function asteroidIcon(cx, cy) {
  disc(cx + 6, cy, 14, INK.slate);
  fill(cx - 22, cy - 14, 10, 6, INK.gold);
  line(cx - 20, cy + 8, cx - 6, cy + 8, INK.slate);
}

function drawStoryBox(x, y, w, h, border, kicker, kickerColor, lines, body, icon) {
  fill(x, y, w, h, INK.white);
  frame(x, y, w, h, border, 3);
  const pad = 16;
  drawText(kicker, x + pad, y + 14, 2, kickerColor);
  lines.forEach((ln, i) => drawText(ln, x + pad, y + 40 + i * 24, 3, INK.black));
  drawPara(body, x + pad, y + 96, w - pad * 2, 2, 20, INK.black);
  if (icon) icon(x + w - 52, y + 36);
}

function drawGrid() {
  const bw = 464;
  const bh = 188;
  drawStoryBox(
    32, 424, bw, bh, INK.blue, "WEATHER", INK.blue,
    ["CYCLONE AKVAN HITS", "ODISHA"],
    "300,000 EVACUATED AND 423 RESCUE TEAMS DEPLOYED AS THE SEVERE CYCLONE " +
      "MAKES LANDFALL ON INDIA'S EAST COAST.",
    cycloneIcon
  );
  drawStoryBox(
    528, 424, bw, bh, INK.teal, "JUSTICE", INK.teal,
    ["ICJ: MYANMAR", "COMMITTED GENOCIDE"],
    "THE HAGUE RULES 9-6 THE 2017 CRACKDOWN WAS GENOCIDE, THE FIRST STATE " +
      "EVER FOUND GUILTY. 10,000 WERE KILLED.",
    scalesIcon
  );
  drawStoryBox(
    32, 628, bw, bh, INK.crimson, "CULTURE", INK.crimson,
    ["GTA VI SALES PASS", "$1.8BN"],
    "ROCKSTAR'S BLOCKBUSTER HAS ALREADY OVERTAKEN THE ODYSSEY'S GLOBAL " +
      "BOX-OFFICE RUN, A DAY AFTER LAUNCH.",
    controllerIcon
  );
  drawStoryBox(
    528, 628, bw, bh, INK.slate, "SPACE", INK.slate,
    ["HAYABUSA2 DROPS", "ASTEROID LANDING"],
    "ENGINE TROUBLE FORCES JAPAN'S PROBE TO SCRAP ITS ASTEROID LANDING AND " +
      "CHANGE COURSE, JAXA SAYS.",
    asteroidIcon
  );
}

// ------------------------------------------------- diplomacy + ticker
function drawDiplomacy() {
  fill(32, 832, 960, 76, INK.tealDark);
  disc(56, 870, 10, INK.gold);
  drawText("DIPLOMACY - EUROPE READY FOR TALKS WITH RUSSIA", 78, 846, 3, INK.white);
  drawText(
    "EU LEADERS SAY THEY ARE OPEN TO NEGOTIATIONS TO END THE WAR IN UKRAINE.",
    78, 880, 2, [214, 226, 224]
  );
}

function drawTicker() {
  fill(0, 924, W, 100, INK.dark);
  drawCentred(
    "NORTH KOREA EXPANDS YONGBYON ENRICHMENT  |  HOUTHIS HIT RIYADH TOWER",
    W / 2, 940, 2, INK.white
  );
  drawCentred(
    "US-VENEZUELA RESTORE MILITARY TIES  |  ANTHROPIC $1.5TN  |  CHILDREN'S DAY",
    W / 2, 972, 2, INK.white
  );
}

// ------------------------------------------------------------- PNG writer
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePng() {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    raw.set(px.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ------------------------------------------------------------------ main
fill(0, 0, W, H, INK.paper);
drawMasthead();
drawLead();
drawGrid();
drawDiplomacy();
drawTicker();

writeFileSync(join(HERE, "entry.png"), encodePng());
console.log("wrote entry.png", W + "x" + H);
