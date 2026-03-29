import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    console.log("=== updateCartItem START ===");
    
    // Log incoming request
    const text = await req.text();
    console.log("Frontend sent:", text);
    
    const params = new URLSearchParams(text);
    console.log("Parsed params:", Object.fromEntries(params.entries()));
    
    const itemId = params.get("itemId");
    const quantity = params.get("quantity");
    const user_id = params.get("user_id") || "951";
    const device_id = params.get("device_id") || "web";

    if (!itemId || !quantity) {
      console.log("❌ Missing itemId or quantity");
      return NextResponse.json(
        { status: "0", message: "Missing itemId or quantity" },
        { status: 400 }
      );
    }

    // Transform to addMultipleCartItems format
    const backendParams = new URLSearchParams();
    backendParams.append("user_id", user_id);
    backendParams.append("device_id", device_id);
    backendParams.append("cartProductIds", itemId);  // cart row ID
    backendParams.append("cartProductsNames", "");
    backendParams.append("cartProductPrices", "0");
    backendParams.append("cartQuantities", quantity);
    backendParams.append("cartIsLiquors", "0");
    backendParams.append("units", "1oz");

    console.log("Backend payload:", backendParams.toString());

    // Call backend
    const backendRes = await fetch(
      "https://dev2024.co.in/web/liquidity-backend/admin/api/addMultipleCartItems/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json, text/plain, */*",
        },
        body: backendParams.toString(),
      }
    );

    console.log("Backend status:", backendRes.status);
    console.log("Backend headers:", Object.fromEntries(backendRes.headers.entries()));

    const responseText = await backendRes.text();
    console.log("Backend response:", responseText);

    let data;
    try {
      data = JSON.parse(responseText);
      console.log("Parsed JSON:", data);
    } catch (parseErr) {
      console.error("JSON parse failed:", parseErr);
      return NextResponse.json(
        { status: "0", message: "Backend returned non-JSON", raw: responseText },
        { status: 500 }
      );
    }

    console.log("=== updateCartItem SUCCESS ===");
    return NextResponse.json(data);
    
  } catch (err: unknown) {
    console.error("=== updateCartItem ERROR ===", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { status: "0", message: "Error in API", error: message },
      { status: 500 }
    );
  }
}
