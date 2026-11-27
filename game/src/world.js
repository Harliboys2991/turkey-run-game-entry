// Gobble Dash — the simulation. A fixed-step world: a turkey sprints through a
// farmyard at dusk, the farmer closing in from behind, the oven and the carving
// knives in the way, corn to grab, and the forest gate 1000 m ahead.

import {
  FIELD, STEP, TURKEY, LIVES, FARMER, ESCAPE_DISTANCE, SPEED, LEVEL,
  PX_PER_METRE, OBSTACLE, PICKUP, PALETTE,
} from './config.js';
import { makeRandom, pickWeighted } from './random.js';

export const EVENT_NONE = 0;
export const EVENT_HIT = 1;
export const EVENT_PICKUP = 2;
export const EVENT_OVER = 4;
export const EVENT_LEVEL = 8;

/** Spawn tables per level: [weight, kind]. Knives join at level 2, ovens at level 3. */
function spawnTable(level) {
  const table = [
    [2, 'bale'],
    [2, 'fence'],
    [2, 'pumpkin'],
    [2, 'mud'],
    [4, 'cornArc'],
    [1, 'pie'],
  ];
  if (level >= 2) table.push([3, 'knife']);
  if (level >= 3) table.push([2, 'oven']);
  if (level >= 4) table.push([1, 'feather']);
  return table;
}

export class World {
  constructor(seed = 20261127) {
    this.seed = seed;
    this.reset();
  }

  reset() {
    this.rng = makeRandom(this.seed);
    this.time = 0;
    this.distance = 0;
    this.score = 0;
    this.bonus = 0;
    this.lives = LIVES;
    this.level = 1;
    this.speed = SPEED.base;
    this.farmerGap = FARMER.startGap;
    this.over = null;
    this.overReason = '';
    /** Attract mode: the turkey runs across the farm with no danger, behind the title screen. */
    this.attract = false;
    this.spawnTimer = 1.1;
    this.slowTimer = 0;
    this.lastObstacleAt = -10;
    this.lastObstacleKind = '';
    this.obstacles = [];
    this.pickups = [];
    this.particles = [];
    this.leafTimer = 0;
    this.player = {
      y: FIELD.groundY - TURKEY.height,
      vy: 0,
      onGround: true,
      ducking: false,
      coyote: 0,
      /** A jump pressed just before landing still fires: 0.12 s of grace. */
      jumpBuffer: 0,
      invuln: 0,
      runPhase: 0,
      hops: 0,
    };
    this.stats = { jumps: 0, corn: 0, hits: 0 };
  }

  get groundTop() {
    return FIELD.groundY - this.playerHeight();
  }

  playerHeight() {
    return this.player.ducking ? TURKEY.duckHeight : TURKEY.height;
  }

  playerBox() {
    return {
      x: TURKEY.x + TURKEY.hitDx,
      y: this.player.y,
      width: TURKEY.hitWidth,
      height: this.playerHeight(),
    };
  }

