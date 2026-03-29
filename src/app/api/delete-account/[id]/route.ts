import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // Await the Promise
    
    const response = await fetch(
      `https://dev2024.co.in/web/liquidity-backend/admin/api/delete_account/${id}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }
    );
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Delete account proxy error:', error);
    return NextResponse.json(
      { status: '0', message: 'Network error' },
      { status: 500 }
    );
  }
}
