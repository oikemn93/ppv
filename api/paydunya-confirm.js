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
    const status = String(data.status || "").toLowerCase();
    return res.status(r.ok ? 200 : 502).json({
      configured: true,
      sandbox: true,
      paid: status === "completed",
      status,
      receiptUrl: data.receipt_url || null,
      rawResponseCode: data.response_code || null
    });
  } catch (error) {
    return res.status(500).json({ error: "paydunya_unreachable" });
  }
}
