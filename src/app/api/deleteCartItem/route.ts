// app/api/deleteCartItem/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const user_id = form.get("user_id")?.toString() || "";
    const item_id = form.get("item_id")?.toString() || "";

    if (!user_id || !item_id) {
      return NextResponse.json(
        { status: 0, message: "Missing user_id or item_id" },
        { status: 400 }
      );
    }

    const backendUrl = `https://dev2024.co.in/web/liquidity-backend/admin/api/deleteFromCart/${item_id}`;

    const apiResponse = await fetch(backendUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    const text = await apiResponse.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { status: 0, message: "Backend returned HTML", raw: text },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { status: 0, message: "Server error", error: String(err) },
      { status: 500 }
    );
  }
}
