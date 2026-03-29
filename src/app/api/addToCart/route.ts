// app/api/addToCart/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const text = await req.text();
    const params = new URLSearchParams(text);
    
    const user_id = params.get("user_id") || "";
    const device_id = params.get("device_id") || "";

    if (!device_id) {
      return NextResponse.json(
        { status: "0", message: "Missing device_id" },
        { status: 400 }
      );
    }

    // ✅ ROUTE BY user_id PRESENCE
    const endpoint = user_id 
      ? "https://dev2024.co.in/web/liquidity-backend/admin/api/addMultipleCartItems/"
      : "https://dev2024.co.in/web/liquidity-backend/admin/api/addMultipleTempCartItems";

    console.log("→ ENDPOINT:", endpoint);
    console.log("PAYLOAD:", params.toString());

    const backendRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json, text/plain, */*",
      },
      body: params.toString(),
    });

    const responseText = await backendRes.text();
    console.log("BACKEND RAW (200 chars):", responseText.slice(0, 200));

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        { status: "0", message: "Backend returned non-JSON", raw: responseText.slice(0, 500) },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("Proxy error:", err);
    return NextResponse.json(
      { status: "0", message: "Proxy error" },
      { status: 500 }
    );
  }
}
