// news-image-20261120 entry (Node 22, standard library only).
// The image is drawn at build time by draw.mjs into entry.png (1024x1024,
// under 1 MiB, fully deterministic). This program copies it to the output
// directory the grader provides, so both graded runs write identical bytes.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
copyFileSync(new URL('./entry.png', import.meta.url), join(outDir, 'entry.png'));
