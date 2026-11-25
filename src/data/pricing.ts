// 2026 price list, copied from the Linktree PDFs (linktr.ee/Asdeliciasdacelia, October 2026).
// The data lives in pricing.json, editable through Pages CMS (see .pages.yml).
// Prices are text, as displayed; "Sob consulta" = price on request.
import data from "./pricing.json";

export type Item = { name: string; note?: string; price: string };
export type Group = { title: string; items: Item[]; footnote?: string; /** price column caption */ priceHead?: string };
export type Section = { id: string; label: string; intro: string; groups: Group[] };

export const sections: Section[] = data.sections;

/** "Brevemente" block at the bottom of the price list; `show: false` hides it. */
export const notice: { show: boolean; badge?: string; title: string; text: string } = data.notice;
