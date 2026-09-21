import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Heart,
  ShieldCheck,
  X,
} from "lucide-react";

import { useSiteSettings, getAssetUrl } from "./siteSettingsContext";
import "../donation.css";

const API =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const PURPOSES = [
  "General Seva",
  "Education",
  "Social Service",
  "Yuva Jagran",
  "Event Management",
];

const INITIAL_FORM = {
  donorName: "",
  email: "",
  phone: "",
  amount: "",
  purpose: "General Seva",
};

const STEP_LABELS = [
  "Donor Details",
  "Donation",
  "Review & Pay",
];

const loadRazorpay = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const src =
      "https://checkout.razorpay.com/v1/checkout.js";

    const existing = document.querySelector(
      `script[src="${src}"]`,
    );

    if (existing) {
      existing.addEventListener(
        "load",
        () => resolve(true),
        { once: true },
      );
      existing.addEventListener(
        "error",
        () =>
          reject(
            new Error(
              "Payment gateway could not be loaded.",
            ),
          ),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () =>
      reject(
        new Error(
          "Payment gateway could not be loaded.",
        ),
      );

    document.body.appendChild(script);
  });

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "medium",
        hour12: true,
      })
    : "-";

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const paymentMethodLabel = (value) => {
  const map = {
    upi: "UPI",
    card: "Card",
    netbanking: "Netbanking",
    wallet: "Wallet",
    emi: "EMI",
  };

  return map[value] || value || "Razorpay";
};

