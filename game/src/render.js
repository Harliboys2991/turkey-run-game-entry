// Gobble Dash — every pixel, drawn in code. A dusk farmyard in parallax: sun,
// clouds, hills, a barn and a windmill, fences and pumpkins scrolling past, then
// the turkey, the farmer, the oven, the knives and the corn.

import { FIELD, TURKEY, PALETTE, FONT, PX_PER_METRE } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_ESCAPED = 'escaped';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function text(ctx, s, x, y, size, color, align = 'left', weight = 700) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
}

function outlineText(ctx, s, x, y, size, color, align = 'left', weight = 800) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.lineWidth = 7;
  ctx.strokeStyle = 'rgba(30, 10, 20, 0.85)';
  ctx.strokeText(s, x, y);
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}

export function drawWorld(ctx, world, screen, ui) {
  drawSky(ctx, world);
  drawScenery(ctx, world);
  drawGround(ctx, world);
  drawPickups(ctx, world);
  drawObstacles(ctx, world);
  drawFarmer(ctx, world, screen);
  drawTurkey(ctx, world, screen);
  drawParticles(ctx, world);
  if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) drawHud(ctx, world, ui);
  if (screen === SCREEN_TITLE) drawTitle(ctx, world, ui);
  if (screen === SCREEN_PAUSED) drawPaused(ctx);
  if (screen === SCREEN_CAUGHT) drawEnd(ctx, world, ui, false);
  if (screen === SCREEN_ESCAPED) drawEnd(ctx, world, ui, true);
}

function drawSky(ctx, world) {
  const g = ctx.createLinearGradient(0, 0, 0, FIELD.groundY);
  g.addColorStop(0, PALETTE.skyTop);
  g.addColorStop(0.45, PALETTE.skyMid);
  g.addColorStop(1, PALETTE.skyLow);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, FIELD.width, FIELD.groundY + 2);
  // Low sun, big and warm, with a halo.
  const sunX = 980;
  const sunY = 430;
  const halo = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 190);
  halo.addColorStop(0, PALETTE.sunGlow);
  halo.addColorStop(1, 'rgba(255, 190, 90, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(sunX - 200, sunY - 200, 400, 400);
  ctx.fillStyle = PALETTE.sun;
  ellipse(ctx, sunX, sunY, 58, 58);
  // Clouds drift with the road.
  const drift = (world.distance * PX_PER_METRE * 0.12) % 900;
  for (let i = 0; i < 4; i += 1) {
    const cx = ((i * 430 - drift) % 1400 + 1400) % 1400 - 60;
    const cy = 70 + i * 42;
    ctx.fillStyle = PALETTE.cloud;
    ellipse(ctx, cx, cy, 74, 20);
    ellipse(ctx, cx + 44, cy + 6, 52, 16);
    ellipse(ctx, cx - 48, cy + 8, 44, 14);
  }
}

function drawScenery(ctx, world) {
  const road = world.distance * PX_PER_METRE;
  // Far hills.
  ctx.fillStyle = PALETTE.hillFar;
  ctx.beginPath();
  ctx.moveTo(0, FIELD.groundY);
  for (let x = 0; x <= FIELD.width; x += 80) {
    const px = x - ((road * 0.15) % 640);
    const y = FIELD.groundY - 150 - Math.sin((px + 300) * 0.004) * 46;
    ctx.lineTo(px, y);
  }
  ctx.lineTo(FIELD.width, FIELD.groundY);
  ctx.closePath();
  ctx.fill();
  // Near hill with a barn and a windmill, looping every 1280 px.
  const barnX = 1280 - ((road * 0.3) % 1280);
  ctx.fillStyle = PALETTE.hillNear;
  ctx.beginPath();
  ctx.moveTo(0, FIELD.groundY);
  for (let x = 0; x <= FIELD.width; x += 80) {
    const px = x - ((road * 0.3) % 640);
    const y = FIELD.groundY - 84 - Math.sin((px + 90) * 0.006) * 30;
    ctx.lineTo(px, y);
  }
  ctx.lineTo(FIELD.width, FIELD.groundY);
  ctx.closePath();
  ctx.fill();
  drawBarn(ctx, barnX, FIELD.groundY - 78);
  drawWindmill(ctx, barnX + 420 > FIELD.width ? barnX - 860 : barnX + 420, FIELD.groundY - 60, world.time);
  // Fence posts scrolling at road speed.
  ctx.fillStyle = PALETTE.fence;
  const postGap = 130;
  const offset = road % postGap;
  for (let x = -offset; x < FIELD.width + postGap; x += postGap) {
    ctx.fillRect(x, FIELD.groundY - 66, 10, 66);
    ctx.fillRect(x - 4, FIELD.groundY - 72, 18, 8);
  }
  ctx.fillRect(0, FIELD.groundY - 58, FIELD.width, 6);
  ctx.fillRect(0, FIELD.groundY - 34, FIELD.width, 6);
}

