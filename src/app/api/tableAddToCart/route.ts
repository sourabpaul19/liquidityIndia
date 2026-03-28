// app/api/tableAddToCart/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const text = await req.text();
    const params = new URLSearchParams(text);

    const user_id = params.get("user_id") || "";
    const device_id = params.get("device_id") || "";

    console.log("🛒 [tableAddToCart] START");
    console.log("🛒 BODY RAW:", text);
    console.log("🛒 user_id:", user_id || "EMPTY");
    console.log("🛒 device_id:", device_id || "EMPTY");

    if (!device_id) {
      return NextResponse.json(
        { status: "0", message: "Missing device_id" },
        { status: 400 }
      );
    }

    const endpoint =
      "https://admin.liquiditybars.com/admin/api/addMultipleTempCartItems/";

    console.log("🛒 BACKEND URL:", endpoint);

    const backendRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json, text/plain, */*",
      },
      body: params.toString(), // ← exactly same as old app
    });

    const responseText = await backendRes.text();
    console.log("🛒 BACKEND STATUS:", backendRes.status);
    console.log("🛒 BACKEND RAW (first 300):", responseText.slice(0, 300));

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        { status: "0", message: "Backend returned non-JSON", raw: responseText.slice(0, 500) },
        { status: 500 }
      );
    }

    console.log("✅ [tableAddToCart] JSON:", data);
    return NextResponse.json(data);
  } catch (err) {
    console.error("💥 [tableAddToCart] error:", err);
    return NextResponse.json({ status: "0", message: "Proxy error" }, { status: 500 });
  }
}
