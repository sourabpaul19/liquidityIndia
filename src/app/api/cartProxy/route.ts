import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const backendRes = await fetch(
      "https://dev2024.co.in/web/liquidity-backend/admin/api/addMultipleCartItems/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Add any auth headers here if required by backend
        },
        body: JSON.stringify(body),
      }
    );

    if (!backendRes.ok) {
      const errorText = await backendRes.text();
      return NextResponse.json(
        { message: `Backend error: ${backendRes.status} - ${errorText}` },
        { status: backendRes.status }
      );
    }

    const data = await backendRes.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("cartProxy error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
