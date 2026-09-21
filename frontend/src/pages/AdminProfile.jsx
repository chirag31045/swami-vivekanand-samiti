import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  WalletCards,
  Image,
  FileText,
  Settings,
  LogOut,
  Moon,
  Sun,
  ChevronDown,
  UserRound,
  Pencil,
  Save,
  Upload,
  X,
  Mail,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { useSiteSettings, getAssetUrl } from "./siteSettingsContext";
import "./admin-profile.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "volunteers", label: "Volunteers", icon: Users },
  { id: "approved", label: "Approved Volunteers", icon: ShieldCheck },
  { id: "new", label: "New Applications", icon: FileText },
  { id: "rejected", label: "Rejected Volunteers", icon: X },
  { id: "gallery", label: "Gallery", icon: Image },
  { id: "activities", label: "Activities", icon: FileText },
  { id: "websiteSettings", label: "Website Settings", icon: Settings },
  { id: "donations", label: "Donations", icon: WalletCards },
];

const FALLBACK_PROFILE = {
  displayName: "Developer Account",
  username: "admin",
  role: "Admin",
  email: "",
  phone: "",
  designation: "Admin",
  department: "Administration",
  bio: "",
  profileImage: "",
};

export default function AdminProfile() {
  const navigate = useNavigate();
  const { siteSettings } = useSiteSettings();
  const token = localStorage.getItem("adminToken");

  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("adminTheme") === "dark",
  );
  const [profileOpen, setProfileOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [profile, setProfile] = useState(FALLBACK_PROFILE);
  const [form, setForm] = useState(FALLBACK_PROFILE);

  useEffect(() => {
    localStorage.setItem("adminTheme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    if (!token) {
      navigate("/admin/login", { replace: true });
      return;
    }

    const load = async () => {
      try {
        const response = await fetch(`${API}/admin/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 401) {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminUser");
          navigate("/admin/login", { replace: true });
          return;
        }

        const data = await response.json();
        if (!response.ok || !data?.success) {
          throw new Error(data?.message || "Failed to load profile.");
        }

        const nextProfile = {
          ...FALLBACK_PROFILE,
          ...(data.profile || {}),
        };
        setProfile(nextProfile);
        setForm(nextProfile);
        setPreview(
          nextProfile.profileImage
            ? getAssetUrl(nextProfile.profileImage)
            : getAssetUrl(siteSettings?.logo),
        );
        localStorage.setItem(
          "adminUser",
          JSON.stringify(nextProfile),
        );
      } catch (error) {
        setMessage(error.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token, navigate, siteSettings?.logo]);

  const displayImage = useMemo(
    () =>
      preview ||
      (profile.profileImage
        ? getAssetUrl(profile.profileImage)
        : getAssetUrl(siteSettings?.logo)),
    [preview, profile.profileImage, siteSettings?.logo],
  );

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
      navigate("/admin/login", { replace: true });
    }
  };

  const handleChange = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const handleFile = (event) => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith("image/")) {
      setMessage("Please choose an image file.");
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setMessage("Profile image must be less than 5 MB.");
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setMessage("");
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    if (saving) return;

    try {
      setSaving(true);
      setMessage("");

      const body = new FormData();
      body.append("displayName", form.displayName.trim());
      body.append("email", form.email.trim());
      body.append("phone", form.phone.trim());
      body.append("designation", form.designation.trim());
      body.append("department", form.department.trim());
      body.append("bio", form.bio.trim());
      if (file) body.append("profileImage", file);

      const response = await fetch(`${API}/admin/profile`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });

      if (response.status === 401) {
        logout();
        return;
      }

      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Failed to update profile.");
      }

      const nextProfile = {
        ...FALLBACK_PROFILE,
        ...(data.profile || {}),
      };
      setProfile(nextProfile);
      setForm(nextProfile);
      setFile(null);
      setPreview(
        nextProfile.profileImage
          ? getAssetUrl(nextProfile.profileImage)
          : getAssetUrl(siteSettings?.logo),
      );
      setEditing(false);
      setMessage("Profile updated successfully.");

      localStorage.setItem(
        "adminUser",
        JSON.stringify(nextProfile),
      );
    } catch (error) {
      setMessage(error.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={`adminDashboard ${darkMode ? "adminDark" : "adminLight"}`}>
        <div className="adminProfileLoading">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className={`adminDashboard ${darkMode ? "adminDark" : "adminLight"}`}>
      <aside className="adminSidebar">
        <div className="adminSidebarBrand">
          <img src={getAssetUrl(siteSettings.logo)} alt="Logo" />
          <div>
            <strong>Swami Vivekananda</strong>
            <span>Admin Panel</span>
          </div>
        </div>

        <div className="adminSidebarMenu">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className="adminSidebarItem"
              onClick={() => navigate("/admin/dashboard")}
            >
              <Icon size={19} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="adminSidebarBottom">
          <button className="adminSidebarItem logoutSide" onClick={logout}>
            <LogOut size={19} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="adminMain">
        <header className="adminTopHeader">
          <div className="adminHeaderLeft">
            <div>
              <h1>Profile</h1>
              <p>Swami Vivekananda Vichar Prachar Seva Samiti</p>
            </div>
          </div>

          <div className="adminHeaderRight">
            <button
              type="button"
              className="adminThemeButton"
              onClick={() => setDarkMode((value) => !value)}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className="adminProfileWrap">
              <button
                type="button"
                className={`adminProfileButton ${profileOpen ? "profileActive" : ""}`}
                onClick={() => setProfileOpen((value) => !value)}
              >
                <img
                  src={displayImage}
                  alt={profile.displayName}
                  className="adminProfileImage"
                />
                <ChevronDown size={17} />
              </button>

              {profileOpen && (
                <div className="adminProfileDropdown adminProfileDropdownEnhanced">
                  <div className="profileDropdownHeader">
                    <img
                      src={displayImage}
                      alt={profile.displayName}
                      className="adminProfileImage"
                    />
                    <div>
                      <strong>{profile.displayName || "Developer Account"}</strong>
                      <span>{profile.role || "Admin"}</span>
                    </div>
                  </div>
                  {profile.email && (
                    <div className="profileDropdownMeta">{profile.email}</div>
                  )}
                  <div className="profileDropdownDivider" />
                  <button
                    type="button"
                    className="profileDropdownAction profileViewAction"
                    onClick={() => setProfileOpen(false)}
                  >
                    <UserRound size={17} /> Profile
                  </button>
                  <button
                    type="button"
                    className="profileDropdownAction profileLogout"
                    onClick={logout}
                  >
                    <LogOut size={17} /> Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="adminContent">
          <div className="adminProfilePage">
            <div className="adminProfilePageTop">
              <div>
                <span className="adminProfileEyebrow">ACCOUNT PROFILE</span>
                <h2>User Profile</h2>
                <p>Manage your admin profile information and profile photo.</p>
              </div>

              {!editing && (
                <button
                  type="button"
                  className="adminProfileEditButton"
                  onClick={() => {
                    setEditing(true);
                    setMessage("");
                  }}
                >
                  <Pencil size={16} /> Edit Profile
                </button>
              )}
            </div>

            <div className="adminProfileCard">
              <div className="adminProfileHero">
                <div className="adminProfileAvatarWrap">
                  <img
                    src={displayImage}
                    alt={profile.displayName}
                    className="adminProfileLargeAvatar"
                  />
                  {editing && (
                    <label className="adminProfileUploadButton">
                      <Upload size={16} />
                      Change Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFile}
                      />
                    </label>
                  )}
                </div>

                <div className="adminProfileIdentity">
                  <h3>{profile.displayName || "Developer Account"}</h3>
                  <p>{profile.designation || profile.role || "Admin"}</p>
                  <span>{profile.department || "Administration"}</span>
                </div>
              </div>

              {editing ? (
                <form className="adminProfileForm" onSubmit={saveProfile}>
                  <label>
                    Display Name
                    <input
                      value={form.displayName}
                      onChange={(event) => handleChange("displayName", event.target.value)}
                      required
                    />
                  </label>

                  <label>
                    Email
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) => handleChange("email", event.target.value)}
                    />
                  </label>

                  <label>
                    Phone
                    <input
                      value={form.phone}
                      onChange={(event) => handleChange("phone", event.target.value)}
                    />
                  </label>

                  <label>
                    Designation
                    <input
                      value={form.designation}
                      onChange={(event) => handleChange("designation", event.target.value)}
                    />
                  </label>

                  <label>
                    Department
                    <input
                      value={form.department}
                      onChange={(event) => handleChange("department", event.target.value)}
                    />
                  </label>

                  <label>
                    Username
                    <input value={form.username} readOnly />
                  </label>

                  <label className="adminProfileFullField">
                    Bio
                    <textarea
                      rows={4}
                      value={form.bio}
                      onChange={(event) => handleChange("bio", event.target.value)}
                    />
                  </label>

                  {message && <div className="adminProfileMessage">{message}</div>}

                  <div className="adminProfileFormActions">
                    <button
                      type="button"
                      className="adminProfileCancelButton"
                      onClick={() => {
                        setEditing(false);
                        setForm(profile);
                        setFile(null);
                        setPreview(
                          profile.profileImage
                            ? getAssetUrl(profile.profileImage)
                            : getAssetUrl(siteSettings?.logo),
                        );
                      }}
                      disabled={saving}
                    >
                      <X size={16} /> Cancel
                    </button>
                    <button type="submit" className="adminProfileSaveButton" disabled={saving}>
                      <Save size={16} />
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="adminProfileDetails">
                  <div>
                    <span>Name</span>
                    <strong>{profile.displayName || "-"}</strong>
                  </div>
                  <div>
                    <span>Username</span>
                    <strong>{profile.username || "-"}</strong>
                  </div>
                  <div>
                    <span>Designation</span>
                    <strong>{profile.designation || profile.role || "-"}</strong>
                  </div>
                  <div>
                    <span>Department</span>
                    <strong>{profile.department || "-"}</strong>
                  </div>
                  <div>
                    <span>Email</span>
                    <strong>
                      {profile.email ? (
                        <a href={`mailto:${profile.email}`}>
                          <Mail size={15} /> {profile.email}
                        </a>
                      ) : (
                        "-"
                      )}
                    </strong>
                  </div>
                  <div>
                    <span>Phone</span>
                    <strong>
                      {profile.phone ? (
                        <a href={`tel:${profile.phone}`}>
                          <Phone size={15} /> {profile.phone}
                        </a>
                      ) : (
                        "-"
                      )}
                    </strong>
                  </div>
                  <div className="adminProfileFullField">
                    <span>Bio</span>
                    <strong>{profile.bio || "No bio added yet."}</strong>
                  </div>

                  {message && <div className="adminProfileMessage">{message}</div>}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
