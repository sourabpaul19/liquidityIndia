import { NextResponse } from "next/server";

const API_BASE = "https://dev2024.co.in/web/liquidity-backend/admin/api";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const res = await fetch(`${API_BASE}/fetchVaultShops/${params.id}`, {
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { status: 0, message: "Failed to fetch vault shops" },
      { status: 500 }
    );
  }
}