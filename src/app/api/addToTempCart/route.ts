import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // Read URL-encoded body from frontend
    const text = await req.text();
    const params = new URLSearchParams(text);

    // Send to Liquidity backend as x-www-form-urlencoded
    const backendRes = await fetch(
      "https://dev2024.co.in/web/liquidity-backend/admin/api/addToTempCart/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json, text/plain, */*",
        },
        body: params.toString(),
      }
    );

    const responseText = await backendRes.text();

    // Try parse JSON safely
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        { status: "0", message: "Backend returned non-JSON", raw: responseText },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";

    return NextResponse.json(
      { status: "0", message: "Error in API", error: message },
      { status: 500 }
    );
  }
}
