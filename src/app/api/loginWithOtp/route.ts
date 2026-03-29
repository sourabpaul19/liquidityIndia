import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.mobile) {
      return NextResponse.json(
        { success: false, message: "Mobile number is required." },
        { status: 400 }
      );
    }

    // Convert JSON to URL-encoded form data
    const formBody = new URLSearchParams({
      mobile: body.mobile,
    }).toString();

    // Send request to backend
    const apiResponse = await fetch(
      "https://dev2024.co.in/web/liquidity-backend/admin/api/loginWithOtp",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formBody,
      }
    );

    const data = await apiResponse.json();

    return NextResponse.json(data, { status: apiResponse.status });
  } catch (error: unknown) {
    console.error("Proxy error:", error);

    const message =
      error instanceof Error ? error.message : "Server error";

    return NextResponse.json(
      { success: false, message, error: message },
      { status: 500 }
    );
  }
}
