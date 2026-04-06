import { NextRequest, NextResponse } from "next/server";

const API_BASE = "https://dev2024.co.in/web/liquidity-india-backend/admin/api";

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/vault-shops/[id]">
) {
  try {
    const { id } = await ctx.params;

    const res = await fetch(`${API_BASE}/fetchVaultShops/${id}`, {
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