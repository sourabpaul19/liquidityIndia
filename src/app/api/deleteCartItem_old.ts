import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const { itemId } = req.body;
  if (!itemId) return res.status(400).json({ message: "Missing itemId" });

  try {
    const response = await fetch(`https://dev2024.co.in/web/liquidity-backend/admin/api/deleteFromCart/${itemId}`, {
      method: "DELETE", // or POST if API requires
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}
