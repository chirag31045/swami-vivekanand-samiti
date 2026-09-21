import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Plus,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import "./admin-registration.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const EMPTY = {
  username: "",
  password: "",
  confirmPassword: "",
  displayName: "",
  email: "",
  phone: "",
  designation: "Administrator",
  department: "Administration",
  bio: "",
};

export default function AdminRegistration() {
  const token = localStorage.getItem("adminToken");
  const [form, setForm] = useState(EMPTY);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const logout = async () => {
    try {
      const currentToken = localStorage.getItem("adminToken");
      if (currentToken) {
        await fetch(`${API}/admin/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${currentToken}` },
          keepalive: true,
        });
      }
    } catch (error) {
      console.warn("Admin logout API error:", error);
    } finally {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      window.location.href = "/admin/login";
    }
  };

  const authHeaders = { Authorization: `Bearer ${token}` };

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API}/admin/registration`, {
        headers: authHeaders,
      });

      if (response.status === 401) {
        logout();
        return;
      }

      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Failed to load admins.");
      }
      setAdmins(data.admins || []);
    } catch (error) {
      setMessage(error.message || "Failed to load admins.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const change = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;

    try {
      setSaving(true);
      setMessage("");

      const response = await fetch(`${API}/admin/registration`, {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (response.status === 401) {
        logout();
        return;
      }

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Admin registration failed.");
      }

      setMessage("Admin account registered successfully.");
      setMessageType("success");
      setForm(EMPTY);
      await loadAdmins();
    } catch (error) {
      setMessage(error.message || "Admin registration failed.");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="adminRegistrationPage">
      <div className="adminRegistrationHeader">
        <div>
          <span className="adminRegistrationEyebrow">ADMIN MANAGEMENT</span>
          <h2>Admin Registration</h2>
          <p>Create another secure admin account without changing the existing dashboard design.</p>
        </div>
        <div className="adminRegistrationHeaderIcon">
          <UserPlus size={23} />
        </div>
      </div>

      <div className="adminRegistrationGrid">
        <form className="adminRegistrationCard" onSubmit={submit}>
          <div className="adminRegistrationCardHead">
            <div>
              <h3>Register New Admin</h3>
              <p>All admin accounts are protected by hashed passwords.</p>
            </div>
            <ShieldCheck size={23} />
          </div>

          <div className="adminRegistrationFields">
            <label>
              Username
              <input
                required
                value={form.username}
                onChange={(e) => change("username", e.target.value)}
                placeholder="newadmin"
                autoComplete="off"
              />
            </label>

            <label>
              Display Name
              <input
                required
                value={form.displayName}
                onChange={(e) => change("displayName", e.target.value)}
                placeholder="Admin Name"
              />
            </label>

            <label>
              Password
              <span className="adminPasswordField">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => change("password", e.target.value)}
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>

            <label>
              Confirm Password
              <span className="adminPasswordField">
                <input
                  required
                  type={showConfirm ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) => change("confirmPassword", e.target.value)}
                  placeholder="Repeat password"
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowConfirm((v) => !v)}>
                  {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>

            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => change("email", e.target.value)}
                placeholder="admin@example.com"
              />
            </label>

            <label>
              Phone
              <input
                value={form.phone}
                onChange={(e) => change("phone", e.target.value)}
                placeholder="9876543210"
              />
            </label>

            <label>
              Designation
              <input
                value={form.designation}
                onChange={(e) => change("designation", e.target.value)}
              />
            </label>

            <label>
              Department
              <input
                value={form.department}
                onChange={(e) => change("department", e.target.value)}
              />
            </label>

            <label className="adminRegistrationFull">
              Bio
              <textarea
                rows="3"
                value={form.bio}
                onChange={(e) => change("bio", e.target.value)}
                placeholder="Optional admin profile information"
              />
            </label>
          </div>

          {message && (
            <div className={`adminRegistrationMessage ${messageType}`}>
              <CheckCircle2 size={17} />
              {message}
            </div>
          )}

          <button className="adminRegistrationSubmit" type="submit" disabled={saving}>
            <Plus size={17} />
            {saving ? "Creating Admin..." : "Register Admin"}
          </button>
        </form>

        <section className="adminRegistrationCard adminAccountsCard">
          <div className="adminRegistrationCardHead">
            <div>
              <h3>Registered Admins</h3>
              <p>{admins.length} admin account(s)</p>
            </div>
            <button className="adminRegistrationRefresh" type="button" onClick={loadAdmins}>
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="adminRegistrationEmpty">Loading admins...</div>
          ) : admins.length === 0 ? (
            <div className="adminRegistrationEmpty">No admin accounts found.</div>
          ) : (
            <div className="adminAccountsList">
              {admins.map((admin) => (
                <div className="adminAccountRow" key={admin._id}>
                  <div className="adminAccountAvatar">
                    {admin.profileImage ? (
                      <img src={`${API.replace(/\/api\/?$/, "")}${admin.profileImage}`} alt="" />
                    ) : (
                      <span>{String(admin.displayName || admin.username || "A").charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="adminAccountInfo">
                    <strong>{admin.displayName || admin.username}</strong>
                    <span>@{admin.username} · {admin.designation || "Administrator"}</span>
                    <small>{admin.email || "No email added"}</small>
                  </div>
                  <span className={`adminAccountStatus ${admin.active ? "active" : "inactive"}`}>
                    {admin.active ? "Active" : "Disabled"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
