// Preçário 2026, recopié des PDF du Linktree (linktr.ee/Asdeliciasdacelia, octobre 2026).
// Les données sont dans pricing.json, éditable via Pages CMS (voir .pages.yml).
// Prix en texte tel qu'affiché ; « Sob consulta » = prix sur demande.
import data from "./pricing.json";

export type Item = { name: string; note?: string; price: string };
export type Group = { title: string; items: Item[]; footnote?: string; /** légende de la colonne des prix */ priceHead?: string };
export type Section = { id: string; label: string; intro: string; groups: Group[] };

export const precario: Section[] = data.sections;

/** Bloc « Brevemente » en bas du preçário ; `show: false` le masque. */
export const notice: { show: boolean; badge?: string; title: string; text: string } = data.notice;
