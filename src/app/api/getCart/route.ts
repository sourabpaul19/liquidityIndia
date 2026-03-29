// app/api/getCart/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    let user_id: string | null = null;
    let device_id: string | null = null;

    const contentType = req.headers.get("content-type") || "";

    // Parse JSON body
    if (contentType.includes("application/json")) {
      const body: { user_id?: string; device_id?: string } = await req.json();
      user_id = body.user_id || null;
      device_id = body.device_id || "web";
    } 
    // Parse URL-encoded body
    else if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      const params = new URLSearchParams(text);
      user_id = params.get("user_id");
      device_id = params.get("device_id") || "web";
    } 
    else {
      return NextResponse.json(
        { status: 0, message: "Unsupported content type" },
        { status: 415 }
      );
    }

    if (!device_id) {
      return NextResponse.json(
        { status: 0, message: "Missing device_id" },
        { status: 400 }
      );
    }

    // Choose backend endpoint based on login status
    const backendUrl = user_id 
      ? "https://dev2024.co.in/web/liquidity-backend/admin/api/getCartDetailsForUser"
      : "https://dev2024.co.in/web/liquidity-backend/admin/api/getTempCartDetailsForUser";

    // Prepare backend request
    const formData = new URLSearchParams();
    formData.append("user_id", user_id || "");        // empty for guest
    formData.append("device_id", device_id);          // always required

    const apiResponse = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      body: formData.toString(),
    });

    const text = await apiResponse.text();

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

    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("getCart proxy failed:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { status: 0, message: "Proxy failed", error: message },
      { status: 500 }
    );
  }
}
