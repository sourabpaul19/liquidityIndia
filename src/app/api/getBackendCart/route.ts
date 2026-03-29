import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { user_id, device_id } = await req.json();

    if (!device_id) {
      return NextResponse.json(
        { status: "0", message: "Missing device_id" },
        { status: 400 }
      );
    }

    const body = new URLSearchParams();
    body.append("device_id", device_id);
    if (user_id) body.append("user_id", user_id);

    const backendRes = await fetch(
      "https://dev2024.co.in/web/liquidity-backend/admin/api/getTempCartDetailsForUser/",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      }
    );

    const text = await backendRes.text();

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        {
          status: "0",
          message: "Backend returned non-JSON",
          raw: text.slice(0, 500),
        },
        { status: 500 }
      );
    }

    const rawItems = data.cartItems ?? data.data ?? [];

    const cartItems = Array.isArray(rawItems)
      ? rawItems.map((ci: any) => ({
          id: String(ci.id ?? ci.cart_item_id ?? ci.product_id ?? ""),
          name: ci.product_name ?? ci.name ?? "",
          price: Number(ci.price ?? ci.product_price ?? 0),
          quantity: Number(ci.quantity ?? ci.cart_quantity ?? 1),
          choice_of_mixer_name: ci.choice_of_mixer_name ?? "",
          extraShotQty: Number(ci.shot_count ?? 0),
          specialInstructions: ci.special_instruction ?? "",
        }))
      : [];

    return NextResponse.json({
      status: data.status,
      message: data.message,
      cartItems,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "0",
        message: "Error in proxy",
        error: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
