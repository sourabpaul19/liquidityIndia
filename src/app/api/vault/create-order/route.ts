import { NextResponse } from 'next/server';

const BACKEND_URL =
  'https://dev2024.co.in/web/liquidity-india-backend/admin/api/createVaultOrder';

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();

    const backendRes = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: bodyText,
    });

    const rawResponse = await backendRes.text();

    try {
      return NextResponse.json(JSON.parse(rawResponse));
    } catch {
      return NextResponse.json({
        status: '0',
        message: 'Invalid backend response',
        raw: rawResponse,
      });
    }
  } catch (error: any) {
    return NextResponse.json({
      status: '0',
      message: 'Proxy error',
      error: error?.message || 'Unknown error',
    });
  }
}