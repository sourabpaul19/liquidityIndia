import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const { user_id, amount } = req.body;

  try {
    const response = await fetch("https://dev2024.co.in/web/liquidity-backend/admin/api/add_wallet_balance/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, amount }),
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("Server API error:", error);
    res.status(500).json({ message: "Server error" });
  }
}
