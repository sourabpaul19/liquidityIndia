import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const params = new URLSearchParams(rawBody);

    const order_id = params.get("order_id") || "";
    const quantiy = params.get("quantiy") || "";
    const shop_id = params.get("shop_id") || "";
    const user_id = params.get("user_id") || "";
    const redeem_date = params.get("redeem_date") || "";
    const redeem_time = params.get("redeem_time") || "";

    const forwardBody = new URLSearchParams();
    forwardBody.append("order_id", order_id);
    forwardBody.append("quantiy", quantiy);
    forwardBody.append("shop_id", shop_id);
    forwardBody.append("user_id", user_id);
    forwardBody.append("redeem_date", redeem_date);
    forwardBody.append("redeem_time", redeem_time);

    const response = await fetch(
      "https://dev2024.co.in/web/liquidity-india-backend/admin/api/redeemItemFromVault",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Accept: "application/json",
        },
        body: forwardBody.toString(),
      }
    );

    const text = await response.text();

    try {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } catch {
      return NextResponse.json(
        {
          status: "0",
          message: "Invalid backend response",
          error: text,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "0",
        message: "Proxy request failed",
        error: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}