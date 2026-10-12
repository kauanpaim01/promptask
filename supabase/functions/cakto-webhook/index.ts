// Recebe os avisos da Cakto e libera ou bloqueia o acesso do aluno.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const SECRET = Deno.env.get("CAKTO_WEBHOOK_SECRET") ?? "";
const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const ACOES: Record<string, string> = {
  purchase_approved: "ativar",
  subscription_renewed: "ativar",
  subscription_late_recovered: "ativar",
  subscription_canceled: "cancelar",
  refund: "bloquear_reembolso",
  chargeback: "bloquear_chargeback",
};

function igual(a: string, b: string) {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  if (x.length !== y.length) return false;
  let d = 0;
  for (let i = 0; i < x.length; i++) d |= x[i] ^ y[i];
  return d === 0;
}

async function hmac(chave: string, msg: string) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(chave),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Aceita a chave no corpo OU a assinatura no cabeçalho. Devolve o motivo quando recusa (sem expor a chave).
async function autenticado(req: Request, bruto: string, corpo: any): Promise<string | null> {
  const secret = (Deno.env.get("CAKTO_WEBHOOK_SECRET") ?? SECRET).trim();
  if (!secret) return "CAKTO_WEBHOOK_SECRET não configurado no Supabase";
  if (typeof corpo?.secret === "string" && igual(corpo.secret.trim(), secret)) return null;
  const ts = req.headers.get("x-cakto-timestamp");
  const sig = req.headers.get("x-cakto-signature");
  if (ts && sig) {
    let t = Number(ts); if (t > 1e12) t = t / 1000;
    if (Math.abs(Date.now() / 1000 - t) > 300) return "assinatura com horário fora da janela de 5 minutos";
    const recebida = sig.replace(/^v1=/, "").trim();
    const hex = await hmac(secret, `${ts}.${bruto}`);
    const b64 = btoa(String.fromCharCode(...hex.match(/../g)!.map((h) => parseInt(h, 16))));
    if (igual(recebida.toLowerCase(), hex) || igual(recebida, b64)) return null;
    const tamCorpo = typeof corpo?.secret === "string" ? corpo.secret.length : 0;
    return `assinatura do cabeçalho não confere (formato ${sig.slice(0, 3)}…, ${recebida.length} caracteres; ts ${String(ts).length} dígitos; chave no corpo ${tamCorpo} caracteres; chave configurada ${secret.length} caracteres)`;
  }
  const tam = typeof corpo?.secret === "string" ? corpo.secret.length : 0;
  return `chave do corpo não confere (recebida com ${tam} caracteres, configurada com ${secret.length})`;
}

// "Promptask · 2 IAs · Anual" -> { plano: 2, periodo: "anual" }
function lerPlano(...nomes: (string | undefined)[]) {
  const t = nomes.filter(Boolean).join(" ").toLowerCase();
  let plano = 0;
  if (/todas/.test(t)) plano = 4;
  else { const m = t.match(/(\d)\s*ias?\b/); if (m) plano = Math.min(Number(m[1]), 4); }
  const periodo = /anual/.test(t) ? "anual" : "mensal";
  return { plano, periodo };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Método não permitido", { status: 405 });
  const bruto = await req.text();
  let corpo: any;
  try { corpo = JSON.parse(bruto); } catch { return new Response("JSON inválido", { status: 400 }); }
  const recusa = await autenticado(req, bruto, corpo);
  if (recusa) {
    await db.from("eventos_pagamento").insert({ evento: corpo?.event ?? null, erro: "recusado: " + recusa, processado: false });
    return new Response("Não autorizado", { status: 401 });
  }

  const evento: string = corpo.event ?? "";
  const lista = Array.isArray(corpo.data) ? corpo.data : [corpo.data ?? {}];
  const d = lista.find((x: any) => x?.offer_type === "main") ?? lista[0] ?? {};
  const email: string = (d.customer?.email ?? d.customerEmail ?? "").toLowerCase().trim();
  const produto: string = d.product?.name ?? "";
  const { plano, periodo } = lerPlano(produto, d.offer?.name);
  const acao = ACOES[evento];

  const registro: Record<string, unknown> = {
    evento, email, produto, pedido_id: d.id ?? null,
    payload: { ...corpo, secret: undefined },
  };

  try {
    if (!acao) {
      registro.processado = true;
      registro.erro = "evento ignorado";
    } else if (!email) {
      registro.erro = "e-mail do comprador ausente";
    } else if (acao === "ativar" && (d.status && d.status !== "paid")) {
      registro.erro = `status ${d.status}, não liberado`;
    } else if (acao === "ativar" && !plano) {
      registro.erro = "não identifiquei o plano pelo nome do produto";
    } else {
      const { error } = await db.rpc("aplicar_evento_cakto", {
        p_email: email, p_plano: plano || 1, p_periodo: periodo, p_acao: acao,
        p_pago_em: d.paidAt ?? null,
      });
      if (error) registro.erro = error.message; else registro.processado = true;
    }
  } catch (e) {
    registro.erro = String(e);
  }

  await db.from("eventos_pagamento").insert(registro);
  return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
});
