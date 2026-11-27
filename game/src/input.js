// Keyboard, mouse and touch input. The game reads a fresh snapshot each step:
// jump is an edge (pressed this step), jumpHeld and duck are levels.

export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.jumpQueued = false;
    this.clicked = false;
    this.canvas = canvas;
    this.onFirstGesture = null;
    window.addEventListener('keydown', (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
      if (!e.repeat) {
        this.keys.add(e.code);
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') this.jumpQueued = true;
        if (this.onFirstGesture) this.onFirstGesture();
      }
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.clicked = true;
      this.jumpQueued = true;
      if (this.onFirstGesture) this.onFirstGesture();
    });
    window.addEventListener('blur', () => this.keys.clear());
  }

  /** Edge-triggered actions, consumed by the caller after each read. */
  take() {
    const snapshot = {
      jump: this.jumpQueued,
      jumpHeld: this.keys.has('Space') || this.keys.has('ArrowUp') || this.keys.has('KeyW'),
      duck: this.keys.has('ArrowDown') || this.keys.has('KeyS'),
      pause: this.keys.has('KeyP'),
      mute: this.keys.has('KeyM'),
      restart: this.keys.has('KeyR'),
      start: this.keys.has('Enter'),
      clicked: this.clicked,
    };
    this.jumpQueued = false;
    this.clicked = false;
    this.keys.delete('KeyP');
    this.keys.delete('KeyM');
    this.keys.delete('KeyR');
    return snapshot;
  }

  /** Held state only, for the simulation step. */
  held() {
    return {
      jump: false,
      jumpHeld: this.keys.has('Space') || this.keys.has('ArrowUp') || this.keys.has('KeyW'),
      duck: this.keys.has('ArrowDown') || this.keys.has('KeyS'),
    };
  }
}
