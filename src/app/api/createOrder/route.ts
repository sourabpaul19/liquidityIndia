import { NextResponse } from "next/server";

// --------------------
// TYPES
// --------------------
interface CartItem {
  product_id: string;
  quantity: string;
  price: string;
  mixer_id?: string;
  addon_id?: string;
}

interface RequestBody {
  user_id: string;
  device_id: string;
  pickup_location: string;
  total_amount: string;
  tips_amount: string;
  payment_method: string;
  cart_items: CartItem[];
}

// --------------------
// ROUTE HANDLER
// --------------------
export async function POST(req: Request): Promise<NextResponse> {
  try {
    // Parse JSON with full typing
    const body: RequestBody = await req.json();

    const form = new FormData();
    form.append("user_id", body.user_id);
    form.append("device_id", body.device_id);
    form.append("pickup_location", body.pickup_location);
    form.append("total_amount", body.total_amount);
    form.append("tips_amount", body.tips_amount);
    form.append("payment_method", body.payment_method);

    // Append cart items
    body.cart_items.forEach((item, index) => {
      form.append(`cart_items[${index}][product_id]`, item.product_id);
      form.append(`cart_items[${index}][quantity]`, item.quantity);
      form.append(`cart_items[${index}][price]`, item.price);
      form.append(`cart_items[${index}][mixer_id]`, item.mixer_id ?? "");
      form.append(`cart_items[${index}][addon_id]`, item.addon_id ?? "");
    });

    // Backend API call
    const response = await fetch(
      "https://dev2024.co.in/web/liquidity-backend/admin/api/createOrder/",
      {
        method: "POST",
        body: form,
      }
    );

    const text = await response.text();

    // If backend returns HTML instead of JSON
    if (text.trim().startsWith("<")) {
      return NextResponse.json(
        {
          status: 0,
          message: "Proxy failed: backend returned HTML instead of JSON",
          raw: text.substring(0, 500),
        },
        { status: 500 }
      );
    }

    // Parse backend JSON
    const data = JSON.parse(text) as unknown;
    return NextResponse.json(data);
  } catch (err) {
    console.error("Proxy error:", err);

    const message =
      err instanceof Error ? err.message : "Unknown error occurred";

    return NextResponse.json(
      {
        status: 0,
        message: "Proxy failed",
        error: message,
      },
      { status: 500 }
    );
  }
}
