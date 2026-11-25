// @ts-check
import { defineConfig, envField } from "astro/config";
import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
  // Adresse publique du site (domaine acheté chez Cloudflare, branché sur Vercel)
  site: "https://asdelicias-dacelia.com",

  // Le site reste statique ; seule la route /api/contacto (envoi du formulaire)
  // est rendue à la demande (voir `export const prerender = false` dans ce fichier).
  adapter: vercel(),

  // Variables de l'envoi d'e-mails (voir .env.example). Facultatives : sans clé,
  // le formulaire fonctionne en mode démonstration en développement.
  env: {
    schema: {
      CLOUDFLARE_ACCOUNT_ID: envField.string({ context: "server", access: "secret", optional: true }),
      CLOUDFLARE_API_TOKEN: envField.string({ context: "server", access: "secret", optional: true }),
      EMAIL_FROM: envField.string({ context: "server", access: "secret", optional: true }),
      EMAIL_TO: envField.string({ context: "server", access: "secret", optional: true }),
    },
  },

  // Barre d'outils de développement désactivée : fixée en bas de l'écran, elle empêchait
  // le Safari d'iOS 26 de colorer la zone de la barre d'adresse (n'existe pas en production).
  devToolbar: { enabled: false },

  // Prépare ces bibliothèques dès le démarrage du serveur de développement
  // (évite l'erreur « Outdated Optimize Dep » au premier chargement).
  vite: {
    // Autorise l'aperçu via un tunnel Cloudflare (test sur téléphone hors du Wi-Fi)
    server: { allowedHosts: [".trycloudflare.com"] },
    optimizeDeps: {
      include: ["gsap", "gsap/ScrollTrigger", "gsap/Flip", "lenis"],
    },
  },
});
