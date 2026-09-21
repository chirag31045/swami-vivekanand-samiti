import Donation from "../models/donationModel.js";
import {
  verifyWebhookSignature,
} from "../services/razorpayService.js";
import {
  sendDonationReceiptEmail,
} from "../services/donationMailService.js";

const findOrderId = (payload) =>
  payload?.payload?.payment?.entity
    ?.order_id ||
  payload?.payload?.order?.entity?.id ||
  "";

const findPayment = (payload) =>
  payload?.payload?.payment?.entity ||
  null;

const sendReceiptOnceFromWebhook = async (
  donationId,
) => {
  const donation =
    await Donation.findOneAndUpdate(
      {
        _id: donationId,
        receiptEmailSentAt: null,
        $or: [
          {
            receiptEmailLock: false,
          },
          {
            receiptEmailLock: {
              $exists: false,
            },
          },
        ],
      },
      {
        $set: {
          receiptEmailLock: true,
        },
      },
      {
        new: true,
      },
    );

  if (!donation) {
    return;
  }

  if (!donation.email) {
    await Donation.updateOne(
      { _id: donationId },
      {
        $set: {
          receiptEmailLock: false,
          receiptEmailError:
            "Donor email is missing.",
        },
      },
    );
    return;
  }

  try {
    await sendDonationReceiptEmail(
      donation.toObject(),
    );

    await Donation.updateOne(
      { _id: donationId },
      {
        $set: {
          receiptEmailLock: false,
          receiptEmailSentAt:
            new Date(),
          receiptEmailError: "",
        },
      },
    );
  } catch (error) {
    console.error(
      "Webhook receipt email error:",
      error,
    );

    await Donation.updateOne(
      { _id: donationId },
      {
        $set: {
          receiptEmailLock: false,
          receiptEmailError:
            error.message ||
            "Email sending failed.",
        },
      },
    );
  }
};

export async function handleDonationWebhook(
  req,
  res,
) {
  try {
    const signature =
      req.get(
        "x-razorpay-signature",
      ) || "";

    const eventId =
      req.get(
        "x-razorpay-event-id",
      ) || "";

    const rawBody = req.body;

    if (
      !Buffer.isBuffer(rawBody)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Webhook body must be raw bytes.",
      });
    }

    if (
      !verifyWebhookSignature(
        rawBody,
        signature,
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid webhook signature.",
      });
    }

    const payload =
      JSON.parse(
        rawBody.toString("utf8"),
      );

    const event =
      payload?.event || "";

    const orderId =
      findOrderId(payload);

    const payment =
      findPayment(payload);

    console.log(
      "Razorpay donation webhook",
      {
        event,
        eventId,
        orderId,
        paymentId:
          payment?.id || "",
      },
    );

    if (!orderId) {
      return res.status(200).json({
        success: true,
        received: true,
      });
    }

    const donation =
      await Donation.findOne({
        razorpayOrderId: orderId,
      });

    if (!donation) {
      return res.status(200).json({
        success: true,
        received: true,
      });
    }

    donation.lastWebhookEvent =
      event;
    donation.lastWebhookEventId =
      eventId;
    donation.webhookReceivedAt =
      new Date();

    if (
      event === "order.paid" ||
      event === "payment.captured"
    ) {
      donation.status = "paid";

      donation.paymentMethod =
        payment?.method ||
        donation.paymentMethod ||
        "";

      if (payment?.id) {
        donation.razorpayPaymentId =
          payment.id;
      }

      donation.paidAt =
        payment?.created_at
          ? new Date(
              payment.created_at * 1000,
            )
          : donation.paidAt ||
            new Date();

      await donation.save();

      await sendReceiptOnceFromWebhook(
        donation._id,
      );
    } else if (
      event === "payment.failed"
    ) {
      donation.status = "failed";
      donation.failureReason =
        payment?.error_description ||
        payment?.error_reason ||
        "Payment failed.";

      await donation.save();
    } else {
      await donation.save();
    }

    return res.status(200).json({
      success: true,
      received: true,
    });
  } catch (error) {
    console.error(
      "Donation webhook error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Webhook processing failed.",
    });
  }
}
