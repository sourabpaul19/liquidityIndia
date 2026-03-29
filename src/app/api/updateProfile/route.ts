import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Convert to URL-encoded params
    const params = new URLSearchParams();
    Object.entries(body).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });

    // Call backend API
    const res = await fetch(
      "https://dev2024.co.in/web/liquidity-backend/admin/api/updateProfile/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      }
    );

    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { status: 0, message: "Invalid JSON from server", raw: text };
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Proxy failed:", error);

    const message =
      error instanceof Error ? error.message : "Unknown server error";

    return NextResponse.json(
      { status: 0, message: "Proxy failed", error: message },
      { status: 500 }
    );
  }
}
