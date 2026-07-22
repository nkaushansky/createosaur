# rig-scan — enclosed-hole scan for /rig-lab

The quantitative seam check the IR seam rounds reference ("the enclosed-hole
scan stays flat across the whole sweep"). Counts transparent stage pixels
tightly flanked by solid art on all four sides (within 12 px) — slits and
tears inside the creature — across a matrix of rig configs (pure species and
hybrid mixes) and poses (neutral, clench, stride ±1, stress).

Reading results: compare a config's pose row against its own neutral and
against its pure-species baselines. Flat-or-decreasing across the sweep =
no motion-opened seams. The scan intentionally ignores openings wider than
its 12 px window — those are area mismatches, reviewed via screenshots.

```sh
npm run build && npm run start   # serve the static export
node tools/rig-scan/scan.mjs --base-url http://localhost:3000 \
  --out docs/rebuild/rig-lab/hybrid/measurements.json
```

Uses the preinstalled Chromium (`/opt/pw-browsers/chromium`) when present,
matching playwright.config.ts.
