import type { APIRoute } from "astro";
import { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, EMAIL_FROM, EMAIL_TO } from "astro:env/server";
import { company } from "../../data/site";

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

// Photos de référence : 3 au plus, déjà réduites en JPEG par le navigateur.
// Vercel refuse de toute façon les requêtes de plus de 4,5 Mo.
const FOTOS = { max: 3, parFichier: 2 * 1024 * 1024, total: 4 * 1024 * 1024 } as const;

/** Type réel d'après les premiers octets (le nom et le type annoncés ne prouvent rien). */
const tipoImagem = (b: Uint8Array): "png" | "jpg" | null => {
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return "png";
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  return null;
};

export const POST: APIRoute = async ({ request }) => {
  if (Number(request.headers.get("content-length")) > FOTOS.total + 64 * 1024) {
    return json(413, { error: "As fotos são demasiado pesadas." });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json(400, { error: "Pedido ilegível." });
  }
  const payload: Record<string, unknown> = Object.fromEntries(
    [...form.entries()].filter(([, v]) => typeof v === "string"),
  );
  payload.tipo = form.getAll("tipo");

  // Photos : vérifiées octet par octet, renommées par nous (jamais le nom envoyé)
  const ficheiros = form.getAll("fotos").filter((f): f is File => typeof f !== "string");
  if (ficheiros.length > FOTOS.max) return json(400, { error: `No máximo ${FOTOS.max} fotos.` });
  let total = 0;
  const anexos: { filename: string; content: string; type: string; disposition: "attachment" }[] = [];
  for (const [i, f] of ficheiros.entries()) {
    total += f.size;
    if (f.size > FOTOS.parFichier || total > FOTOS.total) return json(413, { error: "As fotos são demasiado pesadas." });
    const bytes = new Uint8Array(await f.arrayBuffer());
    const ext = tipoImagem(bytes);
    if (!ext) return json(400, { error: "Apenas imagens PNG ou JPEG são aceites." });
    anexos.push({
      filename: `referencia-${i + 1}.${ext}`,
      content: Buffer.from(bytes).toString("base64"),
      type: ext === "png" ? "image/png" : "image/jpeg",
      disposition: "attachment",
    });
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

  // Envoi pas encore configuré (pas de jeton Cloudflare)
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN || !EMAIL_TO || !EMAIL_FROM) {
    if (import.meta.env.DEV) {
      console.info("[contacto] Mode démonstration, message non envoyé :", { nome, telefone, email, tipo, data, pessoas, fotos: anexos.map((a) => a.filename) });
      return json(200, { ok: true, demo: true });
    }
    console.error("[contacto] CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, EMAIL_FROM ou EMAIL_TO manquant");
    return json(503, { error: "O envio ainda não está disponível. Ligue ou envie mensagem pelo WhatsApp." });
  }

  const linhas: [string, string][] = [
    ["Nome", nome],
    ["Telefone", telefone],
    ["E-mail", email],
    ["Encomenda", tipo || "—"],
    ["Data do evento", data || "—"],
    ["Pessoas", pessoas || "—"],
    ["Fotos", anexos.length ? `${anexos.length} em anexo` : "—"],
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

  // Cloudflare Email Service (API REST). EMAIL_TO doit être une adresse de destination
  // vérifiée dans Email Routing : l'envoi est alors gratuit, sans offre Workers payante.
  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/email/sending/send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: { address: EMAIL_FROM, name: company.name },
        to: EMAIL_TO,
        // Répondre à l'e-mail répond directement au client
        reply_to: email,
        subject: `Nova encomenda pelo site — ${tipo || "sem tipo"} — ${nome}`,
        text: texto,
        html,
        ...(anexos.length && { attachments: anexos }),
      }),
    });
    const result = (await response.json().catch(() => null)) as { success?: boolean } | null;
    if (!response.ok || !result?.success) {
      console.error("Cloudflare a refusé l'envoi", response.status, JSON.stringify(result));
      return json(502, { error: "O envio falhou. Ligue ou envie mensagem pelo WhatsApp." });
    }
  } catch (error) {
    console.error("Appel à Cloudflare impossible", error);
    return json(502, { error: "O envio falhou. Ligue ou envie mensagem pelo WhatsApp." });
  }

  return json(200, { ok: true });
};
