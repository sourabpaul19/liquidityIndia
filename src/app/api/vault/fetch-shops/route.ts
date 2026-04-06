import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();
    const body = bodyText ? JSON.parse(bodyText) : {};

    const params = new URLSearchParams();
    params.append('outletCategory', String(body.outletCategory || ''));

    const externalResponse = await fetch(
      'https://dev2024.co.in/web/liquidity-india-backend/admin/api/fetchVaultShops/',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
        cache: 'no-store',
      }
    );

    const responseText = await externalResponse.text();

    return new NextResponse(responseText, {
      status: externalResponse.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('fetch-shops proxy error:', error);
    return NextResponse.json(
      {
        status: '0',
        message: error?.message || 'Proxy error',
        vault_shops: [],
      },
      { status: 500 }
    );
  }
}