export default function Donate({ lang = "en" }) {
  const { siteSettings } = useSiteSettings();

  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [step, setStep] = useState(1);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [successDonation, setSuccessDonation] =
    useState(null);

  useEffect(() => {
    let active = true;

    fetch(`${API}/donation-settings/public`)
      .then((response) => response.json())
      .then((data) => {
        if (active && data?.success) {
          setSettings(data.item);
        }
      })
      .catch((error) => {
        console.error(
          "Donation settings error:",
          error,
        );
      });

    return () => {
      active = false;
    };
  }, []);

  const effectiveSettings = useMemo(
    () =>
      settings || {
        enabled: true,
        razorpayEnabled: true,
        minimumAmount: 1,
        maximumAmount: 500000,
      },
    [settings],
  );

  const updateForm = (key, value) =>
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

  const validateAmount = (value) => {
    const amount = Number(value);
    const min = Number(
      effectiveSettings.minimumAmount || 1,
    );
    const max = Number(
      effectiveSettings.maximumAmount || 500000,
    );

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Enter a valid donation amount.");
    }

    if (amount < min) {
      throw new Error(
        `Minimum donation amount is ${money(min)}.`,
      );
    }

    if (amount > max) {
      throw new Error(
        `Maximum donation amount is ${money(max)}.`,
      );
    }

    return amount;
  };

  const validateStepOne = () => {
    if (!form.donorName.trim()) {
      setMessage(
        lang === "en"
          ? "Enter donor name."
          : "दाता का नाम भरें।",
      );
      return false;
    }

    if (!form.email.trim()) {
      setMessage(
        lang === "en"
          ? "Email is required so the receipt can be sent to Gmail."
          : "रसीद Gmail पर भेजने के लिए ईमेल जरूरी है।",
      );
      return false;
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      setMessage(
        lang === "en"
          ? "Enter a valid email."
          : "सही ईमेल भरें।",
      );
      return false;
    }

    if (!form.phone.trim()) {
      setMessage(
        lang === "en"
          ? "Enter mobile number."
          : "मोबाइल नंबर भरें।",
      );
      return false;
    }

    setMessage("");
    return true;
  };

  const validateStepTwo = () => {
    try {
      validateAmount(form.amount);
      setMessage("");
      return true;
    } catch (error) {
      setMessage(error.message);
      return false;
    }
  };

  const nextStep = () => {
    if (!effectiveSettings.enabled) {
      setMessage(
        lang === "en"
          ? "Donations are currently unavailable."
          : "अभी सहयोग स्वीकार नहीं किया जा रहा है।",
      );
      return;
    }

    if (step === 1 && validateStepOne()) {
      setStep(2);
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      return;
    }

    if (step === 2 && validateStepTwo()) {
      setStep(3);
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const previousStep = () => {
    setMessage("");
    setStep((value) => Math.max(1, value - 1));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const payOnline = async () => {
    if (loading) return;

    setMessage("");

    try {
      if (!effectiveSettings.enabled) {
        throw new Error(
          "Online donations are currently disabled.",
        );
      }

      if (!effectiveSettings.razorpayEnabled) {
        throw new Error(
          "Online payment is currently disabled.",
        );
      }

      if (!validateStepOne() || !validateStepTwo()) {
        return;
      }

      await loadRazorpay();
      setLoading(true);

      const orderResponse = await fetch(
        `${API}/donations/create-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        },
      );

      const orderData =
        await orderResponse.json();

      if (
        !orderResponse.ok ||
        !orderData?.success
      ) {
        throw new Error(
          orderData?.message ||
            "Unable to start payment.",
        );
      }

      /*
       * Razorpay controls the actual payment UI.
       * UPI is explicitly placed first so the
       * UPI flow (including the available QR flow
       * on supported desktop checkout) is exposed
       * inside Razorpay Checkout, not as a separate
       * QR on our website.
       */
      const razorpay = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name:
          siteSettings?.nameEn ||
          "Swami Vivekananda Vichar Prachar Seva Samiti",
        description: form.purpose,
        image: getAssetUrl(
          siteSettings?.logo,
        ),
        order_id: orderData.order.id,

        prefill: {
          name: form.donorName,
          email: form.email,
          contact: form.phone,
        },

        notes: {
          receiptNo: orderData.receiptNo,
          purpose: form.purpose,
        },

        // config: {
        //   display: {
        //     blocks: {
        //       upi: {
        //         name: "UPI",
        //         instruments: [
        //           { method: "upi" },
        //         ],
        //       },
        //       cards: {
        //         name: "Cards",
        //         instruments: [
        //           { method: "card" },
        //         ],
        //       },
        //       netbanking: {
        //         name: "Netbanking",
        //         instruments: [
        //           { method: "netbanking" },
        //         ],
        //       },
        //       wallets: {
        //         name: "Wallets",
        //         instruments: [
        //           { method: "wallet" },
        //         ],
        //       },
        //     },

        //     sequence: [
        //       "block.upi",
        //       "block.cards",
        //       "block.netbanking",
        //       "block.wallets",
        //     ],

        //     preferences: {
        //       show_default_blocks: false,
        //     },
        //   },
        // },

        

        theme: {
          color: "#f97316",
        },

        handler: async (response) => {
          try {
            const verifyResponse = await fetch(
              `${API}/donations/verify`,
              {
                method: "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body: JSON.stringify({
                  donationId:
                    orderData.donationId,
                  razorpay_order_id:
                    response.razorpay_order_id,
                  razorpay_payment_id:
                    response.razorpay_payment_id,
                  razorpay_signature:
                    response.razorpay_signature,
                }),
              },
            );

            const verifyData =
              await verifyResponse.json();

            if (
              !verifyResponse.ok ||
              !verifyData?.success
            ) {
              throw new Error(
                verifyData?.message ||
                  "Payment verification failed.",
              );
            }

            setSuccessDonation(
              verifyData.donation,
            );

            setForm(INITIAL_FORM);
            setStep(1);
          } catch (error) {
            setMessage(
              error.message ||
                "Payment verification failed.",
            );
          } finally {
            setLoading(false);
          }
        },

        modal: {
          ondismiss: () => setLoading(false),
        },
      });

      razorpay.on(
        "payment.failed",
        (response) => {
          setMessage(
            response?.error?.description ||
              "Payment failed. Please try again.",
          );
          setLoading(false);
        },
      );

      razorpay.open();
    } catch (error) {
      setMessage(
        error.message ||
          "Unable to process payment.",
      );
      setLoading(false);
    }
  };

  const closeSuccess = () =>
    setSuccessDonation(null);

  return (
    <section className="section pageBody">
      <div className="donationPage">
        <div className="pageHead">
          <h1>
            {lang === "en"
              ? "Support the Cause"
              : "सेवा में सहयोग"}
          </h1>

          <p>
            {lang === "en"
              ? "Complete your details step by step and pay securely through Razorpay."
              : "अपना विवरण चरणों में भरें और Razorpay के माध्यम से सुरक्षित भुगतान करें।"}
          </p>
        </div>

        {!effectiveSettings.enabled && (
          <div className="donationNotice">
            {lang === "en"
              ? "Donations are currently unavailable."
              : "अभी सहयोग स्वीकार नहीं किया जा रहा है।"}
          </div>
        )}

        <div className="donationLayout">
          <div className="donationFormShell">
            <div
              className="donationStepper"
              aria-label="Donation steps"
            >
              {STEP_LABELS.map(
                (label, index) => {
                  const stepNo =
                    index + 1;
                  const active =
                    step === stepNo;
                  const done =
                    step > stepNo;

                  return (
                    <div
                      key={label}
                      className={`donationStep ${
                        active
                          ? "active"
                          : ""
                      } ${
                        done ? "done" : ""
                      }`}
                    >
                      <span>
                        {done ? (
                          <CheckCircle2
                            size={17}
                          />
                        ) : (
                          stepNo
                        )}
                      </span>

                      <strong>
                        {lang === "en"
                          ? label
                          : [
                              "दाता विवरण",
                              "सहयोग",
                              "जाँचें और भुगतान करें",
                            ][index]}
                      </strong>
                    </div>
                  );
                },
              )}
            </div>

            <form
              className="form donationForm donationWizard"
              onSubmit={(event) =>
                event.preventDefault()
              }
            >
              {step === 1 && (
                <div className="donationWizardStep">
                  <span className="eyebrow">
                    STEP 1
                  </span>

                  <h2>
                    {lang === "en"
                      ? "Donor Details"
                      : "दाता का विवरण"}
                  </h2>

                  <p className="donationStepHint">
                    {lang === "en"
                      ? "These details will be printed on your receipt."
                      : "ये विवरण आपकी रसीद पर दिखेंगे।"}
                  </p>

                  <label>
                    {lang === "en"
                      ? "Name"
                      : "नाम"}

                    <input
                      required
                      value={
                        form.donorName
                      }
                      onChange={(e) =>
                        updateForm(
                          "donorName",
                          e.target.value,
                        )
                      }
                    />
                  </label>

                  <label>
                    {lang === "en"
                      ? "Email"
                      : "ईमेल"}

                    <input
                      required
                      type="email"
                      value={
                        form.email
                      }
                      onChange={(e) =>
                        updateForm(
                          "email",
                          e.target.value,
                        )
                      }
                      placeholder="you@example.com"
                    />

                    <small className="donationFieldHint">
                      {lang === "en"
                        ? "Receipt will be sent to this email after payment verification."
                        : "भुगतान सत्यापन के बाद रसीद इस ईमेल पर भेजी जाएगी।"}
                    </small>
                  </label>

                  <label>
                    {lang === "en"
                      ? "Mobile"
                      : "मोबाइल"}

                    <input
                      required
                      type="tel"
                      inputMode="numeric"
                      value={
                        form.phone
                      }
                      onChange={(e) =>
                        updateForm(
                          "phone",
                          e.target.value.replace(
                            /\D/g,
                            "",
                          ),
                        )
                      }
                      maxLength={10}
                    />
                  </label>
                </div>
              )}

              {step === 2 && (
                <div className="donationWizardStep">
                  <span className="eyebrow">
                    STEP 2
                  </span>

                  <h2>
                    {lang === "en"
                      ? "Donation Details"
                      : "सहयोग विवरण"}
                  </h2>

                  <label>
                    {lang === "en"
                      ? "Amount (₹)"
                      : "राशि (₹)"}

                    <input
                      required
                      type="number"
                      min={
                        effectiveSettings.minimumAmount ||
                        1
                      }
                      max={
                        effectiveSettings.maximumAmount ||
                        500000
                      }
                      value={
                        form.amount
                      }
                      onChange={(e) =>
                        updateForm(
                          "amount",
                          e.target.value,
                        )
                      }
                      placeholder={`${effectiveSettings.minimumAmount || 1}`}
                    />

                    <small className="donationFieldHint">
                      {lang === "en"
                        ? `Minimum ${money(
                            effectiveSettings.minimumAmount ||
                              1,
                          )} · Maximum ${money(
                            effectiveSettings.maximumAmount ||
                              500000,
                          )}`
                        : `न्यूनतम ${money(
                            effectiveSettings.minimumAmount ||
                              1,
                          )} · अधिकतम ${money(
                            effectiveSettings.maximumAmount ||
                              500000,
                          )}`}
                    </small>
                  </label>

                  <label>
                    {lang === "en"
                      ? "Purpose"
                      : "उद्देश्य"}

                    <select
                      value={
                        form.purpose
                      }
                      onChange={(e) =>
                        updateForm(
                          "purpose",
                          e.target.value,
                        )
                      }
                    >
                      {PURPOSES.map(
                        (purpose) => (
                          <option
                            key={
                              purpose
                            }
                          >
                            {purpose}
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  <div className="donationMiniSummary">
                    <span>
                      {lang === "en"
                        ? "Donor"
                        : "दाता"}
                    </span>
                    <strong>
                      {
                        form.donorName
                      }
                    </strong>

                    <span>
                      {lang === "en"
                        ? "Email"
                        : "ईमेल"}
                    </span>
                    <strong>
                      {form.email}
                    </strong>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="donationWizardStep">
                  <span className="eyebrow">
                    STEP 3
                  </span>

                  <h2>
                    {lang === "en"
                      ? "Review & Pay"
                      : "जाँचें और भुगतान करें"}
                  </h2>

                  <p className="donationStepHint">
                    {lang === "en"
                      ? "Review your details once. Pay Securely will open Razorpay Checkout."
                      : "एक बार अपना विवरण जाँचें। Pay Securely दबाने पर Razorpay Checkout खुलेगा।"}
                  </p>

                  <div className="donationReviewCard">
                    <div>
                      <span>Name</span>
                      <strong>
                        {
                          form.donorName
                        }
                      </strong>
                    </div>

                    <div>
                      <span>Email</span>
                      <strong>
                        {form.email}
                      </strong>
                    </div>

                    <div>
                      <span>Mobile</span>
                      <strong>
                        {form.phone}
                      </strong>
                    </div>

                    <div>
                      <span>Purpose</span>
                      <strong>
                        {
                          form.purpose
                        }
                      </strong>
                    </div>

                    <div className="amountRow">
                      <span>
                        Donation Amount
                      </span>
                      <strong>
                        {money(
                          form.amount,
                        )}
                      </strong>
                    </div>
                  </div>

                  <div className="donationSecureNote">
                    <ShieldCheck
                      size={19}
                    />

                    <span>
                      {lang === "en"
                        ? "UPI, UPI QR, cards, netbanking and wallets are handled inside Razorpay Checkout."
                        : "UPI, UPI QR, कार्ड, नेटबैंकिंग और वॉलेट का भुगतान Razorpay Checkout के अंदर होगा।"}
                    </span>
                  </div>
                </div>
              )}

              {message && (
                <p className="status errorStatus">
                  {message}
                </p>
              )}

              <div className="donationWizardActions">
                {step > 1 ? (
                  <button
                    type="button"
                    className="secondary"
                    onClick={previousStep}
                    disabled={loading}
                  >
                    <ArrowLeft
                      size={17}
                    />
                    {lang === "en"
                      ? "Back"
                      : "पीछे"}
                  </button>
                ) : (
                  <span />
                )}

                {step < 3 ? (
                  <button
                    type="button"
                    className="primary"
                    onClick={nextStep}
                    disabled={
                      !effectiveSettings.enabled
                    }
                  >
                    {lang === "en"
                      ? "Continue"
                      : "आगे"}
                    <ArrowRight
                      size={17}
                    />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="primary"
                    onClick={payOnline}
                    disabled={
                      loading ||
                      !effectiveSettings.enabled ||
                      !effectiveSettings.razorpayEnabled
                    }
                  >
                    {loading
                      ? lang === "en"
                        ? "Opening Secure Checkout..."
                        : "सुरक्षित भुगतान खुल रहा है..."
                      : lang === "en"
                        ? "Pay Securely"
                        : "सुरक्षित भुगतान करें"}
                    <Heart size={17} />
                  </button>
                )}
              </div>
            </form>
          </div>

          <aside className="donationSecurityBox">
            <ShieldCheck
              size={42}
              strokeWidth={1.8}
            />

            <h2>
              {lang === "en"
                ? "Secure Online Payment"
                : "सुरक्षित ऑनलाइन भुगतान"}
            </h2>

            <p>
              {lang === "en"
                ? "Your payment is completed inside Razorpay Checkout. No bank account or separate QR is shown on this website."
                : "भुगतान Razorpay Checkout के अंदर होगा। इस वेबसाइट पर बैंक खाता या अलग QR नहीं दिखाया जाएगा।"}
            </p>

            <div className="donationMethodList">
              {[
                [
                  "UPI / UPI QR",
                  "UPI",
                ],
                [
                  "Credit / Debit Card",
                  "CARD",
                ],
                [
                  "Netbanking",
                  "BANK",
                ],
                [
                  "Wallets",
                  "WALLET",
                ],
              ].map(
                ([label, key]) => (
                  <div
                    className="donationMethodItem"
                    key={key}
                  >
                    <CheckCircle2
                      size={18}
                    />
                    <span>
                      {lang === "en"
                        ? label
                        : {
                            UPI: "UPI / UPI QR",
                            CARD: "डेबिट / क्रेडिट कार्ड",
                            BANK: "नेटबैंकिंग",
                            WALLET: "वॉलेट",
                          }[
                            key
                          ]}
                    </span>
                  </div>
                ),
              )}
            </div>

            <div className="donationTestNote">
              {lang === "en"
                ? "Test Mode: use Razorpay's test payment credentials / UPI test values. This is not a real charge."
                : "Test Mode: Razorpay के test payment credentials / UPI test values का उपयोग करें। यह वास्तविक भुगतान नहीं है।"}
            </div>
          </aside>
        </div>

        {successDonation && (
          <div className="donationModalOverlay">
            <div className="donationSuccessModal donationReceiptModal">
              <button
                type="button"
                className="donationModalClose"
                onClick={closeSuccess}
                aria-label="Close"
              >
                <X size={18} />
              </button>

              <div className="donationSuccessIcon">
                ✓
              </div>

              <h2>
                {lang === "en"
                  ? "Payment Successful"
                  : "भुगतान सफल"}
              </h2>

              <p>
                {lang === "en"
                  ? "Thank you for supporting the Samiti."
                  : "समिति का सहयोग करने के लिए धन्यवाद।"}
              </p>

              <div className="donationReceiptGrid">
                <div>
                  <span>Receipt No.</span>
                  <strong>
                    {
                      successDonation.receiptNo
                    }
                  </strong>
                </div>

                <div>
                  <span>Donor</span>
                  <strong>
                    {
                      successDonation.donorName
                    }
                  </strong>
                </div>

                <div>
                  <span>Email</span>
                  <strong>
                    {
                      successDonation.email ||
                      "-"
                    }
                  </strong>
                </div>

                <div>
                  <span>Amount</span>
                  <strong>
                    {money(
                      successDonation.amount,
                    )}
                  </strong>
                </div>

                <div>
                  <span>Payment Method</span>
                  <strong>
                    {paymentMethodLabel(
                      successDonation.paymentMethod,
                    )}
                  </strong>
                </div>

                <div>
                  <span>Payment ID</span>
                  <strong>
                    {
                      successDonation.razorpayPaymentId ||
                      "-"
                    }
                  </strong>
                </div>

                <div>
                  <span>Date / Time</span>
                  <strong>
                    {formatDateTime(
                      successDonation.paidAt,
                    )}
                  </strong>
                </div>

                <div>
                  <span>Status</span>
                  <strong>PAID</strong>
                </div>
              </div>

              <div className="donationEmailNotice">
                <CheckCircle2
                  size={18}
                />

                <span>
                  {successDonation.emailSent
                    ? `Receipt sent to ${successDonation.email}.`
                    : "Payment is successful. The receipt email could not be sent right now, but the donation is saved in the admin panel."}
                </span>
              </div>

              <div className="donationReceiptActions">
                <button
                  type="button"
                  className="primary"
                  onClick={() =>
                    window.print()
                  }
                >
                  {lang === "en"
                    ? "Print / Save Receipt"
                    : "रसीद प्रिंट / PDF"}
                </button>

                <button
                  type="button"
                  className="secondary"
                  onClick={closeSuccess}
                >
                  {lang === "en"
                    ? "Close"
                    : "बंद करें"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
