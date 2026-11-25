# As Delícias da Célia

Showcase site for a home bakery in Vale de Figueira (Santarém, Portugal). Astro 7, TypeScript, no UI framework, hosted on Vercel. See [README.md](README.md) for the structure and the "where to edit what" table.

`CLAUDE.md` is a symlink to this file. Edit `AGENTS.md`.

## Languages

- **Site copy**: European Portuguese, formal register ("Siga-nos", "Escreva…").
- **Code, comments, file names**: English.
- **Commits and PRs**: French, short subject ("Page 404 : …", "Formulaire : …").

## Copy rules

- Never put a colon (`:`) inside a sentence in visible text (titles, leads, buttons, form messages). Split into two sentences or rephrase.
- `TEXTOS.md` is a local working file for copy, ignored by git. Never commit it.

## Routing

Public URLs are Portuguese, views are English. A new page goes in `src/views/` and gets a line in the `routes` map of `astro.config.mjs` (one route per view, one bundle per page). Only `index`, `404` and `api/` live in `src/pages/`.

## Content edited by the owner

`src/data/pricing.json` and `src/data/legal.json` are edited through Pages CMS (`.pages.yml`), which commits straight to the repo.
- Pull before touching them, the owner may have changed them.
- Keep the shape in sync with `.pages.yml` and the types in `src/data/pricing.ts`. Never rename keys or section `id`s (they are anchors).
- Prices are display strings ("25,00 €", "Sob consulta"), not numbers.

## Static first

Everything is pre-rendered. Only `src/pages/api/contact.ts` runs on demand (`prerender = false`). It sends mail through the Cloudflare Email Service REST API. Without the `.env` keys it falls back to demo mode and logs to the console. Keep its hardening (length caps, HTML escaping, magic-byte file checks, size limits).

## Animation

All scroll motion lives in `src/scripts/motion.ts` and is driven by `data-*` attributes (`data-reveal`, `data-parallax`, `data-count`, `data-marquee`, `data-hscroll`, `data-magnetic`…). Reuse those attributes instead of writing per-component GSAP. Everything must respect `prefers-reduced-motion`.

## iOS 26 Safari

The site is tested on an iPhone. Safari tints the status and address bars from the topmost `position: fixed` element at each edge.
- The fixed header background stays opaque at all times.
- No transparent fixed overlay above the header (the grain `body::after` sits below its z-index).
- The Astro dev toolbar stays disabled (`devToolbar: { enabled: false }`).

## Images

Photos live in `src/assets/photos/` and `src/assets/creations/` (JPEG) and go through `astro:assets`. Gallery entries are listed in `src/data/creations.ts`, where `title` doubles as alt text.

## Development

Node 22.12+ (`.nvmrc`). Start the dev server in background mode:

```
astro dev --background
```

Manage it with `astro dev stop`, `astro dev status` and `astro dev logs`. To test on a phone off Wi-Fi, a Cloudflare tunnel is allowed (`.trycloudflare.com` in `vite.server.allowedHosts`).

Astro docs: https://docs.astro.build
