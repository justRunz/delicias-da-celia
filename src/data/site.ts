import legalData from "./legal.json";

// Details taken from the Facebook page and the stall banner (October 2026).
// Points to confirm with Célia are listed in TEXTOS.md.

const phoneDigits = "351913815229";

export const company = {
  name: "As Delícias da Célia",
  owner: "Célia Gaspar",
  phone: "913 815 229",
  phoneHref: `tel:+${phoneDigits}`,
  whatsapp: `https://wa.me/${phoneDigits}?text=${encodeURIComponent("Olá Célia! Gostava de fazer uma encomenda.")}`,
  facebook: "https://www.facebook.com/asdeliciasdacelia.pt/",
  instagram: "https://www.instagram.com/_as_delicias_da_celia_/",
  place: "Vale de Figueira",
  city: "Santarém",
  // Facebook recommendations (checked on 5 October 2026)
  rating: { percent: 100, count: 12 },
  followers: 1.3, // in thousands
};

// "/#section" links work from every page (smooth scroll on the home page)
export const nav = [
  { label: "Especialidades", href: "/#especialidades" },
  { label: "Criações", href: "/criacoes" },
  { label: "Preçário", href: "/precario" },
  { label: "Quem somos", href: "/#sobre" },
  { label: "Como encomendar", href: "/#encomendar" },
];

// Legal information (/informacao-legal page). Identification lives in legal.json,
// editable through Pages CMS (see .pages.yml); "A COMPLETAR" = to ask Célia (TEXTOS.md).
export const legal = {
  ...legalData,
  // No regional arbitration centre for the Santarém district, so CNIACC is competent (to confirm)
  ral: { name: "CNIACC, Centro Nacional de Informação e Arbitragem de Conflitos de Consumo", url: "https://www.cniacc.pt" },
  complaints: "https://www.livroreclamacoes.pt",
};
