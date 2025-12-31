import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { email, amount, orderId, metadata } = await request.json();

    if (!email || !amount || !orderId) {
      return NextResponse.json(
        { error: "Email, amount, and orderId are required" },
        { status: 400 }
      );
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "Paystack secret key not configured" },
        { status: 500 }
      );
    }

    // Convert amount to kobo (lowest currency unit for Naira)
    const amountInKobo = Math.round(amount * 100);

    // Get the base URL for callback
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      request.headers.get("origin") ||
      "http://localhost:3000";

    const callbackUrl = `${baseUrl}/api/paystack/callback`;

    // Generate unique payment reference to avoid duplicate transaction errors
    // Use orderId + timestamp to ensure uniqueness
    const uniqueReference = `${orderId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Initialize transaction with Paystack
    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount: amountInKobo,
          reference: uniqueReference, // Use unique reference instead of orderId
          callback_url: callbackUrl,
          metadata: {
            order_id: orderId,
            custom_fields: [
              {
                display_name: "Order ID",
                variable_name: "order_id",
                value: orderId,
              },
              ...(metadata || []),
            ],
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Paystack initialization error:", data);
      return NextResponse.json(
        { 
          error: data.message || data.error || "Failed to initialize payment",
          details: data 
        },
        { status: response.status || 500 }
      );
    }

    if (!data.status || !data.data) {
      console.error("Invalid Paystack response:", data);
      return NextResponse.json(
        { 
          error: "Invalid response from Paystack",
          details: data 
        },
        { status: 500 }
      );
    }

    if (!data.data.access_code) {
      console.error("Paystack response missing access_code:", data);
      return NextResponse.json(
        { 
          error: "Payment initialization failed - no access code",
          details: data 
        },
        { status: 500 }
      );
    }

    // Store the payment reference in the order for later lookup
    const supabase = await createClient();
    await supabase
      .from('orders')
      .update({ payment_reference: uniqueReference })
      .eq('id', orderId);

    return NextResponse.json({
      access_code: data.data.access_code,
      reference: data.data.reference,
      authorization_url: data.data.authorization_url,
      orderId: orderId, // Include orderId in response for client-side use
    });
  } catch (error: any) {
    console.error("Error initializing Paystack payment:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
