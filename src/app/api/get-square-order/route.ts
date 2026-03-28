// app/api/get-square-order/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const orderId = url.searchParams.get("order_id");

    if (!orderId) {
      return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
    }

    const res = await fetch(`https://connect.squareup.com/v2/orders/${orderId}`, {
      headers: {
        Authorization: `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
        "Square-Version": "2024-01-18",
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    if (!res.ok || !data.order) {
      return NextResponse.json({ error: "Failed to fetch order from Square", data }, { status: 500 });
    }

    return NextResponse.json({ order: data.order });
  } catch (err) {
    console.error("get-square-order error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}