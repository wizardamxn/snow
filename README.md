# SNOW — a portfolio you walk through

[amanahmad.xyz](https://amanahmad.xyz) is a résumé rebuilt as a top-down 2D RPG. You spawn on a
pixel-art island town; each building is a section of the résumé, and you can walk inside it: the
Sanctum is About, the Hall of Chronicles is Experience, the Vault of Relics is Projects, the Armory
is Skills, the Hall of Testimonies is Testimonials, and the Contact Spire is, well, contact. Inside,
the content sits on objects (a plaque per job, an easel per project, a rack per skill area) and
opens as a parchment scroll.

Nobody has to learn the map: a **WHERE TO?** list (or keys 1–6) walks the hero to any section and
opens it, and a gold arrow points at the next one you haven't seen. North across the bridge are the
wilds: a waterfall, a gold mine by the cave, and the Black Knight waiting in his arena. There's a
day/night cycle, a Last.fm-powered bard who plays whatever I'm actually listening to, a terminal
with real `git log` output, and a 60-second guided tour for anyone who'd rather not walk.

Touch devices skip the game by default — a full RPG squeezed onto a phone screen is a worse
experience than reading — and land on a themed HTML résumé instead, restyled in the game's own
gold/navy pixel language. `?play=1` always forces the real game, on anything.

A `?view=plain` / classic mode also exists for anyone who just wants the words.

## Why

Most portfolios are a PDF with CSS. This is an argument that a portfolio can *demonstrate* the
thing it's describing — if I say I can build interactive systems, the site itself should be the
proof, not a bullet point about it.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**, strict mode
- **Pixi.js 8** (WebGL) — the game world is a hand-rolled engine, not a framework. No Phaser, no
  ECS library; sprites, collision, camera, day/night, and the tour-guide autopilot are all bespoke.
- **Tailwind v4** for every non-canvas surface (HUD, panels, the themed résumé)
- **Upstash Redis** for lightweight visit/interaction analytics, **GA4** for the rest
- **Playwright** for headless verification during development (screenshotting/driving the actual
  running app to catch things unit tests can't — a broken tour waypoint, a frozen video, a sticky
  header that silently stopped sticking)

## Architecture, briefly

- `components/world/` — the Pixi layer.
  - `world.config.ts` draws the map as ASCII (`~` water, `.` ground, `^` plateau, `L`/`R` ramps,
    `=` bridge) plus building, road and landmark positions; edit the map there by eye.
  - `Tilemap.ts` autotiles that grid from the Tiny Swords tileset (two walk levels joined by ramps)
    and paints the roads, cobbled square and bridge pixel by pixel.
  - `scenes/Town.ts` is the overworld: buildings, Tiny Swords townsfolk and workers, the Black
    Knight, ambient FX, the day/night clock, click-to-travel and the recruiter tour (both route with
    a tile BFS). `scenes/Interior.ts` builds the walk-in rooms; `props.ts` is the shared pixel-drawn
    furniture (well, stalls, barrels, tables…). `Player.ts` owns movement/collision/autopilot.
- `components/overlay/` — the React/DOM layer stacked on top of the canvas: HUD, the WHERE TO?
  menu, dialogue panels (each building's panels are parchment scrolls, themed through
  `PanelThemeContext` in `InfoPanel.tsx`), the terminal, touch controls. Talks to the game via a small `worldState` singleton + pub/sub
  `bus`, rather than React owning per-frame state — the canvas runs at 60fps independent of React's
  render cycle, and React only re-renders on discrete transitions (entering a building, a day/night
  flip), never on player position.
- `components/resume/` — the themed HTML résumé (mobile default, and the `?view=plain` classic view
  built from the same underlying data).
- `lib/data/*.json` — the actual content (projects, experience, testimonials). Every surface — the
  game's panels, the résumé, the terminal — reads from these, so there's one source of truth for
  "what is on this portfolio."
- `content/caseStudies/*.md` — long-form project writeups, rendered via `react-markdown`.
- `app/api/` — small server routes: Redis-backed analytics, a GitHub commit-search proxy for the
  terminal's `git log`, Last.fm now-playing.

Alpha-mask collision (buildings are walkable *around* their actual sprite shape, not a bounding
box), a Redis-backed live visit counter, and the terminal's `open <project>` / `git log` /
`speedrun` commands are the pieces I'd point a fellow developer at first.

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm run start   # production build
npm run lint
```

Needs a `.env` for the optional integrations — the app runs without it, those features just degrade
quietly:

```
LASTFM_API_KEY=
LASTFM_SHARED_SECRET=
LASTFM_USERNAME=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
NEXT_PUBLIC_GA_MEASUREMENT_ID=
```

## ⚠️ This is not the Next.js you know

This repo runs on a pre-release/nonstandard Next.js build with real breaking changes from the
version most tooling and training data assume — e.g. `middleware.ts` is `proxy.ts`, and
underscore-prefixed folders under `app/` are private/non-routable. If you're touching anything
Next-specific, check `node_modules/next/dist/docs/` before assuming an API works the way you
remember.

## Art credits

Base tileset/units: [Tiny Swords](https://pixelfrog-assets.itch.io/tiny-swords) by Pixel Frog.
Additional sprites (signposts, cursors) sourced from the Liberated Pixel Cup asset pack — see
[ATTRIBUTION.md](./ATTRIBUTION.md) for the full breakdown.
