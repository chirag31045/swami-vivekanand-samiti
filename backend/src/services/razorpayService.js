import crypto from "crypto";
import Razorpay from "razorpay";

const safeCompareHex = (
  expected,
  received,
) => {
  const expectedBuffer =
    Buffer.from(
      String(expected || ""),
      "utf8",
    );

  const receivedBuffer =
    Buffer.from(
      String(received || ""),
      "utf8",
    );

  if (
    expectedBuffer.length !==
    receivedBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    expectedBuffer,
    receivedBuffer,
  );
};

const getClient = () => {
  const keyId =
    process.env.RAZORPAY_KEY_ID;

  const keySecret =
    process.env.RAZORPAY_KEY_SECRET;

  if (
    !keyId ||
    !keySecret
  ) {
    throw new Error(
      "Razorpay credentials are not configured.",
    );
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

export const createRazorpayOrder =
  async ({
    amount,
    receipt,
    notes,
  }) => {
    const razorpay =
      getClient();

    return razorpay.orders.create(
      {
        amount:
          Math.round(
            Number(amount) *
              100,
          ),
        currency: "INR",
        receipt,
        notes,
      },
    );
  };

export const fetchRazorpayPayment =
  async (paymentId) => {
    const razorpay =
      getClient();

    return razorpay.payments.fetch(
      paymentId,
    );
  };

export const verifyRazorpaySignature =
  ({
    orderId,
    paymentId,
    signature,
  }) => {
    const secret =
      process.env
        .RAZORPAY_KEY_SECRET;

    if (!secret) {
      throw new Error(
        "Razorpay secret is not configured.",
      );
    }

    const expected =
      crypto
        .createHmac(
          "sha256",
          secret,
        )
        .update(
          `${orderId}|${paymentId}`,
        )
        .digest("hex");

    return safeCompareHex(
      expected,
      signature,
    );
  };

export const verifyWebhookSignature =
  (rawBody, signature) => {
    const secret =
      process.env
        .RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
      throw new Error(
        "Razorpay webhook secret is not configured.",
      );
    }

    const expected =
      crypto
        .createHmac(
          "sha256",
          secret,
        )
        .update(rawBody)
        .digest("hex");

    return safeCompareHex(
      expected,
      signature,
    );
  };
