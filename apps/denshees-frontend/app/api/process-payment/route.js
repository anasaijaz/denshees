import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request) {
  try {
    const webhook = await request.json();
    const { business_id, data, timestamp, type } = webhook;

    console.log("Webhook received:", {
      type,
      payment_id: data.payment_id,
      timestamp,
    });

    // Validate webhook structure
    if (!data || !data.payment_id || !data.customer) {
      console.error("Invalid webhook structure:", webhook);
      return NextResponse.json(
        { error: "Invalid webhook structure" },
        { status: 400 },
      );
    }

    const {
      payment_id,
      customer,
      product_cart,
      total_amount,
      currency,
      payment_method,
      digital_products_delivered,
      error_code,
      error_message,
    } = data;

    // Handle different webhook types
    switch (type) {
      case "payment.succeeded":
        await handlePaymentSuccess({
          payment_id,
          customer,
          product_cart,
          total_amount,
          currency,
          digital_products_delivered,
        });
        break;

      case "payment.failed":
      case "payment.cancelled":
        await handlePaymentFailure({
          payment_id,
          customer,
          error_code,
          error_message,
          status: type,
        });
        break;

      case "payment.processing":
        await handlePaymentProcessing({
          payment_id,
          customer,
          total_amount,
        });
        break;

      case "payment.refunded":
        await handlePaymentRefund({
          payment_id,
          customer,
          refunds: data.refunds,
        });
        break;

      default:
        console.log(`Unhandled webhook type: ${type}`);
        break;
    }

    // Return success response to acknowledge webhook
    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully",
      payment_id,
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      {
        error: "Webhook processing failed",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

async function handlePaymentSuccess({
  payment_id,
  customer,
  product_cart,
  total_amount,
  currency,
  digital_products_delivered,
}) {
  try {
    console.log(`Processing successful payment: ${payment_id}`);

    // Validate that digital products were delivered
    if (!digital_products_delivered) {
      console.warn(`Digital products not delivered for payment: ${payment_id}`);
    }

    // Process each product in the cart
    if (product_cart && Array.isArray(product_cart)) {
      for (const item of product_cart) {
        const { product_id, quantity } = item;

        // Determine credit type based on product ID
        let creditType = null;
        if (product_id === "pdt_c4RWntNhdXKORtUOwtVOW") {
          creditType = "email";
        } else if (product_id === "pdt_Rwecty69q6lJdpnP6dCwb") {
          creditType = "ai";
        }

        if (creditType && quantity > 0) {
          await updateUserCredits({
            customer_id: customer.customer_id,
            email: customer.email,
            creditType,
            quantity,
            payment_id,
          });
        }
      }
    }

    // Log successful processing
    console.log(
      `Payment ${payment_id} processed successfully for customer ${customer.email}`,
    );
  } catch (error) {
    console.error(`Error processing successful payment ${payment_id}:`, error);
    throw error;
  }
}

async function handlePaymentFailure({
  payment_id,
  customer,
  error_code,
  error_message,
  status,
}) {
  try {
    console.log(`Processing ${status} payment: ${payment_id}`);
    console.log(`Reason: ${error_code} - ${error_message}`);

    // Log failed/cancelled payment for analytics
    console.log(`Payment ${status} logged for ${customer.email}:`, {
      payment_id,
      customer_email: customer.email,
      customer_id: customer.customer_id,
      error_code: error_code || null,
      error_message: error_message || null,
    });

    console.log(`Payment ${status} processed for customer ${customer.email}`);
  } catch (error) {
    console.error(`Error processing ${status} payment ${payment_id}:`, error);
    throw error;
  }
}

async function handlePaymentProcessing({ payment_id, customer, total_amount }) {
  try {
    console.log(`Processing payment in progress: ${payment_id}`);
    console.log(`Customer: ${customer.email}, Amount: ${total_amount}`);

    // Log processing payment for tracking
    console.log(`Processing payment logged for ${customer.email}:`, {
      payment_id,
      customer_email: customer.email,
      customer_id: customer.customer_id,
      total_amount,
    });

    console.log(
      `Payment processing status logged for customer ${customer.email}`,
    );
  } catch (error) {
    console.error(`Error processing payment status ${payment_id}:`, error);
    throw error;
  }
}

async function handlePaymentRefund({ payment_id, customer, refunds }) {
  try {
    console.log(`Processing refund for payment: ${payment_id}`);

    if (refunds && Array.isArray(refunds)) {
      for (const refund of refunds) {
        console.log(
          `Refund ${refund.refund_id}: ${refund.amount} (${refund.reason})`,
        );
      }
    }

    console.log(`Refund processed for customer ${customer.email}`);
  } catch (error) {
    console.error(`Error processing refund ${payment_id}:`, error);
    throw error;
  }
}

async function updateUserCredits({
  customer_id,
  email,
  creditType,
  quantity,
  payment_id,
}) {
  try {
    console.log(`Updating ${creditType} credits for customer ${email}:`);
    console.log(
      `Adding ${quantity} ${creditType} credits from payment ${payment_id}`,
    );

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error(`User not found with email: ${email}`);
    }

    // Update credits using atomic increment
    let updateData = {};
    if (creditType === "email") {
      updateData.credits = { increment: quantity };
      console.log(
        `Email credits: ${user.credits || 0} + ${quantity} = ${(user.credits || 0) + quantity}`,
      );
    } else if (creditType === "ai") {
      updateData.aiCredits = { increment: quantity };
      console.log(
        `AI credits: ${user.aiCredits || 0} + ${quantity} = ${(user.aiCredits || 0) + quantity}`,
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    console.log(`Credits updated successfully for user ${user.id}:`, {
      email: updatedUser.email,
      credits: updatedUser.credits,
      aiCredits: updatedUser.aiCredits,
    });

    // Create transaction log entry
    try {
      await prisma.creditTransaction.create({
        data: {
          userId: user.id,
          amount: quantity,
          type: creditType,
          timestamp: new Date(),
        },
      });
      console.log(`Transaction logged for payment ${payment_id}`);
    } catch (logError) {
      console.warn("Failed to log transaction:", logError.message);
    }

    return {
      success: true,
      user_id: user.id,
      email: updatedUser.email,
      creditType,
      quantity,
      newCredits:
        creditType === "email" ? updatedUser.credits : updatedUser.aiCredits,
      payment_id,
    };
  } catch (error) {
    console.error(`Error updating credits for ${email}:`, error);
    throw error;
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    {
      error:
        "Method not allowed. This endpoint only accepts POST requests for webhooks.",
    },
    { status: 405 },
  );
}

export async function PUT() {
  return NextResponse.json(
    {
      error:
        "Method not allowed. This endpoint only accepts POST requests for webhooks.",
    },
    { status: 405 },
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      error:
        "Method not allowed. This endpoint only accepts POST requests for webhooks.",
    },
    { status: 405 },
  );
}
