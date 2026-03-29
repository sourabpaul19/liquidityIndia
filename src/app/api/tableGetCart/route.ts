// app/api/tableGetCart/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { user_id = "", device_id = "" } = await req.json();

    console.log("🧺 [tableGetCart] START:", { user_id, device_id });

    if (!device_id) {
      return NextResponse.json(
        { status: 0, message: "Missing device_id" },
        { status: 400 }
      );
    }

    const backendUrl =
      "https://dev2024.co.in/web/liquidity-backend/admin/api/getTempCartDetailsForUser";

    const formData = new URLSearchParams();
    formData.append("user_id", user_id);   // can be "993" etc
    formData.append("device_id", device_id);

    console.log("🧺 BACKEND URL:", backendUrl);
    console.log("🧺 BODY:", formData.toString());

    const apiResponse = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: formData.toString(),
    });

    const text = await apiResponse.text();
    console.log("🧺 BACKEND STATUS:", apiResponse.status);
    console.log("🧺 BACKEND RAW (first 300):", text.slice(0, 300));

    if (!apiResponse.ok || text.trim().startsWith("<")) {
      return NextResponse.json(
        { status: 0, message: "Backend returned HTML or error", raw: text },
        { status: 500 }
      );
    }

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { status: 0, message: "Invalid JSON from backend", raw: text },
        { status: 500 }
      );
    }

    console.log(
      "✅ [tableGetCart] items:",
      (data.cartItems ?? data.cart_items ?? data.data ?? []).length
    );
    return NextResponse.json(data);
  } catch (err) {
    console.error("💥 [tableGetCart] error:", err);
    return NextResponse.json(
      { status: 0, message: "Proxy failed" },
      { status: 500 }
    );
  }
}
