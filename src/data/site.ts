// Informations reprises de la page Facebook et de la bannière de la banca (octobre 2026).
// Les points à confirmer avec la Célia sont listés dans TEXTOS.md.

const phoneDigits = "351913815229";

export const company = {
  name: "As Delícias da Célia",
  owner: "Célia Gaspar",
  phone: "913 815 229",
  phoneHref: `tel:+${phoneDigits}`,
  whatsapp: `https://wa.me/${phoneDigits}?text=${encodeURIComponent("Olá Célia! Gostava de fazer uma encomenda.")}`,
  facebook: "https://www.facebook.com/asdeliciasdacelia.pt/",
  instagram: "https://www.instagram.com/_as_delicias_da_celia_/",
  instagramHandle: "@_as_delicias_da_celia_",
  linktree: "https://linktr.ee/Asdeliciasdacelia",
  place: "Vale de Figueira",
  city: "Santarém",
  // Recommandations Facebook (vérifié le 5 octobre 2026)
  rating: { percent: 100, count: 12 },
  followers: 1.3, // en milliers
};

// Liens « /#section » : fonctionnent depuis toutes les pages (défilement doux sur l'accueil)
export const nav = [
  { label: "Especialidades", href: "/#especialidades" },
  { label: "Criações", href: "/criacoes" },
  { label: "Preçário", href: "/precario" },
  { label: "Quem somos", href: "/#sobre" },
  { label: "Como encomendar", href: "/#encomendar" },
];
