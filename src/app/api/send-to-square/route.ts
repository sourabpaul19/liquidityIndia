// app/api/send-to-square/route.ts

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { order_id, device_id } = await req.json();

    if (!order_id || !device_id) {
      return NextResponse.json({ error: "Missing order_id or device_id" }, { status: 400 });
    }

    // 1️⃣ Fetch all orders for this device
    const listRes = await fetch(
      `https://admin.liquiditybars.com/admin/api/tblOrderList/${device_id}`
    );

    const listData = await listRes.json();

    if (listData.status !== "1" || !Array.isArray(listData.orders)) {
      return NextResponse.json({ error: "Could not fetch orders" }, { status: 500 });
    }

    // 2️⃣ Find the specific order
    const order = listData.orders.find((o: any) => String(o.id) === String(order_id));

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 3️⃣ Prepare Square line items
    const lineItems = order.products.map((p: any) => ({
      name: p.product_name,
      quantity: String(p.quantity),
      base_price_money: {
        amount: Math.round(parseFloat(p.price || "0") * 100),
        currency: "CAD",
    }
    }));

    // 4️⃣ Create OPEN Order in Square
    const squareRes = await fetch("https://connect.squareup.com/v2/orders", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "Square-Version": "2024-01-18"
      },
      body: JSON.stringify({
        order: {
          location_id: process.env.SQUARE_LOCATION_ID,
          reference_id: String(order_id),
          metadata: {
            liquidity_order_id: String(order_id),
            table_no: order.table_no || "",
          },
          line_items: lineItems
        }
      })
    });

    const squareData = await squareRes.json();

    if (!squareRes.ok) {
      //console.error("Square API error:", squareData);
      console.error("FULL SQUARE ERROR:", JSON.stringify(squareData, null, 2));
      return NextResponse.json({ error: squareData }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      square_order_id: squareData.order.id
    });

  } catch (err) {
    console.error("send-to-square error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}