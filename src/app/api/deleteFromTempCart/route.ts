import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { id } = await req.json(); // Expects { id: "item123" }

    if (!id) {
      return NextResponse.json(
        { status: 0, message: "Missing id" },
        { status: 400 }
      );
    }

    const url = `https://dev2024.co.in/web/liquidity-backend/admin/api/deleteFromTempCart/${id}`;

    const apiRes = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json, text/plain, */*",
      },
      cache: "no-store",
    });

    const text = await apiRes.text();

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
