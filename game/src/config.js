// Gobble Dash — every tuning number and colour in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to
// the window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720, groundY: 618 };

/** Fixed simulation step, in seconds: 60 updates a second whatever the display rate. */
export const STEP = 1 / 60;

/** The turkey: a fixed screen x, a jump arc, a duck that halves its height. */
export const TURKEY = {
  x: 230,
  width: 84,
  height: 78,
  duckHeight: 44,
  /** The hitbox is narrower than the drawing: a forgiving box, centred. */
  hitDx: 13,
  hitWidth: 58,
  gravity: 2300,
  jumpSpeed: 1050,
  /** Seconds of grace after leaving the ground edge during which a jump still works. */
  coyote: 0.09,
  invulnerable: 1.5,
};

export const LIVES = 3;

/** How far behind the turkey the farmer starts, in pixels; 0 means caught. */
export const FARMER = { startGap: 340, catchGap: 0, hitCloser: 95, cornPushback: 14 };

/** Metres of road to the forest gate: reaching it wins the run. */
export const ESCAPE_DISTANCE = 1000;

export const SPEED = { base: 300, perLevel: 20, max: 560 };

/** A level every 150 m; speeds and spawn rates stop growing at level 10. */
export const LEVEL = { metres: 150, max: 10 };

/** Pixels of road that make one metre of the distance counter. */
export const PX_PER_METRE = 50;

export const OBSTACLE = {
  bale: { width: 74, height: 66, points: 0 },
  fence: { width: 48, height: 88, points: 0 },
  pumpkin: { width: 92, height: 42, points: 0 },
  mud: { width: 130, height: 18, points: 0 },
  oven: { width: 88, height: 104, points: 0 },
  /** A carving knife flies at head height: duck under it, never jump into it. */
  knife: { width: 96, height: 26, flyHeight: 96, points: 0 },
};

export const PICKUP = {
  corn: { size: 30, points: 10 },
  pie: { size: 34, points: 25 },
  feather: { size: 30, points: 50 },
};

export const PALETTE = {
  skyTop: '#2b1d4e',
  skyMid: '#b34a2e',
  skyLow: '#e8803c',
  sun: '#ffd27a',
  sunGlow: 'rgba(255, 190, 90, 0.35)',
  cloud: 'rgba(255, 214, 170, 0.55)',
  hillFar: '#5d3a52',
  hillNear: '#46304a',
  barn: '#4a2430',
  barnRoof: '#331722',
  ground: '#7a4a26',
  groundTop: '#9c6a35',
  grass: '#5e7a2e',
  grassDark: '#48611f',
  fence: '#6b4423',
  turkeyBody: '#8a5230',
  turkeyDark: '#6e3f22',
  turkeyTail: ['#c96a1e', '#d98a2b', '#e8a33c', '#b34a2e', '#e8c33c'],
  turkeyHead: '#d9c9a8',
  turkeyBeak: '#e8a33c',
  turkeyWattle: '#d94f3d',
  turkeyLeg: '#e8a33c',
  farmerShirt: '#a83c2e',
  farmerApron: '#e8e0cc',
  farmerHat: '#d9b96a',
  farmerSkin: '#e8b98a',
  farmerPants: '#3a4a6b',
  knifeBlade: '#dfe5ec',
  knifeHandle: '#5d3a1e',
  ovenBody: '#3c3c46',
  ovenGlow: '#ff7a26',
  ovenFire: '#ffc23c',
  corn: '#f2c94c',
  cornHusk: '#5e7a2e',
  pie: '#c96a3c',
  feather: '#e8c33c',
  leaf: ['#d98a2b', '#c96a1e', '#e8a33c', '#a83c2e'],
  hudPanel: 'rgba(20, 12, 24, 0.62)',
  hudText: '#fff3d9',
  hudMuted: '#d9b98a',
  danger: '#e84f3d',
  safe: '#7ac74f',
  title: '#ffd27a',
  panel: 'rgba(24, 14, 26, 0.78)',
};

export const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'gobble-dash.best';
