// @ts-check
import { defineConfig, envField } from "astro/config";
import vercel from "@astrojs/vercel";

// Portuguese URLs, English file names: each public route points to a view in src/views/.
// One route per view keeps one bundle per page. index, 404 and the API stay in src/pages.
const routes = {
  "/criacoes": "Creations",
  "/precario": "Pricing",
};
const portugueseRoutes = {
  name: "portuguese-routes",
  hooks: {
    "astro:config:setup": ({ injectRoute }) => {
      for (const [pattern, view] of Object.entries(routes))
        injectRoute({ pattern, entrypoint: new URL(`./src/views/${view}.astro`, import.meta.url) });
    },
  },
};

// https://astro.build/config
export default defineConfig({
  // Public site URL (domain bought from Cloudflare, connected to Vercel)
  site: "https://asdelicias-dacelia.com",

  // The site stays static; only the /api/contact route (form submission)
  // is rendered on demand (see `export const prerender = false` in that file).
  adapter: vercel(),

  integrations: [portugueseRoutes],

  // E-mail sending variables (see .env.example). Optional: without a key,
  // the form runs in demo mode during development.
  env: {
    schema: {
      RESEND_API_KEY: envField.string({ context: "server", access: "secret", optional: true }),
      EMAIL_FROM: envField.string({ context: "server", access: "secret", optional: true }),
      EMAIL_TO: envField.string({ context: "server", access: "secret", optional: true }),
    },
  },

  // Dev toolbar disabled: fixed at the bottom of the screen, it stopped
  // iOS 26 Safari from tinting the address bar area (it does not exist in production).
  devToolbar: { enabled: false },

  // Pre-bundle these libraries when the dev server starts
  // (avoids the "Outdated Optimize Dep" error on first load).
  vite: {
    // Allow previews through a Cloudflare tunnel (testing on a phone off Wi-Fi)
    server: { allowedHosts: [".trycloudflare.com"] },
    optimizeDeps: {
      include: ["gsap", "gsap/ScrollTrigger", "gsap/Flip", "lenis"],
    },
  },
});
