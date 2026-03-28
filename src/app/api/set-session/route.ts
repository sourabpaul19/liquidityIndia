// src/app/api/set-session/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { token } = await req.json();

  const res = NextResponse.json({ ok: true });

  // Save auth cookie for middleware
  res.cookies.set('auth-token', token, {
    httpOnly: true,
    path: '/',
    // secure: true, // enable on production HTTPS
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return res;
}
