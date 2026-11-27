// Gobble Dash — boot and the game loop. A fixed-step simulation with a
// requestAnimationFrame renderer, a screen state machine (title, play, paused,
// caught, escaped), and a ?shot= mode that stages one deterministic frame for
// screenshots instead of playing.

import { FIELD, STEP, BEST_KEY } from './config.js';
import { World, EVENT_HIT, EVENT_PICKUP, EVENT_OVER, EVENT_LEVEL } from './world.js';
import { drawWorld, SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_CAUGHT, SCREEN_ESCAPED } from './render.js';
import { Input } from './input.js';
import { Sounds } from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const world = new World(20261127);
const input = new Input(canvas);
const sounds = new Sounds();

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const best = Number(localStorage.getItem(BEST_KEY) || 0) || 0;

const ui = { best, muted: false };

let screen = SCREEN_TITLE;
let accumulator = 0;
let lastTime = 0;
let shotDone = false;

input.onFirstGesture = () => sounds.ensure();

function saveBest() {
  if (world.score > ui.best) {
    ui.best = world.score;
    try {
      localStorage.setItem(BEST_KEY, String(ui.best));
    } catch {
      // Private mode: the best score just does not persist.
    }
  }
}

function startRun() {
  world.reset();
  world.attract = false;
  screen = SCREEN_PLAY;
  sounds.ensure();
  sounds.gobble();
}

function backToTitle() {
  world.reset();
  world.attract = true;
  screen = SCREEN_TITLE;
}

function frame(time) {
  const dt = Math.min(0.1, (time - lastTime) / 1000 || 0);
  lastTime = time;
  const pressed = input.take();

  if (pressed.mute) {
    ui.muted = !ui.muted;
    sounds.muted = ui.muted;
  }

  if (screen === SCREEN_TITLE) {
    world.attract = true;
    accumulator += dt;
    while (accumulator >= STEP) {
      world.step(STEP, { jump: false, jumpHeld: false, duck: false });
      accumulator -= STEP;
    }
    if (pressed.jump || pressed.clicked || pressed.start) startRun();
  } else if (screen === SCREEN_PLAY) {
    if (pressed.pause) {
      screen = SCREEN_PAUSED;
    } else {
      const held = input.held();
      const wasGround = world.player.onGround;
      const stepInput = { jump: pressed.jump, jumpHeld: held.jumpHeld, duck: held.duck };
      accumulator += dt;
      while (accumulator >= STEP) {
        const events = world.step(STEP, stepInput);
        stepInput.jump = false;
        accumulator -= STEP;
        if (events & EVENT_HIT) sounds.hit();
        if (events & EVENT_PICKUP) sounds.coin();
        if (events & EVENT_LEVEL) sounds.level();
        if (events & EVENT_OVER) {
          saveBest();
          screen = world.over === 'escaped' ? SCREEN_ESCAPED : SCREEN_CAUGHT;
          if (world.over === 'escaped') sounds.win();
          else sounds.lose();
          break;
        }
      }
      if (pressed.jump && wasGround) sounds.jump();
    }
  } else if (screen === SCREEN_PAUSED) {
    if (pressed.pause || pressed.clicked) screen = SCREEN_PLAY;
  } else if (screen === SCREEN_CAUGHT || screen === SCREEN_ESCAPED) {
    if (pressed.restart || pressed.jump || pressed.clicked) startRun();
  }

  drawWorld(ctx, world, screen, ui);
  if (!shotDone) requestAnimationFrame(frame);
}

function fitCanvas() {
  const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
  canvas.style.width = `${Math.floor(FIELD.width * scale)}px`;
  canvas.style.height = `${Math.floor(FIELD.height * scale)}px`;
}

window.addEventListener('resize', fitCanvas);
fitCanvas();

if (shotName) {
  // Screenshot mode: stage one deterministic frame and draw it once.
  const staged = stageShot(shotName, world);
  screen = staged.screen;
  ui.best = staged.best;
  drawWorld(ctx, world, screen, ui);
  shotDone = true;
  document.title = `shot:${shotName}`;
} else {
  world.attract = true;
  requestAnimationFrame((t) => {
    lastTime = t;
    requestAnimationFrame(frame);
  });
}
