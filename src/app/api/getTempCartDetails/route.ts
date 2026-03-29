import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // accept both shapes just in case
    const deviceId = body.device_id || body.deviceId;

    if (!deviceId) {
      return NextResponse.json(
        {
          status: "0",
          message: "deviceId is required",
          cartItems: [],
          total_quantity: 0,
          total_price: 0,
        },
        { status: 400 }
      );
    }

    const backendResponse = await fetch(
      "https://dev2024.co.in/web/liquidity-backend/admin/api/getCartDetailsForUser",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `device_id=${encodeURIComponent(deviceId)}`,
      }
    );

    if (!backendResponse.ok) {
      console.error(
        "Backend API error:",
        backendResponse.status,
        backendResponse.statusText
      );
      throw new Error(`Backend API error! status: ${backendResponse.status}`);
    }

    const backendData = await backendResponse.json();

    return NextResponse.json(
      {
        status: backendData.status || "1",
        message: backendData.message || "Success",
        cartItems: backendData.cartItems || [],
        total_quantity: backendData.total_quantity || 0,
        total_price: backendData.total_price || 0,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Cart fetch proxy error:", error);

    return NextResponse.json(
      {
        status: "0",
        message: "Failed to fetch cart details",
        cartItems: [],
        total_quantity: 0,
        total_price: 0,
      },
      { status: 500 }
    );
  }
}
