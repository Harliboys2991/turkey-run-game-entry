// The screenshot scenes behind ?shot=title|play|oven|escaped. Each one plays the
// real rules forward from a fresh world for a fixed number of steps, steered by a
// simple autopilot, so the frame is what a short game really looks like and the
// same seed always gives the same frame.

import { STEP, FIELD } from './config.js';
import { EVENT_OVER } from './world.js';
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_CAUGHT, SCREEN_ESCAPED } from './render.js';

/**
 * The autopilot's jump timing, worked out from the jump arc (jump speed 1050,
 * gravity 2300: the turkey is above an oven's top from 0.11 s to 0.80 s after
 * take-off). It jumps when the nearest ground obstacle is about 0.21 s of road
 * away, and ducks while a knife is close. Ground corn is collected for free;
 * the pilot never chases the high corn, it just jumps the obstacles.
 */
function autopilot(world) {
  const p = world.player;
  const front = 230 + 13 + 58; // turkey hitbox front edge
  const back = 230 + 13; // turkey hitbox back edge: an obstacle matters until it passes this
  let jump = false;
  let duck = false;
  for (const o of world.obstacles) {
    if (o.x + o.width < back || o.x > 1000) continue;
    if (o.kind === 'knife') {
      if (o.x < 620) duck = true;
    } else if (p.onGround && !duck) {
      const gapPx = o.x - front;
      if (gapPx > 0 && gapPx < world.speed * 0.21) jump = true;
    }
  }
  if (jump && duck) jump = false;
  // Hold the jump through the rise, or the variable-height cut clamps every
  // hop to 22 px and nothing is cleared.
  const jumpHeld = jump || (!p.onGround && p.vy < 0);
  return { jump, jumpHeld, duck };
}

/**
 * Set `world` to the named scene and return the screen to draw over it.
 * Scenes: title, play, oven (a late run with the oven and a knife in frame),
 * escaped (the win screen after a full 1000 m run).
 */
export function stageShot(name, world) {
  world.reset();
  world.attract = false;
  if (name === 'title') {
    world.attract = true;
    for (let i = 0; i < 5 / STEP; i += 1) world.step(STEP, { jump: false, jumpHeld: false, duck: false });
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'escaped') {
    for (let i = 0; i < 1500 / STEP; i += 1) {
      const ev = world.step(STEP, autopilot(world));
      if (ev & EVENT_OVER) break;
    }
    return { screen: world.over === 'escaped' ? SCREEN_ESCAPED : SCREEN_CAUGHT, best: world.score };
  }
  if (name === 'oven') {
    // Play until an oven is mid-screen, then freeze the frame with the turkey
    // in the air over it. (A knife can never share the frame: the spawner
    // never puts a knife behind another obstacle, so the scene is the oven.)
    for (let i = 0; i < 600 / STEP; i += 1) {
      const ev = world.step(STEP, autopilot(world));
      if (ev & EVENT_OVER) break;
      const oven = world.obstacles.find((o) => o.kind === 'oven' && o.x > 320 && o.x < 620);
      if (oven) {
        // Freeze when the oven is right under the jumping turkey.
        for (let j = 0; j < 60; j += 1) {
          world.step(STEP, autopilot(world));
          const airborne = world.player.y < FIELD.groundY - 78 - 10;
          const near = oven.x > 230 && oven.x < 340;
          if (airborne && near) break;
        }
        break;
      }
    }
    return { screen: world.over === 'escaped' ? SCREEN_ESCAPED : world.over ? SCREEN_CAUGHT : SCREEN_PLAY, best: world.score };
  }
  // play: a mid-run frame, about 24 seconds in, pilot keeping all its lives.
  for (let i = 0; i < 24 / STEP; i += 1) {
    const ev = world.step(STEP, autopilot(world));
    if (ev & EVENT_OVER) break;
  }
  return { screen: world.over ? SCREEN_CAUGHT : SCREEN_PLAY, best: world.score };
}
