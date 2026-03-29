import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { user_id, device_id } = await req.json();

    if (!user_id || !device_id) {
      return NextResponse.json(
        { status: "0", message: "Missing parameters" },
        { status: 400 }
      );
    }

    // Correct API (user_id directly in URL)
    const getCartURL = `https://dev2024.co.in/web/liquidity-backend/admin/api/clearCartForUser/${user_id}`;

    // Fetch current cart items
    const cartRes = await fetch(getCartURL, { method: "GET" });

    const rawText = await cartRes.text();
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    const cartData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    const cartItems =
      cartData?.cartItems || cartData?.cart_items || [];

    // No items → already empty
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ status: "1", message: "Cart already empty" });
    }

    // Delete each cart item
    for (const item of cartItems) {
      try {
        await fetch("/api/deleteCartItem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId: item.id }),
        });
      } catch (e) {
        console.error("Delete item failed:", item.id, e);
      }
    }

    return NextResponse.json({ status: "1", message: "Cart cleared" });
  } catch (err) {
    console.error("deleteAllCartItems ERROR:", err);
    return NextResponse.json(
      { status: "0", message: "Server error clearing cart" },
      { status: 500 }
    );
  }
}
