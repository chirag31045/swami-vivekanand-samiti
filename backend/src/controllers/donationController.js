import crypto from "crypto";

import Donation from "../models/donationModel.js";
import DonationSettings from "../models/donationSettingsModel.js";
import {
  createRazorpayOrder,
  fetchRazorpayPayment,
  verifyRazorpaySignature,
} from "../services/razorpayService.js";
import {
  sendDonationReceiptEmail,
} from "../services/donationMailService.js";

const getSettings = async () => {
  let settings =
    await DonationSettings.findOne({
      key: "main",
    });

  if (!settings) {
    settings =
      await DonationSettings.create({
        key: "main",
      });
  }

  return settings;
};

const createReceiptNo = (
  prefix = "SVV",
) => {
  const year =
    new Date().getFullYear();

  const random =
    crypto
      .randomBytes(4)
      .toString("hex")
      .toUpperCase();

  return `${String(
    prefix || "SVV",
  ).toUpperCase()}-${year}-${random}`;
};

const validateCommon = async ({
  donorName,
  amount,
}) => {
  const settings =
    await getSettings();

  if (!settings.enabled) {
    throw new Error(
      "Donations are currently disabled.",
    );
  }

  if (!String(
    donorName || "",
  ).trim()) {
    throw new Error(
      "Donor name is required.",
    );
  }

  const numericAmount =
    Number(amount);

  if (
    !Number.isFinite(
      numericAmount,
    ) ||
    numericAmount <= 0
  ) {
    throw new Error(
      "Enter a valid donation amount.",
    );
  }

  if (
    numericAmount <
    settings.minimumAmount
  ) {
    throw new Error(
      `Minimum donation amount is ₹${settings.minimumAmount}.`,
    );
  }

  if (
    numericAmount >
    settings.maximumAmount
  ) {
    throw new Error(
      `Maximum donation amount is ₹${settings.maximumAmount}.`,
    );
  }

  return {
    settings,
    numericAmount,
  };
};

const toReceipt = (
  donation,
  extra = {},
) => ({
  id: donation._id,
  receiptNo:
    donation.receiptNo,
  donorName:
    donation.donorName,
  email: donation.email,
  phone: donation.phone,
  amount: donation.amount,
  currency: donation.currency,
  purpose: donation.purpose,
  status: donation.status,
  paymentSource:
    donation.paymentSource,
  paymentMethod:
    donation.paymentMethod,
  razorpayOrderId:
    donation.razorpayOrderId,
  razorpayPaymentId:
    donation.razorpayPaymentId,
  paidAt: donation.paidAt,
  createdAt:
    donation.createdAt,
  receiptEmailSentAt:
    donation.receiptEmailSentAt,
  emailSent: Boolean(
    donation.receiptEmailSentAt ||
      extra.emailSent,
  ),
  emailError:
    donation.receiptEmailError ||
    extra.emailError ||
    "",
  failureReason:
    donation.failureReason ||
    "",
});

