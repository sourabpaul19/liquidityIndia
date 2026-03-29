import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const form = new URLSearchParams();
    if (body.user_id) form.append('user_id', String(body.user_id));
    if (body.amount) form.append('amount', String(body.amount));

    const res = await fetch(
      'https://dev2024.co.in/web/liquidity-backend/admin/api/add_wallet_balance',
      {
        method: 'POST',
        body: form as any, // application/x-www-form-urlencoded
      }
    );

    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { status: '0', message: 'Backend did not return JSON', raw: text },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('add-balance proxy error:', err);
    return NextResponse.json(
      { status: '0', message: 'Failed to add balance' },
      { status: 500 }
    );
  }
}
