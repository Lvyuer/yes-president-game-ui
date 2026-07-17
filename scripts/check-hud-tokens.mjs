import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED = [
  '--yp-hud-aspect',
  '--yp-hud-stage-pad',
  '--yp-hud-safe-x',
  '--yp-hud-safe-top',
  '--yp-hud-safe-bottom',
  '--yp-hud-top-gap',
  '--yp-hud-top-time-min-w',
  '--yp-hud-top-time-max-w',
  '--yp-hud-top-time-min-h',
  '--yp-hud-top-fade',
  '--yp-hud-dock-max-w',
  '--yp-hud-dock-w',
  '--yp-hud-dock-gap',
  '--yp-hud-dock-btn-min-h',
  '--yp-hud-dock-pad-top',
  '--yp-hud-dock-fade',
  '--yp-hud-break-narrow',
];

const tokensPath = join(root, 'src/styles/tokens.css');
const tokensCss = readFileSync(tokensPath, 'utf8');

const missingDefs = REQUIRED.filter((name) => !tokensCss.includes(`${name}:`));
if (missingDefs.length) {
  console.error('Missing HUD token definitions in tokens.css:', missingDefs.join(', '));
  process.exit(1);
}

const consumers = [
  'playground/main-loop/MainLoopShell.vue',
  'playground/main-loop/MainHud.vue',
  'playground/main-loop/MainActions.vue',
];

const expectedRefs = {
  'playground/main-loop/MainLoopShell.vue': [
    '--yp-hud-stage-pad',
    '--yp-hud-aspect',
    '--yp-hud-safe-x',
    '--yp-hud-safe-top',
    '--yp-hud-safe-bottom',
    '--yp-hud-top-fade',
    '--yp-hud-dock-pad-top',
    '--yp-hud-dock-fade',
  ],
  'playground/main-loop/MainHud.vue': [
    '--yp-hud-top-gap',
    '--yp-hud-top-time-min-w',
    '--yp-hud-top-time-max-w',
    '--yp-hud-top-time-min-h',
  ],
  'playground/main-loop/MainActions.vue': [
    '--yp-hud-dock-max-w',
    '--yp-hud-dock-w',
    '--yp-hud-dock-gap',
    '--yp-hud-dock-btn-min-h',
  ],
};

let failed = false;
for (const rel of consumers) {
  const src = readFileSync(join(root, rel), 'utf8');
  const missing = expectedRefs[rel].filter((name) => !src.includes(`var(${name})`));
  if (missing.length) {
    console.error(`${rel} missing var() refs:`, missing.join(', '));
    failed = true;
  }
}

if (failed) process.exit(1);
console.log('HUD tokens OK:', REQUIRED.length, 'defs;', consumers.length, 'consumers checked');
