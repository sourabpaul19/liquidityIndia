import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = body.id;
    const amount = body.amount;

    if (!id || !amount) {
      return NextResponse.json(
        { status: "0", message: "Missing id or amount" },
        { status: 400 }
      );
    }

    const formBody = new URLSearchParams({
      id: String(id),
      amount: String(amount),
    }).toString();

    const response = await fetch(
      "https://dev2024.co.in/web/liquidity-india-backend/admin/api/renewVault",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formBody,
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
          message: "Invalid backend response",
          raw: text,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        status: "0",
        message: error instanceof Error ? error.message : "Server error",
      },
      { status: 500 }
    );
  }
}