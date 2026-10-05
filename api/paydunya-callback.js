export default async function handler(req, res) {
  // Endpoint Sandbox PayDunya. En production, ce callback écrira le paiement
  // vérifié dans Supabase avant de générer le droit PPV.
  if (req.method !== "POST") return res.status(405).send("method_not_allowed");
  return res.status(200).send("OK");
}
