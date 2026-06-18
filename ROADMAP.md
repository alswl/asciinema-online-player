# ROADMAP

This project starts as a frontend-only static player with the smallest useful playback loop:

1. Open the page.
2. Provide a public `.cast` URL through `?url=` or the input field.
3. Fetch and parse the cast file in the browser.
4. Play output events in timestamp order.

No backend, database, upload service, server proxy, or API route is planned for the initial version.

## Current MVP

- Next.js static export application.
- TypeScript, Tailwind CSS, ESLint, Vitest, and CI setup.
- Client-side `.cast` loading with `fetch`.
- Basic asciicast v2 parsing, with best-effort line-event parsing for simple v1-like files.
- Basic play and pause.
- Output text playback with ANSI escape sequences stripped.
- URL parameter support through `?url=<encoded-cast-url>`.

## Later Playback Improvements

- Full ANSI rendering for 16-color, 256-color, true color, bold, italic, underline, inverse, and cursor positioning.
- Virtual terminal buffer with dirty-row rendering.
- Resize events and terminal reflow.
- Seek bar with fast-forward replay or snapshot checkpoints.
- Playback speed control: 0.5x, 1x, 2x, 4x.
- Keyboard shortcuts: Space, Left, Right.
- Better malformed-line handling with warnings instead of hard failure.
- Large recording optimization for 10,000+ events and hour-long casts.
- Mobile touch polish and iframe embedding validation.

## Later Quality Work

- More parser fixtures from real asciinema files.
- Component tests for URL loading and playback state.
- Browser compatibility checks for Chrome, Firefox, Safari, and Edge.
- Static deployment documentation for GitHub Pages or any CDN.
