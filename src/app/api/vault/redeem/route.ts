import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const response = await fetch(
      "https://dev2024.co.in/web/liquidity-india-backend/admin/api/redeemItemFromVault",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      }
    );

    const text = await response.text();

    try {
      const data = JSON.parse(text);
      return NextResponse.json(data, { status: response.status });
    } catch {
      return NextResponse.json(
        {
          status: "0",
          message: "Invalid response from redeem API",
          raw: text,
        },
        { status: response.status || 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        status: "0",
        message: "Proxy request failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}