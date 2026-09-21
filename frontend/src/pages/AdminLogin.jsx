import { useEffect, useState } from "react";
import { Eye, EyeOff, ShieldCheck, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSiteSettings, getAssetUrl } from "./siteSettingsContext";
import "./admin-auth.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { siteSettings } = useSiteSettings();
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("adminTheme") === "dark",
  );

  useEffect(() => {
    localStorage.setItem("adminTheme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const submit = async (event) => {
    event.preventDefault();
    if (loading) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Login failed.");
      }

      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminUser", JSON.stringify(data.admin));
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const brandName =
    siteSettings?.nameEn || "Swami Vivekananda Vichar Prachar Seva Samiti";

  return (
    <div className={`adminLoginPage ${darkMode ? "adminLoginDark" : ""}`}>
      <div className="adminLoginTopbar">
        <div className="adminLoginBrand">
          <img src={getAssetUrl(siteSettings?.logo)} alt="Samiti logo" />
          <div>
            <strong>{brandName}</strong>
            <span>Admin Panel</span>
          </div>
        </div>
        <button
          type="button"
          className="adminLoginTheme"
          onClick={() => setDarkMode((v) => !v)}
        >
          {darkMode ? "Light" : "Dark"}
        </button>
      </div>

      <div className="adminLoginCenter">
        <div className="adminLoginCard">
          <div className="adminLoginLogo">
            <img
              src={getAssetUrl(siteSettings?.logo)}
              alt={`${brandName} Logo`}
            />
          </div>
          <h1>Admin Login</h1>
          <p>Sign in to manage the Samiti website administration.</p>

          <form onSubmit={submit}>
            <label>
              Username
              <input
                required
                value={form.username}
                onChange={(e) =>
                  setForm((p) => ({ ...p, username: e.target.value }))
                }
                placeholder="admin"
                autoComplete="username"
              />
            </label>

            <label>
              Password
              <span className="adminLoginPassword">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, password: e.target.value }))
                  }
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>

            {error && <div className="adminLoginError">{error}</div>}

            <button
              className="adminLoginSubmit"
              type="submit"
              disabled={loading}
            >
              <LogIn size={17} />
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