function drawBarn(ctx, x, baseY) {
  ctx.fillStyle = PALETTE.barn;
  ctx.fillRect(x, baseY - 92, 150, 92);
  ctx.fillStyle = PALETTE.barnRoof;
  ctx.beginPath();
  ctx.moveTo(x - 10, baseY - 92);
  ctx.lineTo(x + 75, baseY - 138);
  ctx.lineTo(x + 160, baseY - 92);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = PALETTE.barnRoof;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x + 55, baseY - 92);
  ctx.lineTo(x + 55, baseY - 20);
  ctx.moveTo(x + 95, baseY - 92);
  ctx.lineTo(x + 95, baseY - 20);
  ctx.moveTo(x + 55, baseY - 56);
  ctx.lineTo(x + 95, baseY - 56);
  ctx.stroke();
  ctx.fillStyle = '#ffd27a';
  ctx.fillRect(x + 62, baseY - 84, 26, 20);
}

function drawWindmill(ctx, x, baseY, time) {
  ctx.strokeStyle = PALETTE.barn;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(x - 26, baseY);
  ctx.lineTo(x, baseY - 110);
  ctx.lineTo(x + 26, baseY);
  ctx.stroke();
  ctx.fillStyle = PALETTE.barnRoof;
  ctx.beginPath();
  ctx.moveTo(x - 16, baseY - 110);
  ctx.lineTo(x, baseY - 128);
  ctx.lineTo(x + 16, baseY - 110);
  ctx.closePath();
  ctx.fill();
  const a = time / 1.5;
  ctx.strokeStyle = '#e8d9b0';
  ctx.lineWidth = 5;
  for (let i = 0; i < 4; i += 1) {
    const ang = a + (i * Math.PI) / 2;
    ctx.beginPath();
    ctx.moveTo(x, baseY - 118);
    ctx.lineTo(x + Math.cos(ang) * 42, baseY - 118 + Math.sin(ang) * 42);
    ctx.stroke();
  }
}

function drawGround(ctx, world) {
  const g = ctx.createLinearGradient(0, FIELD.groundY, 0, FIELD.height);
  g.addColorStop(0, PALETTE.groundTop);
  g.addColorStop(1, PALETTE.ground);
  ctx.fillStyle = g;
  ctx.fillRect(0, FIELD.groundY, FIELD.width, FIELD.height - FIELD.groundY);
  ctx.fillStyle = PALETTE.grass;
  ctx.fillRect(0, FIELD.groundY, FIELD.width, 10);
  // Grass tufts and pebbles scrolling with the road.
  const road = world.distance * PX_PER_METRE;
  ctx.strokeStyle = PALETTE.grassDark;
  ctx.lineWidth = 3;
  for (let i = 0; i < 26; i += 1) {
    const x = ((i * 173 - road) % 1400 + 1400) % 1400 - 60;
    const y = FIELD.groundY + 22 + ((i * 53) % 66);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 4, y - 10);
    ctx.moveTo(x + 4, y);
    ctx.lineTo(x + 8, y - 12);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
  for (let i = 0; i < 14; i += 1) {
    const x = ((i * 251 - road) % 1400 + 1400) % 1400 - 60;
    const y = FIELD.groundY + 30 + ((i * 71) % 58);
    ellipse(ctx, x, y, 9, 4);
  }
}

function drawPickups(ctx, world) {
  for (const k of world.pickups) {
    const y = k.y + Math.sin(k.bob) * 5;
    if (k.kind === 'corn') drawCorn(ctx, k.x + k.size / 2, y + k.size / 2, k.size);
    if (k.kind === 'pie') drawPie(ctx, k.x + k.size / 2, y + k.size / 2, k.size);
    if (k.kind === 'feather') drawFeather(ctx, k.x + k.size / 2, y + k.size / 2, k.size, world.time);
  }
}

