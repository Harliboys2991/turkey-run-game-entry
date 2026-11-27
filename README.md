# Gobble Dash — The Great Thanksgiving Escape

A complete original turkey escape game for the make.fun bounty
`turkey-run-game-01`. It runs in a desktop browser from static files, with no
network request, played with keyboard and mouse.

## The game

You are the turkey, and Thanksgiving is coming. The farmer wants you for
dinner, the oven is hot, and the carving knives are flying. Sprint through the
farmyard at dusk, jump the hay bales, fences and pumpkins, duck under the
flying knives, leap the glowing oven, grab corn to slow the farmer down — and
reach the forest gate at 1000 m to escape.

- **Title screen** with the rules and the best score
- **A run in play** with a HUD of score, distance, level and lives, plus a
  farmer-proximity bar that shows how close the farmer is behind you
- **End screens** for caught (the farmer got you) or escaped (through the
  forest gate), with a restart
- **Synthesised sound** (WebAudio, no audio files): jump, corn, hits, gobble,
  level-up, win and lose stingers. `M` mutes.

## Controls

| Key | Action |
| --- | --- |
| Space / ↑ / W | Jump (hold for a higher jump) |
| ↓ / S | Duck under the flying knives |
| P | Pause |
| M | Mute |
| R | Restart after being caught or escaping |
| Click / tap | Jump (also starts and restarts) |

## How to play it

```sh
node serve.ts
# open http://localhost:8080
```

Or serve `game/` with any static file server. The entry point is
`game/index.html`.

## Screenshots

`?shot=title|play|oven|escaped` stages one deterministic scene from the real
game rules, for screenshots: the title screen, a mid-run frame, a late run
with the oven and a knife in frame, and the escaped end screen.

## Files

- `main.ts` — the program the bounty runs: copies `game/` and `screenshots/`
  to the output directory and writes `dossier.json`
- `game/` — the playable game as static files (plain ES modules, no library,
  no network request)
- `screenshots/` — four real renders of the game's own code
- `vendor/makefun-game.ts` — the make.fun game library, copied unchanged
  from the competition kit

## License

MIT — see `LICENSE`.
