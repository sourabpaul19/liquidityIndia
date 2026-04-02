import { NextResponse } from "next/server";

const API_BASE = "https://dev2024.co.in/web/liquidity-backend/admin/api";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const res = await fetch(`${API_BASE}/deleteFromVaultCart/${body.id}`, {
      method: "GET",
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { status: 0, message: "Failed to delete cart item" },
      { status: 500 }
    );
  }
}