function drawCorn(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.5);
  ctx.fillStyle = PALETTE.cornHusk;
  ctx.beginPath();
  ctx.moveTo(-4, size / 2);
  ctx.lineTo(-16, size / 2 + 12);
  ctx.lineTo(-4, size / 2 + 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.corn;
  rr(ctx, -size / 2, -size / 2, size, size * 0.9, size / 2.4);
  ctx.fill();
  ctx.fillStyle = 'rgba(180, 120, 20, 0.7)';
  for (let r = -1; r <= 1; r += 1) {
    ctx.fillRect(-size / 2 + 5, r * 8, size - 10, 2);
  }
  ctx.restore();
}

function drawPie(ctx, x, y, size) {
  ctx.fillStyle = PALETTE.pie;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, size / 2, -0.4, 1.1);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e8b06a';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, size / 2 - 6, -0.4, 1.1);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#a83c2e';
  ellipse(ctx, x + 4, y + 2, 3, 3);
  ellipse(ctx, x + 10, y + 8, 3, 3);
}

function drawFeather(ctx, x, y, size, time) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.6 + Math.sin(time * 2) * 0.12);
  ctx.fillStyle = PALETTE.feather;
  ctx.beginPath();
  ctx.ellipse(0, 0, size / 3, size / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b3861e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -size / 2);
  ctx.lineTo(0, size / 2 + 8);
  ctx.stroke();
  ctx.restore();
}

function drawObstacles(ctx, world) {
  for (const o of world.obstacles) {
    if (o.kind === 'bale') drawBale(ctx, o);
    if (o.kind === 'fence') drawFence(ctx, o);
    if (o.kind === 'pumpkin') drawPumpkin(ctx, o);
    if (o.kind === 'mud') drawMud(ctx, o);
    if (o.kind === 'oven') drawOven(ctx, o, world.time);
    if (o.kind === 'knife') drawKnife(ctx, o, world.time);
  }
}