const sendReceiptOnce = async (
  donationId,
) => {
  const donation =
    await Donation.findOneAndUpdate(
      {
        _id: donationId,
        receiptEmailSentAt: null,
        $or: [
          {
            receiptEmailLock:
              false,
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
          receiptEmailLock:
            true,
        },
      },
      {
        new: true,
      },
    );

  if (!donation) {
    return {
      sent: false,
      alreadyHandled: true,
    };
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

    return {
      sent: false,
      error:
        "Donor email is missing.",
    };
  }

  try {
    const result =
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

    return {
      sent: Boolean(
        result?.sent,
      ),
      messageId:
        result?.messageId,
    };
  } catch (error) {
    console.error(
      "Donation receipt email error:",
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

    return {
      sent: false,
      error:
        error.message ||
        "Email sending failed.",
    };
  }
};

export async function createDonationOrder(
  req,
  res,
) {
  try {
    const {
      donorName,
      email,
      phone,
      amount,
      purpose,
    } = req.body || {};

    const {
      settings,
      numericAmount,
    } = await validateCommon({
      donorName,
      amount,
    });

    if (!settings.razorpayEnabled) {
      return res.status(400).json({
        success: false,
        message:
          "Online payment is currently disabled.",
      });
    }

    const trimmedEmail =
      String(email || "")
        .trim()
        .toLowerCase();

    const trimmedPhone =
      String(phone || "").trim();

    if (!trimmedEmail) {
      return res.status(400).json({
        success: false,
        message:
          "Email is required so the receipt can be sent.",
      });
    }

    if (
      !/^\S+@\S+\.\S+$/.test(
        trimmedEmail,
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Enter a valid email address.",
      });
    }

    if (!trimmedPhone) {
      return res.status(400).json({
        success: false,
        message:
          "Mobile number is required.",
      });
    }

    const receiptNo =
      createReceiptNo(
        settings.receiptPrefix,
      );

    const order =
      await createRazorpayOrder({
        amount: numericAmount,
        receipt: receiptNo,
        notes: {
          donorName:
            String(
              donorName,
            ).trim(),
          email: trimmedEmail,
          phone: trimmedPhone,
          purpose:
            String(
              purpose ||
                "General Seva",
            ).trim(),
        },
      });

    const donation =
      await Donation.create({
        receiptNo,
        donorName:
          String(
            donorName,
          ).trim(),
        email: trimmedEmail,
        phone: trimmedPhone,
        amount: numericAmount,
        purpose:
          String(
            purpose ||
              "General Seva",
          ).trim(),
        paymentSource:
          "razorpay",
        status: "pending",
        razorpayOrderId:
          order.id,
      });

    return res.json({
      success: true,
      keyId:
        process.env.RAZORPAY_KEY_ID,
      order: {
        id: order.id,
        amount:
          order.amount,
        currency:
          order.currency,
      },
      donationId:
        donation._id,
      receiptNo,
    });
  } catch (error) {
    console.error(
      "Create donation order error:",
      error,
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Unable to start payment.",
    });
  }
}

export async function verifyDonationPayment(
  req,
  res,
) {
  try {
    const {
      donationId,
      razorpay_order_id:
        orderId,
      razorpay_payment_id:
        paymentId,
      razorpay_signature:
        signature,
    } = req.body || {};

    if (
      !donationId ||
      !orderId ||
      !paymentId ||
      !signature
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Incomplete payment verification data.",
      });
    }

    const donation =
      await Donation.findById(
        donationId,
      );

    if (!donation) {
      return res.status(404).json({
        success: false,
        message:
          "Donation not found.",
      });
    }

    if (
      donation.razorpayOrderId !==
      orderId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment order mismatch.",
      });
    }

    const validSignature =
      verifyRazorpaySignature({
        orderId,
        paymentId,
        signature,
      });

    if (!validSignature) {
      donation.status =
        "failed";
      donation.failureReason =
        "Invalid payment signature.";

      await donation.save();

      return res.status(400).json({
        success: false,
        message:
          "Payment verification failed.",
      });
    }

    const payment =
      await fetchRazorpayPayment(
        paymentId,
      );

    const expectedPaise =
      Math.round(
        donation.amount * 100,
      );

    if (
      payment.order_id !==
        donation.razorpayOrderId ||
      Number(payment.amount) !==
        expectedPaise ||
      String(
        payment.currency ||
          "INR",
      ) !== "INR"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment amount/order verification failed.",
      });
    }

    if (
      payment.status !==
        "captured" &&
      payment.captured !== true
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment is not captured yet.",
      });
    }

    donation.status = "paid";
    donation.paymentMethod =
      payment.method || "";
    donation.razorpayPaymentId =
      paymentId;
    donation.razorpaySignature =
      signature;
    donation.paidAt = payment.created_at
      ? new Date(
          payment.created_at * 1000,
        )
      : new Date();

    await donation.save();

    const emailResult =
      await sendReceiptOnce(
        donation._id,
      );

    const freshDonation =
      await Donation.findById(
        donation._id,
      );

    return res.json({
      success: true,
      message:
        "Payment successful.",
      donation: toReceipt(
        freshDonation,
        emailResult,
      ),
    });
  } catch (error) {
    console.error(
      "Verify donation payment error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to verify payment.",
    });
  }
}

