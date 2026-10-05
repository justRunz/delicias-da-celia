import type { APIRoute } from "astro";
import { RESEND_API_KEY, EMAIL_FROM, EMAIL_TO } from "astro:env/server";

// Route rendue à la demande : le reste du site reste statique.
export const prerender = false;

const MAX = { court: 120, long: 4000 } as const;

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const clean = (value: unknown, max: number) =>
  typeof value === "string" ? value.replace(/\r\n?/g, "\n").trim().slice(0, max) : "";

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const STYLE_PARAGRAPHE = "font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;margin:0 0 12px";

/** Sauts de ligne en balises : Gmail retire `white-space: pre-wrap` des styles en ligne. */
const enParagraphes = (value: string) =>
  value
    .split(/\n{2,}/)
    .map((bloc) => `<p style="${STYLE_PARAGRAPHE}">${escapeHtml(bloc).replace(/\n/g, "<br>")}</p>`)
    .join("");

/** « 2026-10-18 » → « 18/10/2026 » */
const dataPt = (iso: string) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.split("-").reverse().join("/") : iso);

export const POST: APIRoute = async ({ request }) => {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return json(400, { error: "Pedido ilegível." });
  }

  // Piège à robots : champ masqué que seul un script remplit. On répond « enviado ».
  if (clean(payload.website, MAX.court)) return json(200, { ok: true });

  const nome = clean(payload.nome, MAX.court);
  const telefone = clean(payload.telefone, MAX.court);
  const email = clean(payload.email, MAX.court);
  // Un ou plusieurs types cochés (tableau), ou une seule valeur
  const tipos = (Array.isArray(payload.tipo) ? payload.tipo : [payload.tipo])
    .map((t) => clean(t, MAX.court))
    .filter(Boolean)
    .slice(0, 10);
  const tipo = tipos.join(", ");
  const dataIso = clean(payload.data, MAX.court);
  const data = dataPt(dataIso);
  const pessoas = clean(payload.pessoas, MAX.court);
  const mensagem = clean(payload.mensagem, MAX.long);

  if (!nome || !telefone || !email || !mensagem) {
    return json(400, { error: "O nome, o telefone, o e-mail e a mensagem são necessários." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return json(400, { error: "O endereço de e-mail parece incorreto." });
  }

  // Date de l'événement : à partir de demain (le jour même se commande par téléphone).
  // Comparaison en UTC : le Portugal est à UTC ou UTC+1, l'écart reste d'une heure au plus.
  if (/^\d{4}-\d{2}-\d{2}$/.test(dataIso)) {
    const hoje = new Date().toISOString().slice(0, 10);
    if (dataIso <= hoje) {
      return json(400, { error: "Para encomendas para hoje ou datas passadas, ligue ou envie mensagem pelo WhatsApp." });
    }
  }

  // Envoi pas encore configuré (pas de clé Resend)
  if (!RESEND_API_KEY || !EMAIL_TO || !EMAIL_FROM) {
    if (import.meta.env.DEV) {
      console.info("[contacto] Mode démonstration, message non envoyé :", { nome, telefone, email, tipo, data, pessoas });
      return json(200, { ok: true, demo: true });
    }
    console.error("[contacto] RESEND_API_KEY, EMAIL_FROM ou EMAIL_TO manquant");
    return json(503, { error: "O envio ainda não está disponível. Ligue ou envie mensagem pelo WhatsApp." });
  }

  const linhas: [string, string][] = [
    ["Nome", nome],
    ["Telefone", telefone],
    ["E-mail", email],
    ["Encomenda", tipo || "—"],
    ["Data do evento", data || "—"],
    ["Pessoas", pessoas || "—"],
  ];

  const texto = [...linhas.map(([l, v]) => `${l}: ${v}`), "", mensagem].join("\n");
  const html = `
    <table style="font-family:system-ui,sans-serif;font-size:15px;border-collapse:collapse">
      ${linhas
        .map(
          ([l, v]) => `<tr>
            <td style="padding:4px 16px 4px 0;color:#7c695e">${l}</td>
            <td style="padding:4px 0"><strong>${escapeHtml(v)}</strong></td>
          </tr>`,
        )
        .join("")}
    </table>
    <div style="border-top:1px solid #e2d5c5;margin-top:16px;padding-top:16px">${enParagraphes(mensagem)}</div>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [EMAIL_TO],
        // Répondre à l'e-mail répond directement au client
        reply_to: email,
        subject: `Nova encomenda pelo site — ${tipo || "sem tipo"} — ${nome}`,
        text: texto,
        html,
      }),
    });
    if (!response.ok) {
      console.error("Resend a refusé l'envoi", response.status, await response.text());
      return json(502, { error: "O envio falhou. Ligue ou envie mensagem pelo WhatsApp." });
    }
  } catch (error) {
    console.error("Appel à Resend impossible", error);
    return json(502, { error: "O envio falhou. Ligue ou envie mensagem pelo WhatsApp." });
  }

  return json(200, { ok: true });
};
