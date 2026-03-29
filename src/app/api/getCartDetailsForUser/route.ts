import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, device_id } = body;

    if (!user_id || !device_id) {
      return NextResponse.json(
        { status: 0, message: "Missing user_id or device_id" },
        { status: 400 }
      );
    }

    const formData = new URLSearchParams();
    formData.append("user_id", user_id);
    formData.append("device_id", device_id);

    const apiResponse = await fetch(
      "https://dev2024.co.in/web/liquidity-backend/admin/api/getCartDetailsForUser/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: formData.toString(),
        cache: "no-store",
      }
    );

    const text = await apiResponse.text();

    if (!apiResponse.ok) {
      console.error("Backend getCart failed:", apiResponse.status, text);
      return NextResponse.json(
        { status: 0, message: "Backend error", raw: text },
        { status: 502 }
      );
    }

    if (text.trim().startsWith("<")) {
      return NextResponse.json(
        {
          status: 0,
          message: "Backend returned HTML instead of JSON",
          raw: text,
        },
        { status: 500 }
      );
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { status: 0, message: "Invalid JSON from backend", raw: text },
        { status: 500 }
      );
    }

    return NextResponse.json(data);

  } catch (error: unknown) {
    // Safe error extraction
    const message =
      error instanceof Error ? error.message : "Unknown error";

    console.error("Error in getCart proxy:", message);

    return NextResponse.json(
      { status: 0, message: "Internal server error", error: message },
      { status: 500 }
    );
  }
}
