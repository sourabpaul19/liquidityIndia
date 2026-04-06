import { NextResponse } from "next/server";

const API_BASE = "https://dev2024.co.in/web/liquidity-backend/admin/api";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const params = new URLSearchParams();
    params.append("customer_name", body.customer_name || "");
    params.append("customer_email", body.customer_email || "");
    params.append("customer_mobile", body.customer_mobile || "");
    params.append("user_id", body.user_id || "");
    params.append("transaction_id", body.transaction_id || "");
    params.append("device_id", body.device_id || "");
    params.append("payment_type", body.payment_type || "");

    const res = await fetch(`${API_BASE}/createVaultOrder`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: params.toString(),
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { status: "0", message: "Failed to create order" },
      { status: 500 }
    );
  }
}