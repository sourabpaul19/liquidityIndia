// app/api/clear-cart/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const deviceId = body.device_id;
    const shopId = body.shop_id;

    // Forward to your backend API
    const response = await fetch('https://dev2024.co.in/web/liquidity-backend/admin/api/clearTempCart/device_id', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        device_id: deviceId,
        shop_id: shopId,
      }),
    });

    // Return the backend response
    const data = await response.json();
    
    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error('Clear cart proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to clear cart' },
      { status: 500 }
    );
  }
}
