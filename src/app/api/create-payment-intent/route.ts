import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover', // Updated to match your Stripe version
  //apiVersion: '2026-01-28.clover',
});

export async function POST(request: NextRequest) {
  try {
    const { amount, currency } = await request.json();

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency || 'cad',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        user_id: 'user_' + Math.random().toString(36).substr(2, 9),
      },
    });

    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