function drawBale(ctx, o) {
  ctx.fillStyle = '#c99a3c';
  ellipse(ctx, o.x + o.width / 2, o.y + o.height / 2, o.width / 2, o.height / 2);
  ctx.strokeStyle = '#8a6a1e';
  ctx.lineWidth = 3;
  ellipse(ctx, o.x + o.width / 2, o.y + o.height / 2, o.width / 2 - 8, o.height / 2 - 8);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(o.x + o.width / 2, o.y + o.height / 2, o.width / 2 - 18, o.height / 2 - 16, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawFence(ctx, o) {
  ctx.fillStyle = PALETTE.fence;
  ctx.fillRect(o.x + 4, o.y, 10, o.height);
  ctx.fillRect(o.x + o.width - 14, o.y, 10, o.height);
  ctx.fillRect(o.x, o.y + 12, o.width, 8);
  ctx.fillRect(o.x, o.y + o.height / 2, o.width, 8);
  ctx.fillStyle = '#8a5a30';
  ctx.fillRect(o.x + 2, o.y - 6, 14, 8);
  ctx.fillRect(o.x + o.width - 16, o.y - 6, 14, 8);
}

function drawPumpkin(ctx, o) {
  ctx.fillStyle = '#d96a1e';
  ellipse(ctx, o.x + o.width / 2, o.y + o.height / 2 + 6, o.width / 2, o.height / 2);
  ctx.strokeStyle = '#a84a10';
  ctx.lineWidth = 3;
  for (const dx of [-22, 0, 22]) {
    ctx.beginPath();
    ctx.ellipse(o.x + o.width / 2 + dx, o.y + o.height / 2 + 6, 12, o.height / 2 - 2, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#5e7a2e';
  ctx.fillRect(o.x + o.width / 2 - 3, o.y - 4, 7, 12);
  ctx.fillStyle = '#1e1410';
  ctx.beginPath();
  ctx.moveTo(o.x + o.width / 2 - 14, o.y + 16);
  ctx.lineTo(o.x + o.width / 2 - 6, o.y + 22);
  ctx.lineTo(o.x + o.width / 2 - 14, o.y + 28);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(o.x + o.width / 2 + 14, o.y + 16);
  ctx.lineTo(o.x + o.width / 2 + 6, o.y + 22);
  ctx.lineTo(o.x + o.width / 2 + 14, o.y + 28);
  ctx.closePath();
  ctx.fill();
}

function drawMud(ctx, o) {
  ctx.fillStyle = '#5d3a1e';
  ellipse(ctx, o.x + o.width / 2, o.y + o.height / 2, o.width / 2, o.height / 2);
  ctx.fillStyle = '#7a4a26';
  ellipse(ctx, o.x + o.width / 2 - 18, o.y + o.height / 2 - 2, 16, 5);
  ellipse(ctx, o.x + o.width / 2 + 22, o.y + o.height / 2 + 2, 12, 4);
  ctx.fillStyle = 'rgba(255, 220, 160, 0.5)';
  ellipse(ctx, o.x + o.width / 2 - 8, o.y + o.height / 2 - 3, 8, 3);
}

function drawOven(ctx, o, time) {
  const flicker = 0.75 + Math.sin(time * 9) * 0.25;
  ctx.fillStyle = PALETTE.ovenBody;
  rr(ctx, o.x, o.y, o.width, o.height, 8);
  ctx.fill();
  ctx.fillStyle = PALETTE.ovenBody;
  ctx.fillRect(o.x + o.width / 2 - 16, o.y - 26, 32, 28);
  // Glowing door.
  const glow = ctx.createRadialGradient(
    o.x + o.width / 2, o.y + o.height - 34, 4,
    o.x + o.width / 2, o.y + o.height - 34, 52,
  );
  glow.addColorStop(0, `rgba(255, 194, 60, ${0.9 * flicker})`);
  glow.addColorStop(1, 'rgba(255, 122, 38, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(o.x - 20, o.y + o.height - 90, o.width + 40, 90);
  ctx.fillStyle = PALETTE.ovenFire;
  rr(ctx, o.x + 18, o.y + o.height - 52, o.width - 36, 40, 6);
  ctx.fill();
  ctx.fillStyle = PALETTE.ovenGlow;
  rr(ctx, o.x + 26, o.y + o.height - 44, o.width - 52, 24, 4);
  ctx.fill();
  // Dials and a warning sign.
  ctx.fillStyle = '#dfe5ec';
  ellipse(ctx, o.x + 22, o.y + 18, 6, 6);
  ellipse(ctx, o.x + 42, o.y + 18, 6, 6);
  ctx.fillStyle = '#ffd27a';
  ctx.font = `800 13px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('HOT!', o.x + o.width / 2, o.y + 40);
  // Smoke puffs from the chimney.
  ctx.fillStyle = 'rgba(220, 220, 220, 0.4)';
  const puff = (time * 0.7) % 1;
  ellipse(ctx, o.x + o.width / 2 + Math.sin(time * 2) * 8, o.y - 34 - puff * 46, 8 + puff * 10, 7 + puff * 8);
}

function drawKnife(ctx, o, time) {
  ctx.save();
  ctx.translate(o.x + o.width / 2, o.y + o.height / 2);
  ctx.rotate(Math.sin(time * 6) * 0.06);
  // Motion streaks.
  ctx.strokeStyle = 'rgba(223, 229, 236, 0.5)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.moveTo(o.width / 2 + 8 + i * 12, -8 + i * 8);
    ctx.lineTo(o.width / 2 + 34 + i * 12, -8 + i * 8);
    ctx.stroke();
  }
  // Blade.
  ctx.fillStyle = PALETTE.knifeBlade;
  ctx.beginPath();
  ctx.moveTo(-o.width / 2 + 26, -9);
  ctx.lineTo(o.width / 2 - 6, -9);
  ctx.lineTo(o.width / 2 + 8, 0);
  ctx.lineTo(o.width / 2 - 6, 9);
  ctx.lineTo(-o.width / 2 + 26, 9);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.fillRect(-o.width / 2 + 30, -6, o.width - 52, 3);
  // Handle.
  ctx.fillStyle = PALETTE.knifeHandle;
  rr(ctx, -o.width / 2, -8, 26, 16, 6);
  ctx.fill();
  ctx.restore();
}

function drawTurkey(ctx, world, screen) {
  const p = world.player;
  const blink = p.invuln > 0 && Math.floor(world.time * 12) % 2 === 0;
  if (blink && screen === SCREEN_PLAY) return;
  const x = TURKEY.x;
  const y = p.y;
  const duck = p.ducking;
  const run = p.runPhase;
  const legSwing = p.onGround ? Math.sin(run * 2) * 10 : 6;
  ctx.save();
  ctx.translate(x, y);
  if (duck) ctx.scale(1.15, 0.62);
  // Tail fan.
  for (let i = 0; i < 5; i += 1) {
    const ang = -0.9 + i * 0.45;
    const len = 52 - Math.abs(i - 2) * 7;
    ctx.save();
    ctx.translate(16, 34);
    ctx.rotate(ang);
    ctx.fillStyle = PALETTE.turkeyTail[i];
    ctx.beginPath();
    ctx.ellipse(-len / 2 - 6, 0, len / 2, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 230, 170, 0.85)';
    ellipse(ctx, -len - 4, 0, 4, 4);
    ctx.restore();
  }
  // Legs.
  ctx.strokeStyle = PALETTE.turkeyLeg;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(34, 62);
  ctx.lineTo(34 + legSwing, 76);
  ctx.moveTo(48, 62);
  ctx.lineTo(48 - legSwing, 76);
  ctx.stroke();
  // Body.
  ctx.fillStyle = PALETTE.turkeyBody;
  ellipse(ctx, 42, 42, 34, 28);
  ctx.fillStyle = PALETTE.turkeyDark;
  ellipse(ctx, 42, 52, 26, 16);
  // Wing.
  ctx.fillStyle = '#a86438';
  ctx.save();
  ctx.translate(40, 40);
  ctx.rotate(p.onGround ? Math.sin(run * 2) * 0.12 : -0.5);
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, 12, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Head and neck.
  ctx.fillStyle = PALETTE.turkeyHead;
  ellipse(ctx, 70, 14, 13, 15);
  ctx.fillStyle = PALETTE.turkeyBody;
  ctx.fillRect(62, 22, 12, 16);
  // Beak.
  ctx.fillStyle = PALETTE.turkeyBeak;
  ctx.beginPath();
  ctx.moveTo(80, 10);
  ctx.lineTo(94, 15);
  ctx.lineTo(80, 20);
  ctx.closePath();
  ctx.fill();
  // Wattle.
  ctx.fillStyle = PALETTE.turkeyWattle;
  ellipse(ctx, 76, 26, 5, 8);
  // Eye.
  ctx.fillStyle = '#1e1410';
  ellipse(ctx, 73, 10, 3, 3.4);
  ctx.fillStyle = '#ffffff';
  ellipse(ctx, 74, 9, 1.2, 1.2);
  ctx.restore();
}

function drawFarmer(ctx, world, screen) {
  if (screen !== SCREEN_PLAY && screen !== SCREEN_PAUSED) return;
  const gap = world.farmerGap;
  // The farmer trails behind the turkey; he only shows once he is close.
  const fx = TURKEY.x - gap - 40;
  if (fx < -140) return;
  const run = world.time * 9;
  const bob = Math.abs(Math.sin(run)) * 6;
  const x = Math.max(fx, -60);
  const baseY = FIELD.groundY;
  ctx.save();
  ctx.translate(x, baseY - bob);
  // Legs pumping.
  ctx.strokeStyle = PALETTE.farmerPants;
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-8, -52);
  ctx.lineTo(-8 + Math.sin(run) * 14, 0);
  ctx.moveTo(8, -52);
  ctx.lineTo(8 - Math.sin(run) * 14, 0);
  ctx.stroke();
  // Body: plaid shirt and apron.
  ctx.fillStyle = PALETTE.farmerShirt;
  rr(ctx, -26, -108, 52, 60, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-26, -88);
  ctx.lineTo(26, -88);
  ctx.moveTo(-26, -68);
  ctx.lineTo(26, -68);
  ctx.stroke();
  ctx.fillStyle = PALETTE.farmerApron;
  rr(ctx, -18, -104, 36, 56, 6);
  ctx.fill();
  // Arms: one pumping, one holding the carving knife up.
  ctx.strokeStyle = PALETTE.farmerShirt;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-22, -96);
  ctx.lineTo(-38, -72 + Math.sin(run) * 8);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(22, -96);
  ctx.lineTo(44, -128);
  ctx.stroke();
  // Knife in the raised hand.
  ctx.fillStyle = PALETTE.knifeBlade;
  ctx.save();
  ctx.translate(46, -132);
  ctx.rotate(-0.5);
  ctx.fillRect(0, -8, 34, 7);
  ctx.restore();
  ctx.fillStyle = PALETTE.knifeHandle;
  ctx.fillRect(40, -140, 10, 9);
  // Head and straw hat.
  ctx.fillStyle = PALETTE.farmerSkin;
  ellipse(ctx, 0, -122, 15, 16);
  ctx.fillStyle = PALETTE.farmerHat;
  ellipse(ctx, 0, -134, 24, 7);
  ctx.fillRect(-8, -152, 16, 20);
  ctx.fillStyle = '#8a6a1e';
  ctx.fillRect(-8, -138, 16, 4);
  // Angry eyes and moustache.
  ctx.fillStyle = '#1e1410';
  ellipse(ctx, -6, -124, 2.4, 2.4);
  ellipse(ctx, 6, -124, 2.4, 2.4);
  ctx.strokeStyle = '#3a2a18';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-8, -114);
  ctx.lineTo(8, -114);
  ctx.stroke();
  ctx.restore();
  // Danger vignette when he is very close.
  if (gap < 120) {
    const pulse = 0.12 + Math.sin(world.time * 8) * 0.06;
    ctx.fillStyle = `rgba(232, 79, 61, ${pulse})`;
    ctx.fillRect(0, 0, 26, FIELD.height);
  }
}

function drawParticles(ctx, world) {
  for (const pt of world.particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, pt.life));
    ctx.translate(pt.x, pt.y);
    ctx.rotate(pt.spin);
    ctx.fillStyle = pt.color;
    if (pt.kind === 'leaf') {
      ctx.beginPath();
      ctx.ellipse(0, 0, pt.size, pt.size / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ellipse(ctx, 0, 0, pt.size, pt.size);
    }
    ctx.restore();
  }
}

function drawHud(ctx, world, ui) {
  // Top-left: score and distance.
  ctx.fillStyle = PALETTE.hudPanel;
  rr(ctx, 18, 16, 250, 84, 12);
  ctx.fill();
  text(ctx, `SCORE ${world.score}`, 34, 48, 26, PALETTE.hudText);
  text(ctx, `${Math.floor(world.distance)} m  ·  LV ${world.level}`, 34, 80, 18, PALETTE.hudMuted);
  // Top-right: hearts.
  ctx.fillStyle = PALETTE.hudPanel;
  rr(ctx, FIELD.width - 218, 16, 200, 52, 12);
  ctx.fill();
  for (let i = 0; i < 3; i += 1) {
    drawHeart(ctx, FIELD.width - 188 + i * 44, 42, i < world.lives);
  }
  // Farmer proximity bar, bottom-left.
  const frac = Math.max(0, Math.min(1, world.farmerGap / 340));
  ctx.fillStyle = PALETTE.hudPanel;
  rr(ctx, 18, FIELD.height - 52, 300, 34, 10);
  ctx.fill();
  text(ctx, 'FARMER', 30, FIELD.height - 28, 14, PALETTE.hudMuted);
  ctx.fillStyle = frac > 0.5 ? PALETTE.safe : frac > 0.25 ? '#e8a33c' : PALETTE.danger;
  rr(ctx, 96, FIELD.height - 42, 204 * frac, 14, 7);
  ctx.fill();
  // Mute state.
  if (ui.muted) text(ctx, 'MUTED (M)', FIELD.width - 24, FIELD.height - 24, 15, PALETTE.hudMuted, 'right');
  if (world.distance >= 940 && !world.over) {
    outlineText(ctx, 'THE FOREST GATE IS CLOSE — RUN!', FIELD.width / 2, 150, 30, PALETTE.title, 'center');
  }
}

function drawHeart(ctx, x, y, full) {
  ctx.fillStyle = full ? '#e84f3d' : 'rgba(255, 255, 255, 0.25)';
  ctx.beginPath();
  ctx.moveTo(x, y + 8);
  ctx.bezierCurveTo(x - 12, y - 4, x - 6, y - 14, x, y - 6);
  ctx.bezierCurveTo(x + 6, y - 14, x + 12, y - 4, x, y + 8);
  ctx.fill();
}

function drawTitle(ctx, world, ui) {
  ctx.fillStyle = 'rgba(20, 8, 20, 0.42)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  outlineText(ctx, 'GOBBLE DASH', FIELD.width / 2, 190, 92, PALETTE.title, 'center', 900);
  outlineText(ctx, 'THE GREAT THANKSGIVING ESCAPE', FIELD.width / 2, 242, 30, '#fff3d9', 'center');
  text(ctx, 'The farmer wants you for dinner. The oven is hot. The knives are flying.', FIELD.width / 2, 292, 20, PALETTE.hudMuted, 'center', 400);
  text(ctx, 'Reach the forest gate at 1000 m — and stay ahead of the farmer.', FIELD.width / 2, 322, 20, PALETTE.hudMuted, 'center', 400);
  // Controls card.
  ctx.fillStyle = PALETTE.panel;
  rr(ctx, FIELD.width / 2 - 300, 360, 600, 132, 14);
  ctx.fill();
  text(ctx, 'SPACE / ↑  jump          ↓  duck under knives', FIELD.width / 2, 402, 20, PALETTE.hudText, 'center', 600);
  text(ctx, 'Grab corn to slow the farmer  ·  P pause  ·  M mute', FIELD.width / 2, 438, 20, PALETTE.hudText, 'center', 600);
  text(ctx, 'Click or tap also jumps', FIELD.width / 2, 474, 18, PALETTE.hudMuted, 'center', 400);
  const blink = Math.floor(world.time * 2) % 2 === 0;
  if (blink) outlineText(ctx, 'PRESS SPACE OR CLICK TO START', FIELD.width / 2, 566, 28, '#ffffff', 'center');
  if (ui.best > 0) text(ctx, `BEST SCORE: ${ui.best}`, FIELD.width / 2, 616, 20, PALETTE.title, 'center');
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(20, 8, 20, 0.55)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  outlineText(ctx, 'PAUSED', FIELD.width / 2, FIELD.height / 2 - 10, 64, '#ffffff', 'center', 900);
  text(ctx, 'Press P or click to carry on', FIELD.width / 2, FIELD.height / 2 + 34, 20, PALETTE.hudMuted, 'center', 400);
}

function drawEnd(ctx, world, ui, escaped) {
  ctx.fillStyle = escaped ? 'rgba(20, 50, 20, 0.55)' : 'rgba(60, 8, 8, 0.6)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  if (escaped) {
    outlineText(ctx, 'ESCAPED!', FIELD.width / 2, 220, 88, '#8fe388', 'center', 900);
    text(ctx, 'Through the forest gate — no Thanksgiving dinner today.', FIELD.width / 2, 272, 22, '#e8ffd9', 'center', 400);
  } else {
    outlineText(ctx, 'CAUGHT!', FIELD.width / 2, 220, 88, '#ff8a7a', 'center', 900);
    text(ctx, world.overReason, FIELD.width / 2, 272, 22, '#ffd9d0', 'center', 400);
  }
  ctx.fillStyle = PALETTE.panel;
  rr(ctx, FIELD.width / 2 - 260, 310, 520, 150, 14);
  ctx.fill();
  text(ctx, `SCORE  ${world.score}`, FIELD.width / 2, 362, 30, PALETTE.hudText, 'center');
  text(ctx, `DISTANCE  ${Math.floor(world.distance)} m    CORN  ${world.stats.corn}    JUMPS  ${world.stats.jumps}`, FIELD.width / 2, 402, 19, PALETTE.hudMuted, 'center', 600);
  const isBest = world.score >= ui.best && world.score > 0;
  text(ctx, isBest ? 'NEW BEST SCORE!' : `BEST  ${ui.best}`, FIELD.width / 2, 438, 20, PALETTE.title, 'center');
  const blink = Math.floor(world.time * 2) % 2 === 0;
  if (blink) outlineText(ctx, 'PRESS R OR CLICK TO RUN AGAIN', FIELD.width / 2, 540, 26, '#ffffff', 'center');
}