export async function getAdminDonations(
  req,
  res,
) {
  try {
    const page = Math.max(
      Number(req.query.page) || 1,
      1,
    );

    const limit = Math.min(
      Math.max(
        Number(req.query.limit) ||
          25,
        1,
      ),
      100,
    );

    const filter = {};

    if (req.query.status) {
      filter.status =
        req.query.status;
    }

    if (req.query.search?.trim()) {
      const search =
        req.query.search.trim();

      filter.$or = [
        {
          donorName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          email: {
            $regex: search,
            $options: "i",
          },
        },
        {
          phone: {
            $regex: search,
            $options: "i",
          },
        },
        {
          receiptNo: {
            $regex: search,
            $options: "i",
          },
        },
        {
          razorpayOrderId: {
            $regex: search,
            $options: "i",
          },
        },
        {
          razorpayPaymentId: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const skip =
      (page - 1) * limit;

    const [
      items,
      total,
      stats,
    ] = await Promise.all([
      Donation.find(filter)
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      Donation.countDocuments(
        filter,
      ),

      Donation.aggregate([
        {
          $group: {
            _id: "$status",
            count: {
              $sum: 1,
            },
            amount: {
              $sum: "$amount",
            },
          },
        },
      ]),
    ]);

    const statsMap =
      Object.fromEntries(
        stats.map((item) => [
          item._id,
          {
            count: item.count,
            amount: item.amount,
          },
        ]),
      );

    return res.json({
      success: true,
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages:
          Math.max(
            Math.ceil(
              total / limit,
            ),
            1,
          ),
      },
      stats: statsMap,
    });
  } catch (error) {
    console.error(
      "Admin donations error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load donations.",
    });
  }
}

export async function getDonationReceipt(
  req,
  res,
) {
  try {
    const donation =
      await Donation.findOne({
        receiptNo:
          req.params.receiptNo,
        status: "paid",
      }).lean();

    if (!donation) {
      return res.status(404).json({
        success: false,
        message:
          "Paid receipt not found.",
      });
    }

    return res.json({
      success: true,
      donation:
        toReceipt(donation),
    });
  } catch (error) {
    console.error(
      "Donation receipt error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load receipt.",
    });
  }
}

export async function resendDonationReceipt(
  req,
  res,
) {
  try {
    const donation =
      await Donation.findById(
        req.params.id,
      );

    if (!donation) {
      return res.status(404).json({
        success: false,
        message:
          "Donation not found.",
      });
    }

    if (donation.status !== "paid") {
      return res.status(400).json({
        success: false,
        message:
          "Receipt can only be resent for paid donations.",
      });
    }

    if (!donation.email) {
      return res.status(400).json({
        success: false,
        message:
          "Donor email is missing.",
      });
    }

    const result =
      await sendDonationReceiptEmail(
        donation.toObject(),
      );

    if (!result?.sent) {
      throw new Error(
        "Receipt email was not sent.",
      );
    }

    donation.receiptEmailSentAt =
      new Date();
    donation.receiptEmailError =
      "";

    await donation.save();

    return res.json({
      success: true,
      message:
        "Receipt email sent again.",
      donation:
        toReceipt(
          donation,
          {
            emailSent:
              true,
          },
        ),
    });
  } catch (error) {
    console.error(
      "Resend donation receipt error:",
      error,
    );

    await Donation.updateOne(
      { _id: req.params.id },
      {
        $set: {
          receiptEmailError:
            error.message ||
            "Receipt email failed.",
        },
      },
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Receipt email could not be sent.",
    });
  }
}
