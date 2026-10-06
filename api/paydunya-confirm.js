import crypto from "node:crypto";

const SUPABASE_URL = "https://kfsjemncncergnotngmw.supabase.co";
const SUPABASE_KEY = "sb_publishable_1Q4aU2_nsIySRPsCpKu4CA_C-x89d1m";

function expectedHash(masterKey) {
  return crypto.createHash("sha512").update(masterKey).digest("hex");
}
function safeEqual(a, b) {
  const aa = Buffer.from(String(a || "").toLowerCase());
  const bb = Buffer.from(String(b || "").toLowerCase());
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}
async function bridge(action, body) {
  const secret = process.env.PAYMENT_BRIDGE_SECRET;
  if (!secret) throw new Error("payment_bridge_not_configured");
  const r = await fetch(SUPABASE_URL + "/functions/v1/payment-bridge", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      "x-ppv-bridge-secret": secret
    },
    body: JSON.stringify({ action, ...body })
  });
  const text = await r.text();
  if (!r.ok) throw new Error(action + ":" + text.slice(0, 200));
  const parsed = text ? JSON.parse(text) : {};
  return parsed.result;
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });

  const masterKey = process.env.PAYDUNYA_MASTER_KEY;
  const privateKey = process.env.PAYDUNYA_PRIVATE_KEY;
  const apiToken = process.env.PAYDUNYA_TOKEN;
  const invoiceToken = String(req.query.token || "");

  if (!masterKey || !privateKey || !apiToken) {
    return res.status(200).json({ configured: false, sandbox: true });
  }
  if (!invoiceToken) return res.status(400).json({ error: "missing_token" });

  try {
    const r = await fetch(
      "https://app.paydunya.com/sandbox-api/v1/checkout-invoice/confirm/" + encodeURIComponent(invoiceToken),
      {
        headers: {
          "Content-Type": "application/json",
          "PAYDUNYA-MASTER-KEY": masterKey,
          "PAYDUNYA-PRIVATE-KEY": privateKey,
          "PAYDUNYA-TOKEN": apiToken
        }
      }
    );

    const data = await r.json();
    if (!r.ok || data.response_code !== "00") {
      return res.status(502).json({ error: "paydunya_confirm_failed" });
    }

    if (!safeEqual(data.hash, expectedHash(masterKey))) {
      return res.status(403).json({ error: "invalid_paydunya_signature" });
    }

    const status = String(data.status || "").toLowerCase();
    data.invoice = data.invoice || {};
    data.invoice.token = data.invoice.token || invoiceToken;

    await bridge("finalize", { payload: data });

    if (status !== "completed") {
      return res.status(200).json({
        configured: true,
        sandbox: true,
        paid: false,
        status,
        receiptUrl: data.receipt_url || null
      });
    }

    const claimed = await bridge("claim", { token: invoiceToken });
    const pass = Array.isArray(claimed) ? claimed[0] : claimed;

    if (!pass?.code) return res.status(500).json({ error: "pass_claim_failed" });

    return res.status(200).json({
      configured: true,
      sandbox: true,
      paid: true,
      status,
      code: pass.code,
      eventId: pass.event_id,
      receiptUrl: data.receipt_url || null
    });
  } catch (error) {
    console.error("PayDunya confirmation error", error);
    return res.status(500).json({ error: "payment_confirmation_failed" });
  }
}
