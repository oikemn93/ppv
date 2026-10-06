import crypto from "node:crypto";

const SUPABASE_URL = "https://kfsjemncncergnotngmw.supabase.co";
const SUPABASE_KEY = "sb_publishable_1Q4aU2_nsIySRPsCpKu4CA_C-x89d1m";

function asObject(body) {
  if (body && typeof body === "object") return body;
  if (typeof body === "string") return Object.fromEntries(new URLSearchParams(body));
  return {};
}

function normalizePayload(body) {
  const source = asObject(body);

  if (source.data && typeof source.data === "object") return source.data;
  if (typeof source.data === "string") {
    try {
      const parsed = JSON.parse(source.data);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {}
  }

  const get = (...keys) => {
    for (const key of keys) {
      if (source[key] !== undefined && source[key] !== null) return source[key];
    }
    return undefined;
  };

  return {
    hash: get("data[hash]", "hash"),
    status: get("data[status]", "status"),
    invoice: {
      token: get("data[invoice][token]", "invoice[token]", "token"),
      total_amount: get("data[invoice][total_amount]", "invoice[total_amount]", "total_amount")
    },
    custom_data: {
      event_id: get("data[custom_data][event_id]", "custom_data[event_id]", "event_id")
    },
    mode: get("data[mode]", "mode"),
    receipt_url: get("data[receipt_url]", "receipt_url")
  };
}

function expectedHash(masterKey) {
  return crypto.createHash("sha512").update(masterKey).digest("hex");
}

function safeEqual(a, b) {
  const aa = Buffer.from(String(a || "").toLowerCase());
  const bb = Buffer.from(String(b || "").toLowerCase());
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

async function finalize(payload) {
  const secret = process.env.PAYMENT_BRIDGE_SECRET;
  if (!secret) throw new Error("payment_bridge_not_configured");
  const r = await fetch(SUPABASE_URL + "/functions/v1/payment-bridge", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      "x-ppv-bridge-secret": secret
    },
    body: JSON.stringify({ action: "finalize", payload })
  });
  const text = await r.text();
  if (!r.ok) throw new Error("payment_bridge_finalize_failed:" + text.slice(0, 180));
  return text ? JSON.parse(text) : {};
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("method_not_allowed");

  const masterKey = process.env.PAYDUNYA_MASTER_KEY;
  if (!masterKey) return res.status(503).send("paydunya_not_configured");

  const payload = normalizePayload(req.body);
  if (!payload?.hash || !safeEqual(payload.hash, expectedHash(masterKey))) {
    return res.status(403).send("invalid_paydunya_signature");
  }

  try {
    await finalize(payload);
    return res.status(200).send("OK");
  } catch (error) {
    console.error("PayDunya IPN finalize error", error);
    return res.status(500).send("payment_finalize_failed");
  }
}
