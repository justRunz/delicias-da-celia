<div align="center">

# As Delícias da Célia

**A showcase site for a home bakery in Vale de Figueira (Santarém, Portugal)**
Birthday cakes, cake design, traditional sweets, savoury bites and catering.

[**asdelicias-dacelia.com**](https://asdelicias-dacelia.com)

![Astro](https://img.shields.io/badge/Astro-7-BC52EE?logo=astro&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![GSAP](https://img.shields.io/badge/GSAP-ScrollTrigger%20%C2%B7%20Flip-88CE02?logo=greensock&logoColor=black)
![Vercel](https://img.shields.io/badge/Hosted%20on-Vercel-000?logo=vercel&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Email-Cloudflare-F38020?logo=cloudflare&logoColor=white)

</div>

---

## About

A real client project, built end to end for a small family business. The goal was a site that feels as handmade as the cakes, fast on a phone in rural Portugal, and that the owner can update herself without touching code.

- **Static first.** Every page is pre-rendered. Only the contact form endpoint runs on the server.
- **Owner-editable.** The price list and legal info are edited from the browser through [Pages CMS](https://pagescms.org), which commits JSON straight to this repo.
- **Portuguese URLs, English code.** Public routes (`/criacoes`, `/precario`, `/informacao-legal`) are injected by a tiny Astro integration that maps them to English-named views.

## Highlights

| | |
|---|---|
| 🎞️ **Motion design** | Scroll reveals, parallax, counters, a marquee, a horizontal-scroll section and magnetic buttons, all driven by declarative `data-*` attributes in a single [`motion.ts`](src/scripts/motion.ts). Smooth scrolling with Lenis. Everything respects `prefers-reduced-motion`. |
| 🖼️ **Filterable gallery** | 200+ creations by category, animated filtering with GSAP Flip, an accessible lightbox, images optimised at build time by `astro:assets`. |
| 📨 **Order request form** | Custom date picker, drag-and-drop reference photos (shrunk to JPEG in the browser before upload), inline validation with live error messages. |
| 🔒 **Hardened API route** | [`/api/contact`](src/pages/api/contact.ts) caps field lengths, escapes HTML, checks uploaded files by their magic bytes (not their name or MIME type), renames them, enforces size limits, and sends through the Cloudflare Email Service REST API with `reply_to` set to the customer. Falls back to a demo mode in development when no keys are set. |
| 🔎 **SEO** | `Bakery` JSON-LD for local search, Open Graph tags and a custom 404 page. |
| 📱 **Mobile polish** | Tested on iOS 26 Safari, including its tinted address bar quirks (opaque fixed header, dev toolbar disabled). |

## Tech stack

- **[Astro 7](https://astro.build)** with TypeScript, zero UI framework, vanilla scripts per component
- **[GSAP](https://gsap.com)** (ScrollTrigger, Flip) and **[Lenis](https://lenis.darkroom.engineering)** for animation and scroll
- **Fraunces** and **Geist** variable fonts, self-hosted via Fontsource
- **[Vercel](https://vercel.com)** for hosting, the on-demand API route and Web Analytics
- **[Cloudflare](https://cloudflare.com)** for the domain and transactional email
- **[Pages CMS](https://pagescms.org)** as a Git-based CMS for the owner

## Project structure

```text
src/
├── pages/          index, 404 and the /api/contact endpoint
├── views/          Creations, Pricing, Legal (mapped to Portuguese URLs in astro.config.mjs)
├── components/     Header, Footer, ContactCta, DatePicker, Lightbox, …
│   └── home/       Hero, About, Specialties, Gallery, HowTo, Review, Marquee
├── data/           site info, gallery index, CMS-edited JSON (pricing, legal)
├── scripts/        motion.ts (all scroll animations)
├── styles/         global.css (design tokens at the top)
└── assets/         photos and logo, optimised at build time
```

## Running locally

Requires Node 22.12 or later (see [`.nvmrc`](.nvmrc)).

```bash
nvm use
npm install
npm run dev      # http://localhost:4321
npm run build
```

To send real emails, copy `.env.example` to `.env` and fill in the Cloudflare keys. Without them the form works in demo mode and logs the message to the console.

## Where to edit what

| What | Where |
|---|---|
| Phone, WhatsApp, Facebook, location, menu | [`src/data/site.ts`](src/data/site.ts) |
| Gallery photos and categories | `src/assets/creations/` + [`src/data/creations.ts`](src/data/creations.ts) |
| Price list | Pages CMS, or [`src/data/pricing.json`](src/data/pricing.json) |
| Home page photos and text | `src/assets/photos/` and `src/components/home/` |
| Contact form and sending | [`ContactCta.astro`](src/components/ContactCta.astro) + [`api/contact.ts`](src/pages/api/contact.ts) |
| Colours, fonts, spacing | [`src/styles/global.css`](src/styles/global.css) |
| Scroll animations | [`src/scripts/motion.ts`](src/scripts/motion.ts) |

Content still to confirm with the client is tracked in [`TEXTOS.md`](TEXTOS.md).

---

<div align="center">
Designed and built by <a href="https://github.com/justRunz">Rui Gaspar</a>.
Photos and brand © As Delícias da Célia.
</div>
