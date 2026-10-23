import { useEffect, useState } from "react";
import { Upload, Download, Trash2, Smartphone, RefreshCw } from "lucide-react";
import "./apk-manager.css";
const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export default function ApkManager() {
  const token = localStorage.getItem("adminToken");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({
    title: "Swami Samiti Android App",
    version: "1.0.0",
    notes: "",
  });
  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/app-releases/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (!r.ok || !d.success)
        throw new Error(d.message || "Failed to load releases");
      setItems(d.items || []);
    } catch (e) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const submit = async (e) => {
    e.preventDefault();
    if (!file) return setMessage("Please choose an APK file.");
    if (!file.name.toLowerCase().endsWith(".apk"))
      return setMessage("Only .apk files are allowed.");
    setSaving(true);
    setMessage("");
    try {
      const fd = new FormData();
      fd.append("apk", file);
      fd.append("title", form.title);
      fd.append("version", form.version);
      fd.append("notes", form.notes);
      const r = await fetch(`${API}/app-releases`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const d = await r.json();
      if (!r.ok || !d.success) throw new Error(d.message || "Upload failed");
      setMessage("APK uploaded and published successfully.");
      setFile(null);
      e.target.reset();
      setForm({
        title: "Swami Samiti Android App",
        version: "1.0.0",
        notes: "",
      });
      await load();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setSaving(false);
    }
  };
  const remove = async (id) => {
    if (
      !confirm(
        "Delete this release? It will disappear from the public download page.",
      )
    )
      return;
    try {
      const r = await fetch(`${API}/app-releases/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (!r.ok || !d.success) throw new Error(d.message || "Delete failed");
      setMessage("Release deleted.");
      load();
    } catch (e) {
      setMessage(e.message);
    }
  };
  return (
    <section className="apkAdminPage">
      <div className="apkAdminHeader">
        <div>
          <span>PUBLIC DOWNLOADS</span>
          <h2>Android APK Manager</h2>
          <p>
            Upload a signed Android APK. Published versions appear on the public
            App Download page.
          </p>
        </div>
        <button type="button" onClick={load} className="apkRefresh">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>
      <form className="apkUploadCard" onSubmit={submit}>
        <div className="apkUploadIcon">
          <Upload size={25} />
        </div>
        <div className="apkUploadTitle">
          <h3>Publish a new version</h3>
          <p>APK files only · Maximum 150 MB</p>
        </div>
        <div className="apkFormGrid">
          <label>
            App title
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </label>
          <label>
            Version
            <input
              required
              placeholder="1.0.0"
              value={form.version}
              onChange={(e) => setForm({ ...form, version: e.target.value })}
            />
          </label>
          <label className="apkFull">
            Release notes
            <textarea
              rows="3"
              placeholder="What's new in this version?"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </label>
          <label className="apkFull apkFileLabel">
            <span>
              <Smartphone size={19} />
              {file ? file.name : "Choose Android APK (.apk)"}
            </span>
            <input
              type="file"
              accept=".apk,application/vnd.android.package-archive"
              required
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>
        <button className="apkPublishButton" disabled={saving}>
          {saving ? "Uploading…" : "Upload & Publish APK"}
        </button>
        {message && <p className="apkMessage">{message}</p>}
      </form>
      <div className="apkReleaseAdminList">
        <div className="apkListHeading">
          <h3>Published versions</h3>
          <span>{items.length} release(s)</span>
        </div>
        {loading ? (
          <p>Loading…</p>
        ) : items.length === 0 ? (
          <p className="apkNoItems">No APKs published yet.</p>
        ) : (
          items.map((item) => (
            <article className="apkAdminRelease" key={item._id}>
              <div className="apkAdminReleaseIcon">
                <Smartphone size={23} />
              </div>
              <div className="apkAdminReleaseInfo">
                <strong>{item.title}</strong>
                <span>
                  Version {item.version} ·{" "}
                  {(Number(item.fileSize || 0) / 1024 / 1024).toFixed(1)} MB
                </span>
                <small>
                  {item.fileName} ·{" "}
                  {new Date(item.createdAt).toLocaleDateString("en-IN")}
                </small>
              </div>
              <a
                href={item.fileUrl}
                target="_blank"
                rel="noreferrer"
                title="Open APK"
              >
                <Download size={17} />
              </a>
              <button
                type="button"
                onClick={() => remove(item._id)}
                title="Delete release"
              >
                <Trash2 size={17} />
              </button>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
