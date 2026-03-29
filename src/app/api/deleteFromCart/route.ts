import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { user_id, device_id, item_id } = await req.json();

    const formData = new URLSearchParams();
    formData.append("user_id", user_id);
    formData.append("device_id", device_id);
    formData.append("item_id", item_id);

    const apiRes = await fetch(
      "https://dev2024.co.in/web/liquidity-backend/admin/api/deleteFromCart/",
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

    const text = await apiRes.text();

    // If HTML returned, it's an error
    if (!apiRes.ok || text.trim().startsWith("<")) {
      return NextResponse.json(
        {
          status: 0,
          message: "Proxy failed: API returned HTML instead of JSON",
          raw: text,
        },
        { status: 500 }
      );
    }

    const data = JSON.parse(text);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { status: 0, message: "Proxy failed", error: message },
      { status: 500 }
    );
  }
}
