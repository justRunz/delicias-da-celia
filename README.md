# As Delícias da Célia

Site vitrine de la pâtisserie maison [As Delícias da Célia](https://www.facebook.com/asdeliciasdacelia.pt/) (Vale de Figueira, Santarém) : bolos de aniversário, cake design, bolos secos, doces, salgados et catering.

Site en portugais construit avec [Astro](https://astro.build), animations [GSAP](https://gsap.com) (ScrollTrigger, Flip) et défilement doux [Lenis](https://lenis.darkroom.engineering). Les pages sont statiques ; seule la route d'envoi du formulaire (`/api/contact`) tourne côté serveur, sur [Vercel](https://vercel.com), avec [Cloudflare Email Service](https://developers.cloudflare.com/email-service/) pour les e-mails.

## Lancer le projet

Node 22 ou plus (voir `.nvmrc`).

```bash
nvm use
npm install
npm run dev      # http://localhost:4321
npm run build
```

Pour que le formulaire envoie vraiment les e-mails : copier `.env.example` en `.env` et renseigner les clés (sans clé, il fonctionne en mode démonstration en développement).

## Où modifier quoi

| Quoi | Où |
|---|---|
| Téléphone, WhatsApp, Facebook, lieu, menu | `src/data/site.ts` |
| Photos et catégories de la page Criações | `src/assets/creations/` + `src/data/creations.ts` |
| Photos de l'accueil | `src/assets/photos/` |
| Logo | `src/assets/logo/` + `src/components/Logo.astro` |
| Textes de l'accueil | `src/components/home/*.astro` |
| Formulaire de contact et envoi | `src/components/ContactCta.astro` + `src/pages/api/contact.ts` |
| Couleurs, polices, espacements | `src/styles/global.css` (variables en haut du fichier) |
| Animations au défilement | `src/scripts/motion.ts` (attributs `data-reveal`, `data-parallax`, `data-count`…) |

Les informations à confirmer avec la Célia sont listées dans [`TEXTOS.md`](TEXTOS.md).