  /** One fixed step. `input` is { jump, jumpHeld, duck }. Returns an event mask. */
  step(dt, input) {
    if (this.over) return EVENT_NONE;
    let events = EVENT_NONE;
    const p = this.player;
    this.time += dt;

    const nextLevel = Math.min(LEVEL.max, Math.floor(this.distance / LEVEL.metres) + 1);
    if (nextLevel !== this.level) {
      this.level = nextLevel;
      events |= EVENT_LEVEL;
    }
    const targetSpeed = Math.min(SPEED.max, SPEED.base + (this.level - 1) * SPEED.perLevel);
    this.speed = this.slowTimer > 0 ? targetSpeed * 0.55 : targetSpeed;
    if (this.slowTimer > 0) this.slowTimer -= dt;

    this.distance += (this.speed * dt) / PX_PER_METRE;
    this.score = Math.floor(this.distance) + this.bonus;
    if (this.distance >= ESCAPE_DISTANCE) {
      this.over = 'escaped';
      this.overReason = 'The forest gate! The turkey made it out.';
      return events | EVENT_OVER;
    }

    // --- turkey physics -------------------------------------------------
    const wasGround = p.onGround;
    p.ducking = Boolean(input.duck) && p.onGround;
    // Ducking shrinks the hitbox: re-seat the feet on the ground at once, or
    // the turkey sinks into the ground for a step and the knife still clips it.
    if (p.onGround) p.y = FIELD.groundY - this.playerHeight();
    if (input.jump) p.jumpBuffer = 0.12;
    else p.jumpBuffer -= dt;
    if (p.jumpBuffer > 0 && (p.onGround || p.coyote > 0)) {
      p.vy = -TURKEY.jumpSpeed;
      p.onGround = false;
      p.coyote = 0;
      p.jumpBuffer = 0;
      p.hops += 1;
      this.stats.jumps += 1;
    }
    if (!input.jumpHeld && p.vy < -320) p.vy = -320;
    p.vy += TURKEY.gravity * dt;
    p.y += p.vy * dt;
    if (p.y >= FIELD.groundY - this.playerHeight()) {
      p.y = FIELD.groundY - this.playerHeight();
      p.vy = 0;
      p.onGround = true;
    } else {
      p.onGround = false;
    }
    if (wasGround && !p.onGround) p.coyote = TURKEY.coyote;
    else if (p.onGround) p.coyote = TURKEY.coyote;
    else p.coyote -= dt;
    if (p.onGround) p.runPhase += dt * this.speed * 0.045;
    if (p.invuln > 0) p.invuln -= dt;

    // --- spawning -------------------------------------------------------
    // The gap between obstacles must exceed one jump's road: a jump covers
    // 0.91 s of road, and the turkey lands 0.70 s after the jumped obstacle
    // passes, so a tighter gap lands it straight into the next one.
    if (this.attract) {
      // No spawning, no collisions, no farmer: just run and scatter leaves.
      this.spawnTimer = 1;
    } else {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawn();
        const gap = Math.max(0.9, 1.25 - this.level * 0.04) * (0.9 + this.rng() * 0.3);
        this.spawnTimer = gap;
      }
    }

    // --- obstacles ------------------------------------------------------
    const box = this.playerBox();
    for (let i = this.obstacles.length - 1; i >= 0; i -= 1) {
      const o = this.obstacles[i];
      o.x -= (this.speed + (o.kind === 'knife' ? 260 : 0)) * dt;
      if (o.x < -180) {
        this.obstacles.splice(i, 1);
        continue;
      }
      if (o.kind === 'mud' && p.onGround && this.overlaps(box, o) && p.invuln <= 0) {
        this.slowTimer = 0.8;
        this.farmerGap = Math.max(0, this.farmerGap - 30);
        o.spent = true;
        this.obstacles.splice(i, 1);
        continue;
      }
      if (!o.spent && p.invuln <= 0 && this.overlaps(box, o)) {
        o.spent = true;
        this.lives -= 1;
        this.stats.hits += 1;
        p.invuln = TURKEY.invulnerable;
        this.slowTimer = 0.6;
        this.farmerGap = Math.max(0, this.farmerGap - FARMER.hitCloser);
        events |= EVENT_HIT;
        this.burst(p.x + 40, p.y + 30, '#e8a33c', 10);
        if (this.lives <= 0 || this.farmerGap <= 0) {
          this.over = 'caught';
          this.overReason =
            this.lives <= 0
              ? 'Three hard knocks — the turkey is down, and the farmer is here.'
              : 'The farmer caught up. Dinner is served.';
          return events | EVENT_OVER;
        }
      }
    }

    // --- pickups --------------------------------------------------------
    for (let i = this.pickups.length - 1; i >= 0; i -= 1) {
      const k = this.pickups[i];
      k.x -= this.speed * dt;
      k.bob += dt * 4;
      if (k.x < -60) {
        this.pickups.splice(i, 1);
        continue;
      }
      const ky = k.y + Math.sin(k.bob) * 5;
      if (this.overlaps(box, { x: k.x, y: ky, width: k.size, height: k.size })) {
        this.pickups.splice(i, 1);
        this.bonus += k.points;
        if (k.kind === 'corn') {
          this.stats.corn += 1;
          this.farmerGap = Math.min(FARMER.startGap, this.farmerGap + FARMER.cornPushback);
        }
        if (k.kind === 'pie' && this.lives < LIVES) this.lives += 1;
        events |= EVENT_PICKUP;
        this.burst(k.x + k.size / 2, ky + k.size / 2, k.kind === 'feather' ? '#e8c33c' : '#f2c94c', 8);
      }
    }

