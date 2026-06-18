# asciinema-online-player

Frontend-only static asciinema online player.

## MVP

The first version intentionally keeps the scope small:

- Static Next.js app, exported as plain files.
- Browser-only `.cast` loading through `fetch`.
- Basic asciicast event parsing.
- Basic play and pause.
- Text playback with ANSI control sequences stripped.

Advanced terminal rendering, seek, speed control, resize handling, and performance work are tracked in [ROADMAP.md](./ROADMAP.md).

## Commands

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

## Static Deployment

```bash
npm run build
```

The static site is generated in `out/`.
