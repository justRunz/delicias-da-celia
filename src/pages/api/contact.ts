import type { APIRoute } from "astro";
import { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, EMAIL_FROM, EMAIL_TO } from "astro:env/server";
import { company } from "../../data/site";

// Route rendered on demand; the rest of the site stays static.
export const prerender = false;

const MAX = { short: 120, long: 4000 } as const;

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const clean = (value: unknown, max: number) =>
  typeof value === "string" ? value.replace(/\r\n?/g, "\n").trim().slice(0, max) : "";

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const PARAGRAPH_STYLE = "font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;margin:0 0 12px";

/** Line breaks as tags, since Gmail strips `white-space: pre-wrap` from inline styles. */
const toParagraphs = (value: string) =>
  value
    .split(/\n{2,}/)
    .map((block) => `<p style="${PARAGRAPH_STYLE}">${escapeHtml(block).replace(/\n/g, "<br>")}</p>`)
    .join("");

/** "2026-10-18" → "18/10/2026" */
const toPtDate = (iso: string) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.split("-").reverse().join("/") : iso);

// Reference photos: 3 at most, already shrunk to JPEG by the browser.
// Vercel rejects requests over 4.5 MB anyway.
const PHOTOS = { max: 3, perFile: 2 * 1024 * 1024, total: 4 * 1024 * 1024 } as const;

/** Real type from the first bytes (the declared name and type prove nothing). */
const imageType = (b: Uint8Array): "png" | "jpg" | null => {
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return "png";
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  return null;
};

export const POST: APIRoute = async ({ request }) => {
  if (Number(request.headers.get("content-length")) > PHOTOS.total + 64 * 1024) {
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
  payload.type = form.getAll("type");

  // Photos are checked byte by byte and renamed by us (never the uploaded name)
  const files = form.getAll("photos").filter((f): f is File => typeof f !== "string");
  if (files.length > PHOTOS.max) return json(400, { error: `No máximo ${PHOTOS.max} fotos.` });
  let total = 0;
  const attachments: { filename: string; content: string; type: string; disposition: "attachment" }[] = [];
  for (const [i, f] of files.entries()) {
    total += f.size;
    if (f.size > PHOTOS.perFile || total > PHOTOS.total) return json(413, { error: "As fotos são demasiado pesadas." });
    const bytes = new Uint8Array(await f.arrayBuffer());
    const ext = imageType(bytes);
    if (!ext) return json(400, { error: "Apenas imagens PNG ou JPEG são aceites." });
    attachments.push({
      filename: `referencia-${i + 1}.${ext}`,
      content: Buffer.from(bytes).toString("base64"),
      type: ext === "png" ? "image/png" : "image/jpeg",
      disposition: "attachment",
    });
  }

  // Honeypot: hidden field only a script fills in. We reply "sent".
  if (clean(payload.website, MAX.short)) return json(200, { ok: true });

  const name = clean(payload.name, MAX.short);
  const phone = clean(payload.phone, MAX.short);
  const email = clean(payload.email, MAX.short);
  // One or more checked types (array), or a single value
  const types = (Array.isArray(payload.type) ? payload.type : [payload.type])
    .map((t) => clean(t, MAX.short))
    .filter(Boolean)
    .slice(0, 10);
  const type = types.join(", ");
  const dateIso = clean(payload.date, MAX.short);
  const date = toPtDate(dateIso);
  const people = clean(payload.people, MAX.short);
  const message = clean(payload.message, MAX.long);

  if (!name || !phone || !email || !message) {
    return json(400, { error: "O nome, o telefone, o e-mail e a mensagem são necessários." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return json(400, { error: "O endereço de e-mail parece incorreto." });
  }

  // Event date must be tomorrow or later (same-day orders go by phone).
  // Compared in UTC. Portugal is UTC or UTC+1, so the gap is one hour at most.
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) {
    const today = new Date().toISOString().slice(0, 10);
    if (dateIso <= today) {
      return json(400, { error: "Para encomendas para hoje ou datas passadas, ligue ou envie mensagem pelo WhatsApp." });
    }
  }

  // Sending not configured yet (no Cloudflare token)
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN || !EMAIL_TO || !EMAIL_FROM) {
    if (import.meta.env.DEV) {
      console.info("[contact] Demo mode, message not sent:", { name, phone, email, type, date, people, photos: attachments.map((a) => a.filename) });
      return json(200, { ok: true, demo: true });
    }
    console.error("[contact] CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, EMAIL_FROM or EMAIL_TO missing");
    return json(503, { error: "O envio ainda não está disponível. Ligue ou envie mensagem pelo WhatsApp." });
  }

  const rows: [string, string][] = [
    ["Nome", name],
    ["Telefone", phone],
    ["E-mail", email],
    ["Encomenda", type || "—"],
    ["Data do evento", date || "—"],
    ["Pessoas", people || "—"],
    ["Fotos", attachments.length ? `${attachments.length} em anexo` : "—"],
  ];

  const text = [...rows.map(([l, v]) => `${l}: ${v}`), "", message].join("\n");
  const html = `
    <table style="font-family:system-ui,sans-serif;font-size:15px;border-collapse:collapse">
      ${rows
        .map(
          ([l, v]) => `<tr>
            <td style="padding:4px 16px 4px 0;color:#7c695e">${l}</td>
            <td style="padding:4px 0"><strong>${escapeHtml(v)}</strong></td>
          </tr>`,
        )
        .join("")}
    </table>
    <div style="border-top:1px solid #e2d5c5;margin-top:16px;padding-top:16px">${toParagraphs(message)}</div>
  `;

  // Cloudflare Email Service (REST API). EMAIL_TO must be a verified destination address
  // in Email Routing, which keeps sending free without a paid Workers plan.
  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/email/sending/send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: { address: EMAIL_FROM, name: company.name },
        to: EMAIL_TO,
        // Replying to the e-mail replies straight to the customer
        reply_to: email,
        subject: `Nova encomenda pelo site — ${type || "sem tipo"} — ${name}`,
        text,
        html,
        ...(attachments.length && { attachments: attachments }),
      }),
    });
    const result = (await response.json().catch(() => null)) as { success?: boolean } | null;
    if (!response.ok || !result?.success) {
      console.error("Cloudflare rejected the e-mail", response.status, JSON.stringify(result));
      return json(502, { error: "O envio falhou. Ligue ou envie mensagem pelo WhatsApp." });
    }
  } catch (error) {
    console.error("Could not reach Cloudflare", error);
    return json(502, { error: "O envio falhou. Ligue ou envie mensagem pelo WhatsApp." });
  }

  return json(200, { ok: true });
};
