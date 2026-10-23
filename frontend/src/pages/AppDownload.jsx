import { useEffect, useState } from "react";
import {
  Download,
  Smartphone,
  ShieldCheck,
  CalendarDays,
  PackageCheck,
} from "lucide-react";
import "./app-download.css";
const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const API_ORIGIN = API.replace(/\/api\/?$/, "");
export default function AppDownload() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch(`${API}/app-releases`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok || !d.success)
          throw new Error(d.message || "Could not load app downloads");
        setItems(d.items || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  return (
    <main className="appDownloadPage">
      <section className="appDownloadHero">
        <div className="appDownloadIcon">
          <Smartphone size={42} />
        </div>
        <span className="appDownloadEyebrow">OFFICIAL ANDROID APP</span>
        <h1>Swami Samiti App</h1>
        <p>
          समिति की गतिविधियों और सेवाओं से जुड़े रहें। Android ऐप का नवीनतम
          संस्करण यहाँ से डाउनलोड करें।
        </p>
        <div className="appDownloadTrust">
          <span>
            <ShieldCheck size={17} /> Official release
          </span>
          <span>
            <PackageCheck size={17} /> APK for Android
          </span>
        </div>
      </section>
      <section className="appReleaseSection">
        <div className="appReleaseHeading">
          <div>
            <span>DOWNLOAD CENTER</span>
            <h2>Available versions</h2>
          </div>
        </div>
        {loading ? (
          <p className="appReleaseNotice">Loading releases…</p>
        ) : error ? (
          <p className="appReleaseNotice error">{error}</p>
        ) : items.length === 0 ? (
          <div className="appReleaseEmpty">
            <Smartphone size={34} />
            <h3>App coming soon</h3>
            <p>
              अभी कोई APK प्रकाशित नहीं किया गया है। कृपया बाद में फिर देखें।
            </p>
          </div>
        ) : (
          <div className="appReleaseGrid">
            {items.map((item) => (
              <article className="appReleaseCard" key={item._id}>
                <div className="appReleaseCardTop">
                  <div className="appReleaseMiniIcon">
                    <Smartphone size={25} />
                  </div>
                  <span className="appReleaseBadge">Latest available</span>
                </div>
                <h3>{item.title}</h3>
                <p className="appReleaseVersion">Version {item.version}</p>
                {item.notes && <p className="appReleaseNotes">{item.notes}</p>}
                <div className="appReleaseMeta">
                  <span>
                    <CalendarDays size={15} />
                    {new Date(item.createdAt).toLocaleDateString("en-IN")}
                  </span>
                  <span>
                    {(Number(item.fileSize || 0) / 1024 / 1024).toFixed(1)} MB
                  </span>
                </div>
                <a
                  className="appReleaseDownload"
                  href={
                    item.fileUrl?.startsWith("http")
                      ? item.fileUrl
                      : `${API_ORIGIN}${item.fileUrl}`
                  }
                  download
                >
                  <Download size={18} /> Download APK
                </a>
                <p className="appReleaseSafety">
                  Only install APK files from a source you trust. Android may
                  ask you to allow installation from your browser.
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
