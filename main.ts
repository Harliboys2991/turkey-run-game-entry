// Gobble Dash — the program the bounty runs (Node 22, standard library only).
//
// It hands in the game: the static files under game/ and the screenshots under
// screenshots/ are copied into the output directory, and a dossier.json is
// written beside them with the vendored make.fun library, summarising the game
// for the judge. Nothing here fetches anything over the network and nothing is
// generated at run time: the game and its screenshots are already in this repo.
//
//   Serve it locally:  node serve.ts, then open http://localhost:8080.
//   Dry run outside the grader:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// dossier's bytes; the rest refuse an entry the scorer would refuse — more than
// 4 screenshots or one over 256 KiB, more than 993 files in game/ or 48 MiB of
// game files in all, or a path under game/ over 1000 bytes.
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function countFiles(dir) {
  let total = 0;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    total += statSync(path).isDirectory() ? countFiles(path) : 1;
  }
  return total;
}

function handIn() {
  mkdirSync(outDir, { recursive: true });

  const gameDir = join(repoRoot, 'game');
  cpSync(gameDir, join(outDir, 'game'), { recursive: true });

  const shotsDir = join(outDir, 'screenshots');
  mkdirSync(shotsDir, { recursive: true });
  const repoShots = join(repoRoot, 'screenshots');
  if (existsSync(repoShots)) cpSync(repoShots, shotsDir, { recursive: true });

  const dossier = buildDossier(outDir, CAPS);
  writeFileSync(join(outDir, 'dossier.json'), dossier);

  const shotCount = existsSync(shotsDir) ? readdirSync(shotsDir).length : 0;
  console.log(
    `Gobble Dash handed in: ${countFiles(gameDir)} game files, ` +
      `${shotCount} screenshots, dossier ${dossier.length} bytes -> ${outDir}`,
  );
}

handIn();
