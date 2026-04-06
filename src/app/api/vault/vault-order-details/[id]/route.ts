import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      { status: 0, message: "Order ID required" },
      { status: 400 }
    );
  }

  try {
    const backendUrl = `https://dev2024.co.in/web/liquidity-india-backend/admin/api/fetchVaultOrderDetails/${id}`;

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const data = await response.json();

    return NextResponse.json({
      status: Number(data?.status) === 1 ? 1 : 0,
      message: data?.message || "",
      vault_order: data?.vault_order || null,
    });
  } catch (error) {
    return NextResponse.json(
      { status: 0, message: "Failed to fetch order details" },
      { status: 500 }
    );
  }
}