// app/api/fetch-vault-products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    // Replace this URL with your actual backend endpoint
    const res = await fetch(
      `https://dev2024.co.in/web/liquidity-india-backend/admin/api/fetchVaultProducts/${id}`,
      {
        headers: {
          "Content-Type": "application/json",
          // Add auth headers if needed:
          // Authorization: `Bearer ${process.env.API_TOKEN}`,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { status: "0", message: "Failed to fetch vault products" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { status: "0", message: "Internal server error" },
      { status: 500 }
    );
  }
}