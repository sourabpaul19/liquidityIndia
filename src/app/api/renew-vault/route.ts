import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("Proxy received body:", body);

    const formBody = new URLSearchParams();
    formBody.append("id", String(body.id ?? ""));
    formBody.append("amount", String(body.amount ?? ""));
    formBody.append("razorpay_payment_id", String(body.razorpay_payment_id ?? ""));
    formBody.append("razorpay_order_id", String(body.razorpay_order_id ?? ""));

    console.log("Proxy form data:", formBody.toString());

    const response = await fetch(
      "https://dev2024.co.in/web/liquidity-india-backend/admin/api/renewVault",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: formBody.toString(),
      }
    );

    const text = await response.text();

    try {
      return NextResponse.json(JSON.parse(text), { status: response.status });
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
    console.error("renew-vault proxy error:", error);
    return NextResponse.json(
      {
        status: "0",
        message: error instanceof Error ? error.message : "Server error",
      },
      { status: 500 }
    );
  }
}