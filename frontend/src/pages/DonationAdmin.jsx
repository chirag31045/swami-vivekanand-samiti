import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Eye, RefreshCw, Search, Save, X } from "lucide-react";
import Pagination from "../pages/Pagination";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const INITIAL_SETTINGS = {
  enabled: true,
  razorpayEnabled: true,
  minimumAmount: 1,
  maximumAmount: 500000,
  receiptPrefix: "SVV",
};

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "medium",
        hour12: true,
      })
    : "-";

const paymentMethodLabel = (value) => {
  const map = {
    upi: "UPI",
    card: "Card",
    netbanking: "Netbanking",
    wallet: "Wallet",
    emi: "EMI",
  };

  return map[value] || value || "-";
};

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

export default function DonationAdmin() {
  const token = localStorage.getItem("adminToken");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
  });

  const [stats, setStats] = useState({});

  const [selected, setSelected] = useState(null);

  const [actionLoading, setActionLoading] = useState(false);

  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("");

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  const loadSettings = async () => {
    try {
      setSettingsLoading(true);

      const response = await fetch(`${API}/donation-settings/admin`, {
        headers: getAuthHeaders(),
      });

      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Failed to load payment settings.");
      }

      setSettings({
        ...INITIAL_SETTINGS,
        ...(data.item || {}),
      });
    } catch (error) {
      setSettingsMessage(error.message || "Failed to load payment settings.");
    } finally {
      setSettingsLoading(false);
    }
  };

  const loadDonations = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (status) {
        params.set("status", status);
      }

      const response = await fetch(
        `${API}/donations/admin?${params.toString()}`,
        {
          headers: getAuthHeaders(),
        },
      );

      if (response.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        window.location.href = "/admin/login";
        return;
      }

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Failed to load donations.");
      }

      setItems(data.items || []);
      setPagination(
        data.pagination || {
          total: 0,
          totalPages: 1,
        },
      );
      setStats(data.stats || {});
    } catch (error) {
      console.error("Donations load error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    loadDonations();
  }, [page, limit, status]);

  const saveSettings = async (event) => {
    event.preventDefault();

    try {
      setSettingsSaving(true);
      setSettingsMessage("");

      const payload = {
        enabled: Boolean(settings.enabled),
        razorpayEnabled: Boolean(settings.razorpayEnabled),
        minimumAmount: Number(settings.minimumAmount),
        maximumAmount: Number(settings.maximumAmount),
        receiptPrefix: String(settings.receiptPrefix || "SVV").trim(),
      };

      if (!payload.minimumAmount || payload.minimumAmount < 1) {
        throw new Error("Minimum donation must be at least ₹1.");
      }

      if (
        !payload.maximumAmount ||
        payload.maximumAmount < payload.minimumAmount
      ) {
        throw new Error(
          "Maximum donation must be greater than or equal to minimum donation.",
        );
      }

      const response = await fetch(`${API}/donation-settings/admin`, {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Failed to save payment settings.");
      }

      setSettings({
        ...INITIAL_SETTINGS,
        ...(data.item || {}),
      });

      setSettingsMessage("Payment settings saved successfully.");
    } catch (error) {
      setSettingsMessage(error.message || "Failed to save payment settings.");
    } finally {
      setSettingsSaving(false);
    }
  };

  const paidAmount = useMemo(() => Number(stats?.paid?.amount || 0), [stats]);

  const resendReceipt = async () => {
    if (!selected || selected.status !== "paid") {
      return;
    }

    try {
      setActionLoading(true);

      const response = await fetch(
        `${API}/donations/admin/${selected._id}/resend-receipt`,
        {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Receipt could not be sent.");
      }

      setSelected(data.donation);

      await loadDonations();
    } catch (error) {
      alert(error.message || "Receipt could not be sent.");
    } finally {
      setActionLoading(false);
    }
  };

  const exportCsv = () => {
    const headers = [
      "Receipt No",
      "Donor Name",
      "Email",
      "Phone",
      "Amount",
      "Purpose",
      "Status",
      "Payment Source",
      "Payment Method",
      "Razorpay Order ID",
      "Razorpay Payment ID",
      "Paid At",
      "Created At",
      "Receipt Email Sent At",
    ];

    const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

    const rows = items.map((item) => [
      item.receiptNo,
      item.donorName,
      item.email,
      item.phone,
      item.amount,
      item.purpose,
      item.status,
      item.paymentSource,
      paymentMethodLabel(item.paymentMethod),
      item.razorpayOrderId,
      item.razorpayPaymentId,
      formatDateTime(item.paidAt),
      formatDateTime(item.createdAt),
      formatDateTime(item.receiptEmailSentAt),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escape).join(","))
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `donations-${new Date().toISOString().slice(0, 10)}.csv`;

    anchor.click();

    URL.revokeObjectURL(url);
  };

  const changeSettings = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="donationAdminPage">
      <div className="donationAdminHeader">
        <div>
          <h1>Donations</h1>
          <p>Manage Razorpay donations, payment settings and receipts.</p>
        </div>

        <div className="donationAdminActions">
          <button
            type="button"
            onClick={() => {
              loadDonations();
              loadSettings();
            }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button type="button" onClick={exportCsv}>
            Export CSV
          </button>
        </div>
      </div>

      <section className="donationPaymentControls">
        <div className="donationPaymentControlsHeader">
          <div>
            <h2>Payment Controls</h2>
            <p>Manage donation availability, limits and receipt settings.</p>
          </div>
        </div>

        {settingsLoading ? (
          <div className="donationAdminEmpty">Loading payment controls...</div>
        ) : (
          <form onSubmit={saveSettings}>
            <div className="donationControlToggleGrid">
              <label className="donationControlToggle">
                <input
                  type="checkbox"
                  checked={Boolean(settings.enabled)}
                  onChange={(event) =>
                    changeSettings("enabled", event.target.checked)
                  }
                />
                Donations Enabled
              </label>

              <label className="donationControlToggle">
                <input
                  type="checkbox"
                  checked={Boolean(settings.razorpayEnabled)}
                  onChange={(event) =>
                    changeSettings("razorpayEnabled", event.target.checked)
                  }
                />
                Razorpay Enabled
              </label>
            </div>

            <div className="donationControlGrid">
              <label>
                Minimum Donation (₹)
                <input
                  type="number"
                  min="1"
                  value={settings.minimumAmount}
                  onChange={(event) =>
                    changeSettings("minimumAmount", event.target.value)
                  }
                />
              </label>

              <label>
                Maximum Donation (₹)
                <input
                  type="number"
                  min="1"
                  value={settings.maximumAmount}
                  onChange={(event) =>
                    changeSettings("maximumAmount", event.target.value)
                  }
                />
              </label>

              <label>
                Receipt Prefix
                <input
                  value={settings.receiptPrefix}
                  maxLength={12}
                  onChange={(event) =>
                    changeSettings(
                      "receiptPrefix",
                      event.target.value.toUpperCase(),
                    )
                  }
                />
              </label>
            </div>

            {settingsMessage && (
              <div className="donationAdminMessage">{settingsMessage}</div>
            )}

            <div className="donationControlActions">
              <button
                className="primary donationSettingsSaveButton"
                type="submit"
                disabled={settingsSaving}
              >
                <Save size={16} />
                {settingsSaving ? "Saving..." : "Save Payment Controls"}
              </button>
            </div>
          </form>
        )}
      </section>

      <div className="donationAdminStats">
        <div>
          <span>Paid Donations</span>
          <strong>{stats?.paid?.count || 0}</strong>
        </div>

        <div>
          <span>Paid Amount</span>
          <strong>{money(paidAmount)}</strong>
        </div>

        <div>
          <span>Pending</span>
          <strong>{stats?.pending?.count || 0}</strong>
        </div>

        <div>
          <span>Failed</span>
          <strong>{stats?.failed?.count || 0}</strong>
        </div>
      </div>

      <div className="donationAdminFilters">
        <label>
          <Search size={16} />

          <input
            value={search}
            placeholder="Search donor, receipt, payment ID..."
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                setPage(1);
                loadDonations();
              }
            }}
          />
        </label>

        <select
          value={status}
          onChange={(event) => {
            setPage(1);
            setStatus(event.target.value);
          }}
        >
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {loading ? (
        <div className="donationAdminEmpty">Loading donations...</div>
      ) : items.length === 0 ? (
        <div className="donationAdminEmpty">No donations found.</div>
      ) : (
        <div className="donationAdminTableWrap">
          <table className="donationAdminTable">
            <thead>
              <tr>
                <th>Receipt</th>
                <th>Donor</th>
                <th>Amount</th>
                <th>Purpose</th>
                <th>Method</th>
                <th>Status</th>
                <th>Payment ID</th>
                <th>Paid At</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => (
                <tr key={item._id}>
                  <td>{item.receiptNo}</td>

                  <td>
                    <strong>{item.donorName}</strong>
                    <small>{item.phone || item.email || "-"}</small>
                  </td>

                  <td>{money(item.amount)}</td>

                  <td>{item.purpose}</td>

                  <td>{paymentMethodLabel(item.paymentMethod)}</td>

                  <td>
                    <span
                      className={`donationStatus donationStatus-${item.status}`}
                    >
                      {item.status}
                    </span>
                  </td>

                  <td>{item.razorpayPaymentId || "-"}</td>

                  <td>{formatDateTime(item.paidAt || item.createdAt)}</td>

                  <td>
                    <button
                      type="button"
                      className="donationViewButton"
                      onClick={() => setSelected(item)}
                    >
                      <Eye size={16} />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
           <Pagination
      currentPage={page}
      totalPages={pagination.totalPages}
      totalItems={pagination.total}
      itemsPerPage={limit}
      onPageChange={(newPage) => {
        setPage(newPage);
      }}
      onItemsPerPageChange={(newLimit) => {
        setLimit(newLimit);
        setPage(1);
      }}
    />
        </div>
      )}

      {selected && (
        <div className="donationAdminModalOverlay">
          <div className="donationAdminModal">
            <div className="donationAdminModalHeader">
              <div>
                <h2>Donation Details</h2>
                <p>{selected.receiptNo}</p>
              </div>

              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="donationDetailGrid">
              <div>
                <span>Donor Name</span>
                <strong>{selected.donorName}</strong>
              </div>

              <div>
                <span>Email</span>
                <strong>{selected.email || "-"}</strong>
              </div>

              <div>
                <span>Mobile</span>
                <strong>{selected.phone || "-"}</strong>
              </div>

              <div>
                <span>Amount</span>
                <strong>{money(selected.amount)}</strong>
              </div>

              <div>
                <span>Purpose</span>
                <strong>{selected.purpose}</strong>
              </div>

              <div>
                <span>Status</span>
                <strong>{selected.status}</strong>
              </div>

              <div>
                <span>Payment Method</span>
                <strong>{paymentMethodLabel(selected.paymentMethod)}</strong>
              </div>

              <div>
                <span>Razorpay Order</span>
                <strong>{selected.razorpayOrderId || "-"}</strong>
              </div>

              <div>
                <span>Razorpay Payment</span>
                <strong>{selected.razorpayPaymentId || "-"}</strong>
              </div>

              <div>
                <span>Paid At</span>
                <strong>{formatDateTime(selected.paidAt)}</strong>
              </div>

              <div>
                <span>Created At</span>
                <strong>{formatDateTime(selected.createdAt)}</strong>
              </div>

              <div>
                <span>Receipt Email</span>
                <strong>
                  {selected.receiptEmailSentAt
                    ? `Sent ${formatDateTime(selected.receiptEmailSentAt)}`
                    : selected.receiptEmailError
                      ? "Failed"
                      : "Pending"}
                </strong>
              </div>
            </div>

            {selected.failureReason && (
              <div className="donationAdminMessage">
                Failure Reason: {selected.failureReason}
              </div>
            )}

            <div className="donationAdminModalActions">
              {selected.status === "paid" && selected.email && (
                <button
                  type="button"
                  className="donationVerifyButton"
                  disabled={actionLoading}
                  onClick={resendReceipt}
                >
                  <CheckCircle2 size={16} />
                  {actionLoading ? "Sending..." : "Resend Receipt"}
                </button>
              )}

              <button
                type="button"
                className="donationRejectButton"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