    // --- leaves and dust ------------------------------------------------
    this.leafTimer -= dt;
    if (this.leafTimer <= 0) {
      this.leafTimer = 0.12 + this.rng() * 0.2;
      this.particles.push({
        kind: 'leaf',
        x: FIELD.width + 20,
        y: this.rng() * 260,
        vx: -(60 + this.rng() * 80),
        vy: 26 + this.rng() * 30,
        size: 7 + this.rng() * 7,
        color: PALETTE.leaf[Math.floor(this.rng() * PALETTE.leaf.length)],
        spin: this.rng() * Math.PI * 2,
        spinV: (this.rng() - 0.5) * 4,
        life: 9,
      });
    }
    if (p.onGround && this.rng() < 0.25) {
      this.particles.push({
        kind: 'dust',
        x: TURKEY.x + 8,
        y: FIELD.groundY - 4,
        vx: -(40 + this.rng() * 40),
        vy: -(10 + this.rng() * 24),
        size: 4 + this.rng() * 5,
        color: 'rgba(190, 160, 120, 0.5)',
        spin: 0,
        spinV: 0,
        life: 0.5,
      });
    }
    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.spin += pt.spinV * dt;
      pt.life -= dt;
      if (pt.life <= 0 || pt.x < -30) this.particles.splice(i, 1);
    }

    return events;
  }

  overlaps(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  burst(x, y, color, n) {
    for (let i = 0; i < n; i += 1) {
      const angle = this.rng() * Math.PI * 2;
      const speed = 60 + this.rng() * 160;
      this.particles.push({
        kind: 'spark',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        size: 3 + this.rng() * 4,
        color,
        spin: 0,
        spinV: 0,
        life: 0.5 + this.rng() * 0.3,
      });
    }
  }

  spawn() {
    let kind = pickWeighted(this.rng, spawnTable(this.level));
    // Never stack a knife on a ground obstacle (or the reverse): the player
    // could not duck and jump at once. Downgrade the second one to corn.
    const sinceObstacle = this.time - this.lastObstacleAt;
    const groundKinds = ['bale', 'fence', 'pumpkin', 'mud', 'oven'];
    if (kind === 'knife' && this.lastObstacleKind !== '' && sinceObstacle < 1.4) {
      kind = 'cornArc';
    } else if (
      groundKinds.includes(kind) &&
      this.lastObstacleKind === 'knife' &&
      sinceObstacle < 1.4
    ) {
      kind = 'cornArc';
    }
    // A knife flies faster than the road scrolls, so it catches up to anything
    // ahead of it: never spawn one while another obstacle is still far ahead.
    if (kind === 'knife' && this.obstacles.some((o) => o.x > 400)) {
      kind = 'cornArc';
    }
    const x = FIELD.width + 60 + this.rng() * 120;
    if (kind === 'cornArc') {
      const baseY = FIELD.groundY - 46;
      for (let i = 0; i < 4; i += 1) {
        const arc = i === 1 || i === 2 ? 66 : 0;
        this.pickups.push({
          kind: 'corn',
          x: x + i * 52,
          y: baseY - arc,
          size: PICKUP.corn.size,
          points: PICKUP.corn.points,
          bob: this.rng() * 6,
        });
      }
      return;
    }
    if (kind === 'pie') {
      this.pickups.push({
        kind: 'pie',
        x,
        y: FIELD.groundY - 120 - this.rng() * 60,
        size: PICKUP.pie.size,
        points: PICKUP.pie.points,
        bob: this.rng() * 6,
      });
      return;
    }
    if (kind === 'feather') {
      this.pickups.push({
        kind: 'feather',
        x,
        y: FIELD.groundY - 150,
        size: PICKUP.feather.size,
        points: PICKUP.feather.points,
        bob: this.rng() * 6,
      });
      return;
    }
    if (kind === 'knife') {
      const def = OBSTACLE.knife;
      this.obstacles.push({
        kind,
        x,
        y: FIELD.groundY - def.flyHeight,
        width: def.width,
        height: def.height,
        spent: false,
      });
      this.lastObstacleAt = this.time;
      this.lastObstacleKind = 'knife';
      return;
    }
    const def = OBSTACLE[kind];
    this.obstacles.push({
      kind,
      x,
      y: FIELD.groundY - def.height,
      width: def.width,
      height: def.height,
      spent: false,
    });
    this.lastObstacleAt = this.time;
    this.lastObstacleKind = kind;
  }
}

export { STEP };
