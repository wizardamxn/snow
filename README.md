# SIGMA — a portfolio you walk through

[amanahmad.xyz](https://amanahmad.xyz) is a résumé rebuilt as a top-down 2D RPG. You spawn in a
pixel-art frontier town; each building is a section of the résumé — the Armory is skills, the
Chronicle Hall is GitHub activity, the Sanctum is testimonials, the Contact Spire is, well, contact.
Walk up, press interact, read. There's a day/night cycle, a Last.fm-powered bard who plays whatever
I'm actually listening to, a terminal with real `git log` output, and a 60-second guided tour for
anyone who'd rather not walk.

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

- `components/world/` — the Pixi layer. `scenes/Town.ts` is the world: terrain, buildings, NPCs,
  ambient FX (fireflies, torch bloom, water shimmer), the day/night clock, and the recruiter
  auto-tour driver. `Player.ts` owns movement/collision/autopilot.
- `components/overlay/` — the React/DOM layer stacked on top of the canvas: HUD, dialogue panels,
  the terminal, touch controls. Talks to the game via a small `worldState` singleton + pub/sub
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
