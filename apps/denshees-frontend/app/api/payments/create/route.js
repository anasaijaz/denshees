import { NextResponse } from "next/server";
import DodoPayments from "dodopayments";

// Initialize DodoPayments client
const client = new DodoPayments({
  bearerToken: process.env["DODO_PAYMENTS_API_KEY"],
  //   environment: "test_mode",
});

export async function POST(request) {
  try {
    const body = await request.json();
    const { creditType, quantity, userInfo } = body;

    // Validate required fields
    if (!creditType || !quantity || !userInfo) {
      return NextResponse.json(
        { error: "Missing required fields: creditType, quantity, userInfo" },
        { status: 400 }
      );
    }

    // Define product IDs for different credit types
    const productIds = {
      email: "pdt_c4RWntNhdXKORtUOwtVOW",
      ai: "pdt_Rwecty69q6lJdpnP6dCwb",
    };

    const productId = productIds[creditType];
    if (!productId) {
      return NextResponse.json(
        { error: 'Invalid credit type. Must be "email" or "ai"' },
        { status: 400 }
      );
    }

    console.log(userInfo);
    // Create payment with DodoPayments
    const payment = await client.payments.create({
      return_url: `https://app.denshees.com/dashboard`,
      payment_link: true,
      billing: {
        city: userInfo.city || "Unknown",
        country: userInfo.country || "US",
        state: userInfo.state || "Unknown",
        street: userInfo.street || "Unknown",
        zipcode: userInfo.zipcode || "00000",
      },
      customer: {
        name: userInfo.name,
        email: userInfo.email,
        create_new_customer: true,
      },
      product_cart: [
        {
          product_id: productId,
          quantity: quantity,
        },
      ],
    });

    console.log("Payment created:", payment);
    // Log payment creation for debugging
    console.log("Payment created:", payment.payment_id);

    // Return payment details
    return NextResponse.json({
      success: true,
      payment_id: payment.payment_id,
      payment_link: payment.payment_link,
      total_amount: payment.total_amount,
      expires_on: payment.expires_on,
      customer: payment.customer,
    });
  } catch (error) {
    console.error("Payment creation error:", error);

    // Handle different types of errors
    if (error.response) {
      // DodoPayments API error
      return NextResponse.json(
        {
          error: "Payment service error",
          details: error.response.data?.message || error.message,
        },
        { status: error.response.status || 500 }
      );
    } else if (error.request) {
      // Network error
      return NextResponse.json(
        { error: "Network error - unable to reach payment service" },
        { status: 503 }
      );
    } else {
      // Other errors
      return NextResponse.json(
        { error: "Internal server error", details: error.message },
        { status: 500 }
      );
    }
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST to create payments." },
    { status: 405 }
  );
}
