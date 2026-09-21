import nodemailer from "nodemailer";

const getTransporter = () => {
  const user =
    process.env.DONATION_MAIL_USER;

  const pass =
    process.env.DONATION_MAIL_PASSWORD;

  if (!user || !pass) {
    throw new Error(
      "Donation email is not configured. Set DONATION_MAIL_USER and DONATION_MAIL_PASSWORD.",
    );
  }

  return nodemailer.createTransport(
    {
      service: "gmail",
      auth: {
        user,
        pass,
      },
    },
  );
};

const escapeHtml = (
  value,
) =>
  String(value ?? "")
    .replaceAll(
      "&",
      "&amp;",
    )
    .replaceAll(
      "<",
      "&lt;",
    )
    .replaceAll(
      ">",
      "&gt;",
    )
    .replaceAll(
      '"',
      "&quot;",
    )
    .replaceAll(
      "'",
      "&#039;",
    );

const formatDateTime = (
  value,
) =>
  value
    ? new Date(
        value,
      ).toLocaleString(
        "en-IN",
        {
          timeZone:
            "Asia/Kolkata",
          dateStyle:
            "medium",
          timeStyle:
            "medium",
          hour12: true,
        },
      )
    : "-";

const paymentMethodLabel =
  (value) => {
    const map = {
      upi: "UPI",
      card: "Card",
      netbanking:
        "Netbanking",
      wallet: "Wallet",
      emi: "EMI",
    };

    return (
      map[value] ||
      value ||
      "Razorpay"
    );
  };

export async function sendDonationReceiptEmail(
  donation,
) {
  if (!donation?.email) {
    return {
      sent: false,
      skipped: true,
      reason:
        "Donor email is missing.",
    };
  }

  const transporter =
    getTransporter();

  const fromEmail =
    process.env.DONATION_MAIL_USER;

  const fromName =
    process.env
      .DONATION_FROM_NAME ||
    "Swami Vivekanand Vichar Prachar Seva Samiti";

  const adminEmail = String(
    process.env
      .DONATION_ADMIN_EMAIL ||
      "",
  ).trim();

  const amount = `₹${Number(
    donation.amount || 0,
  ).toLocaleString(
    "en-IN",
  )}`;

  const method =
    paymentMethodLabel(
      donation.paymentMethod,
    );

  const paymentId =
    donation.razorpayPaymentId ||
    "-";

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;border:1px solid #eee;border-radius:16px;padding:28px;background:#fff;">
      <h2 style="margin:0 0 8px;">Donation Receipt</h2>
      <p style="margin:0 0 24px;color:#666;">Thank you for supporting ${escapeHtml(
        fromName,
      )}.</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:9px 0;color:#666;">Receipt No.</td><td style="padding:9px 0;font-weight:700;">${escapeHtml(
          donation.receiptNo,
        )}</td></tr>
        <tr><td style="padding:9px 0;color:#666;">Donor</td><td style="padding:9px 0;font-weight:700;">${escapeHtml(
          donation.donorName,
        )}</td></tr>
        <tr><td style="padding:9px 0;color:#666;">Email</td><td style="padding:9px 0;">${escapeHtml(
          donation.email,
        )}</td></tr>
        <tr><td style="padding:9px 0;color:#666;">Mobile</td><td style="padding:9px 0;">${escapeHtml(
          donation.phone || "-",
        )}</td></tr>
        <tr><td style="padding:9px 0;color:#666;">Purpose</td><td style="padding:9px 0;">${escapeHtml(
          donation.purpose ||
            "General Seva",
        )}</td></tr>
        <tr><td style="padding:9px 0;color:#666;">Amount</td><td style="padding:9px 0;font-weight:700;">${amount}</td></tr>
        <tr><td style="padding:9px 0;color:#666;">Payment Source</td><td style="padding:9px 0;">${escapeHtml(donation.paymentSource === "upi_qr" ? "UPI QR (Legacy)" : "Razorpay")}</td></tr>
        <tr><td style="padding:9px 0;color:#666;">Payment Method</td><td style="padding:9px 0;">${escapeHtml(
          method,
        )}</td></tr>
        <tr><td style="padding:9px 0;color:#666;">Payment ID</td><td style="padding:9px 0;">${escapeHtml(
          paymentId,
        )}</td></tr>
        <tr><td style="padding:9px 0;color:#666;">Date / Time</td><td style="padding:9px 0;">${escapeHtml(
          formatDateTime(
            donation.paidAt ||
              donation.createdAt,
          ),
        )}</td></tr>
        <tr><td style="padding:9px 0;color:#666;">Status</td><td style="padding:9px 0;color:#198754;font-weight:700;">PAID</td></tr>
      </table>
      <p style="margin:24px 0 0;color:#777;font-size:13px;">This email was generated automatically after successful Razorpay payment verification.</p>
    </div>
  `;

  const text = [
    "Donation Receipt",
    `Receipt No: ${donation.receiptNo}`,
    `Donor: ${donation.donorName}`,
    `Email: ${donation.email}`,
    `Mobile: ${donation.phone || "-"}`,
    `Purpose: ${
      donation.purpose ||
      "General Seva"
    }`,
    `Amount: ${amount}`,
    `Payment Source: ${donation.paymentSource === "upi_qr" ? "UPI QR (Legacy)" : "Razorpay"}`,
    `Payment Method: ${method}`,
    `Payment ID: ${paymentId}`,
    `Date / Time: ${formatDateTime(
      donation.paidAt ||
        donation.createdAt,
    )}`,
    "Status: PAID",
  ].join("\n");

  const info =
    await transporter.sendMail(
      {
        from: `"${fromName}" <${fromEmail}>`,
        to: donation.email,
        ...(adminEmail &&
        adminEmail !==
          donation.email
          ? {
              bcc: adminEmail,
            }
          : {}),
        subject: `Donation Receipt - ${donation.receiptNo}`,
        text,
        html,
      },
    );

  return {
    sent: true,
    messageId:
      info.messageId,
  };
}
