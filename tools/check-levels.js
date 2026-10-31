// Replays every level's stored solution under the game rules and checks that it
// solves the table in exactly `par` moves. With --optimal it also re-runs the
// breadth-first solver to prove par is the true minimum (slow on big levels).
const path = require('path');
const { solve, solved } = require('./generate.js');

const levels = require(path.join(__dirname, '../levels/levels.json'));
const proveOptimal = process.argv.includes('--optimal');
let failed = 0;

function apply(s, m, cfg) {
  const N = s.ring.length, r = { ring: s.ring.slice(), tubes: s.tubes.map(t => t.slice()) };
  if (m === 'cw') { r.ring = s.ring.map((_, i) => s.ring[(i - 1 + N) % N]); return r; }
  if (m === 'ccw') {
    if (cfg.oneWay) throw new Error('counter-clockwise turn on a one-way table');
    r.ring = s.ring.map((_, i) => s.ring[(i + 1) % N]); return r;
  }
  const t = +m.slice(1), p = cfg.ports[t], b = r.ring[p], tube = r.tubes[t];
  if (b > 0) {
    if (tube.length >= cfg.cap || (tube.length && tube[tube.length - 1] !== b)) throw new Error(`illegal drop into tube ${t}`);
    tube.push(b); r.ring[p] = 0;
  } else if (b === 0 && tube.length) r.ring[p] = tube.pop();
  else throw new Error(`nothing to move at tube ${t}`);
  return r;
}

levels.forEach((cfg, i) => {
  const name = `Level ${i + 1}`;
  try {
    const counts = {};
    [...cfg.ring, ...cfg.tubes.flat()].filter(v => v > 0).forEach(v => { counts[v] = (counts[v] || 0) + 1; });
    for (const [c, n] of Object.entries(counts)) if (n !== cfg.cap) throw new Error(`colour ${c} has ${n} marbles, expected ${cfg.cap}`);
    let s = { ring: cfg.ring.slice(), tubes: cfg.tubes.map(t => t.slice()) };
    const sol = cfg.sol.split(' ');
    sol.forEach(m => { s = apply(s, m, cfg); });
    if (!solved(s, cfg)) throw new Error('stored solution does not solve the table');
    if (sol.length !== cfg.par) throw new Error(`solution has ${sol.length} moves but par is ${cfg.par}`);
    if (proveOptimal) {
      const r = solve({ ring: cfg.ring.slice(), tubes: cfg.tubes.map(t => t.slice()) }, cfg, 5e6);
      if (!r || r.len !== cfg.par) throw new Error(`solver found ${r ? r.len : 'nothing'}, par is ${cfg.par}`);
    }
    console.log(`ok   ${name}  par ${cfg.par}`);
  } catch (e) {
    failed++;
    console.log(`FAIL ${name}  ${e.message}`);
  }
});

if (failed) { console.error(`${failed} level(s) failed`); process.exit(1); }
console.log(`All ${levels.length} levels pass`);
