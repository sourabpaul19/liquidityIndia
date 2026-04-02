import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // ← Promise type
) {
  try {
    const { id } = await params; // ← await before accessing

    const res = await fetch(
      `https://dev2024.co.in/web/liquidity-india-backend/admin/api/fetchSubCategories/${id}`,
      { cache: "no-store" }
    );

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { status: "0", message: "Failed to fetch subcategories" },
      { status: 500 }
    );
  }
}