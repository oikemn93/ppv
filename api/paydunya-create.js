export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  const masterKey = process.env.PAYDUNYA_MASTER_KEY;
  const privateKey = process.env.PAYDUNYA_PRIVATE_KEY;
  const token = process.env.PAYDUNYA_TOKEN;

  if (!masterKey || !privateKey || !token) {
    return res.status(200).json({
      configured: false,
      sandbox: true,
      message: "PayDunya Sandbox n'est pas encore configuré sur Vercel."
    });
  }

  const { amount, description, returnUrl, cancelUrl, callbackUrl, customer, customData } = req.body || {};
  const total = Number(amount);

  if (!Number.isFinite(total) || total <= 0) {
    return res.status(400).json({ error: "invalid_amount" });
  }

  const payload = {
    invoice: {
      total_amount: total,
      description: String(description || "Pass PPV"),
      customer: customer || undefined
    },
    store: {
      name: "Lamb Live"
    },
    actions: {
      cancel_url: cancelUrl,
      return_url: returnUrl,
      callback_url: callbackUrl
    },
    custom_data: customData || {}
  };

  try {
    const r = await fetch("https://app.paydunya.com/sandbox-api/v1/checkout-invoice/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "PAYDUNYA-MASTER-KEY": masterKey,
        "PAYDUNYA-PRIVATE-KEY": privateKey,
        "PAYDUNYA-TOKEN": token
      },
      body: JSON.stringify(payload)
    });

    const data = await r.json();
    if (!r.ok || data.response_code !== "00") {
      return res.status(502).json({ error: "paydunya_create_failed", details: data });
    }

    return res.status(200).json({
      configured: true,
      sandbox: true,
      checkoutUrl: data.response_text,
      invoiceToken: data.token
    });
  } catch (error) {
    return res.status(500).json({ error: "paydunya_unreachable" });
  }
}
