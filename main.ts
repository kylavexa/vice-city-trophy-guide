// Sunset Platinum — the entry program (Node 22, standard library only).
// It hands the guide in: copy this repository's app/ and screenshots/ into the
// output directory and write dossier.json with the kit's vendored library, so the
// judge can read the screenshots, the first-load totals and the source outline.
// vendor/makefun-frontend.ts is the kit's copy and stays untouched: the scorer
// rebuilds the dossier with its own copy and the two must match byte for byte.
//
// Run it outside the grader with MAKEFUN_OUTPUT_DIR standing in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps: at most 4 screenshots of at most 256 KiB each, app/ at
// most 993 files and directories and 48 MiB in all. The dossier text is capped
// at 163,840 bytes; anything over that is left out of the judge's outline.
// The program runs twice in the grader and must write the same bytes both
// times: it copies files as they are and buildDossier is deterministic, so the
// two runs match.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
