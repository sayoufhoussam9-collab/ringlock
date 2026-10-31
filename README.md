# Ringlock

A turn-based marble sorting puzzle. Glass tubes of mixed marbles sit around a brass turntable. Tap a tube to drop its top marble into the cup at its mouth, or to take the marble sitting there. Turn the table one cup at a time. Sort every colour into its own tube in as few moves as possible.

Every level was made by scrambling a solved table backwards, then solved by breadth-first search, so each level's **par** is the true minimum number of moves.

## Project layout

| Path | What it is |
| --- | --- |
| `src/game.html` | The whole game: one HTML file with canvas drawing, synthesised sound, hints, tutorial and level map. Levels are injected at `/*LEVELS*/[]`. |
| `levels/levels.json` | All 39 levels, one per line, each with its par and a best solution (`cw`, `ccw`, `t0`, `t1`…). |
| `tools/build.js` | Writes `dist/index.html` with the levels baked in. |
| `tools/check-levels.js` | Replays every stored solution and checks it solves the table in exactly par moves. |
| `tools/generate.js` | Level generator and solver. |

## Commands

```sh
npm run build          # dist/index.html, open it in any browser
npm test               # check every level's solution and par
npm run test:optimal   # also re-prove each par with the solver (slow)
```

No dependencies. Node 18 or newer.

## Making new levels

`tools/generate.js` takes a JSON list of level specs and prints levels as JSON:

```sh
npm run generate -- '[{"name":"40","N":7,"cap":3,"colors":3,"ports":[0,2,4],"steps":120,"tries":40,"min":18,"max":40,"target":24}]'
```

- `N` cups on the table, `cap` marbles per tube and per colour, `colors` colours, `ports` the cups that have a tube.
- `oneWay: true` allows clockwise turns only. `blockers: [i]` bolts a brass stud into cup `i`.
- `min`/`max`/`target` bound the par you want. Four colours on eight or more cups often exceeds the solver's state limit; use seven cups or add a stud.

Append the result to `levels/levels.json` (keep `N, cap, ports, oneWay, ring, tubes, par, sol`), then run `npm test`.
