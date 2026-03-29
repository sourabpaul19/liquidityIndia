import { NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const amount = Number(body.amount);
    const currency = body.currency || "INR";
    
    // ✅ Fix: Truncate receipt to 40 chars max
    let receipt = body.receipt || `rcpt_${Date.now()}`;
    receipt = receipt.substring(0, 40); // Razorpay max 40 chars
    
    console.log("🚀 Creating order:", { amount, currency, receipt: receipt.length });

    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt,
    });

    return NextResponse.json({
      success: true,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error: any) {
    console.error("💥 Razorpay error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.description || "Failed to create Razorpay order",
        details: error.error
      },
      { status: 500 }
    );
  }
}