import { useEffect, useState } from "react";
import { supabase } from "../data/supabase";
import "./apk-manager.css";

const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const RELEASES_API = `${API}/app-releases`;
const BUCKET = "apk-releases";

export default function AppReleaseManager() {
  const [file, setFile] = useState(null);
  const [version, setVersion] = useState("");
  const [notes, setNotes] = useState("");
  const [releases, setReleases] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("adminToken");

  async function loadReleases() {
    const response = await fetch(`${RELEASES_API}/admin`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Could not load releases.");
    }

    setReleases(data.releases ?? data.items ?? []);
  }

  useEffect(() => {
    if (!token) return;

    loadReleases().catch((error) => {
      setMessage(error.message);
    });
    // Load releases when the admin token is available.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleUpload(event) {
    event.preventDefault();
    setMessage("");

    if (!file || !version.trim()) {
      setMessage("Please select an APK and enter its version.");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".apk")) {
      setMessage("Only .apk files are allowed.");
      return;
    }

    if (file.size > 49 * 1024 * 1024) {
      setMessage("APK must be smaller than 49 MB.");
      return;
    }

    setBusy(true);

    try {
      // 1. Ask the protected backend for a signed upload token.
      const signResponse = await fetch(
        `${RELEASES_API}/admin/upload-url`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fileName: file.name,
            fileSize: file.size,
          }),
        },
      );

      const signData = await signResponse.json();

      if (!signResponse.ok || !signData.success) {
        throw new Error(
          signData.message || "Could not prepare upload.",
        );
      }

      // 2. Upload directly from browser to Supabase.
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .uploadToSignedUrl(
          signData.uploadPath,
          signData.token,
          file,
          {
            contentType: "application/vnd.android.package-archive",
            upsert: false,
          },
        );

      if (uploadError) throw uploadError;

      // 3. Save release details in MongoDB.
      const completeResponse = await fetch(
        `${RELEASES_API}/admin/complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            version: version.trim(),
            notes,
            uploadPath: signData.uploadPath,
          }),
        },
      );

      const completeData = await completeResponse.json();

      if (!completeResponse.ok || !completeData.success) {
        throw new Error(
          completeData.message || "Could not publish release.",
        );
      }

      setMessage("APK uploaded and published successfully.");
      setFile(null);
      setVersion("");
      setNotes("");

      event.target.reset();
      await loadReleases();
    } catch (error) {
      setMessage(error.message || "APK upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="app-release-manager">
      <h2>Android App Releases</h2>
      <p>Upload a new APK version for public download.</p>

      <form onSubmit={handleUpload}>
        <label>
          App version
          <input
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="e.g. 1.0.1"
            required
          />
        </label>

        <label>
          Release notes
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What's new in this version?"
            rows={3}
          />
        </label>

        <label>
          APK file (max 49 MB)
          <input
            type="file"
            accept=".apk,application/vnd.android.package-archive"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
          />
        </label>

        <button type="submit" disabled={busy}>
          {busy ? "Uploading..." : "Upload and Publish APK"}
        </button>
      </form>

      {message && <p role="status">{message}</p>}

      <h3>Uploaded releases</h3>

      {releases.length === 0 ? (
        <p>No releases found.</p>
      ) : (
        <ul>
          {releases.map((release) => (
            <li key={release._id}>
              <strong>Version {release.version}</strong>
              {" — "}
              <a
                href={release.fileUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open APK
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}