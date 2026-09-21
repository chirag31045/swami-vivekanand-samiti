import { createContext, useContext, useEffect, useMemo, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const API_ORIGIN = API.replace(/\/api\/?$/, "");

const DEFAULT_SITE_SETTINGS = {
  logo: "/assets/logo.png",
  poster: "/assets/poster.png",

  nameHi: "स्वामी विवेकानन्द विचार प्रचार सेवा समिति",
  nameEn: "Swami Vivekananda Vichar Prachar Seva Samiti",

  taglineHi: "सेवा • ज्ञान • प्रचार",
  taglineEn: "Service • Knowledge • Propagation",

  registrationHi: "पंजीकरण क्रमांक:- 284/ALWAR/2009-10",
  registrationEn: "REG.No:- 284/ALWAR/2009-10",

  uniqueIdHi: "विशिष्ट पहचान संख्या:- RJ/2026/0967197",
  uniqueIdEn: "Unique ID:- RJ/2026/0967197",

  contactIntroHi:
    "समिति से जुड़ने, कार्यक्रम या सेवा संबंधी जानकारी के लिए संपर्क करें।",
  contactIntroEn:
    "Contact the Samiti for programs, service activities or other information.",

  addressHi:
    "ग्राम खेड़ा, पोस्ट पालपुर, तह. किशनगढ़-बास, जिला खैरथल-तिजारा (राज.)",
  addressEn:
    "Village Kheda, Post Palpur, Tehsil Kishangarh-Bas, District Khairthal-Tijara (Rajasthan)",

  phone: "8769251133",
  email: "svvpss13012010@gmail.com",
  mapUrl: "",

  social: {
    instagram:
      "https://www.instagram.com/p/DdKAADxB0nT/?stkn=MTltMmxubzJwMW1jbQ==",
    facebook: "https://www.facebook.com/share/1DUU7QDjsj/",
    whatsapp: "https://wa.me/918769251133",
    twitter: "https://x.com/",
  },

  leaders: [
    {
      roleHi: "अध्यक्ष",
      roleEn: "President",
      nameHi: "गिर्राज प्रसाद",
      nameEn: "Girraj Prasad",
      phone: "",
    },
    {
      roleHi: "सचिव",
      roleEn: "Secretary",
      nameHi: "दीपक कुमार",
      nameEn: "Deepak Kumar",
      phone: "",
    },
    {
      roleHi: "कोषाध्यक्ष",
      roleEn: "Treasurer",
      nameHi: "हंसराज यादव",
      nameEn: "Hansraj Yadav",
      phone: "",
    },
  ],
};

export const getAssetUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_ORIGIN}${url}`;
};

const SiteSettingsContext = createContext(null);

export function SiteSettingsProvider({ children }) {
  const [siteSettings, setSiteSettings] = useState(DEFAULT_SITE_SETTINGS);

  const [siteSettingsLoading, setSiteSettingsLoading] = useState(true);

  const loadPublicSettings = async () => {
    try {
      setSiteSettingsLoading(true);

      const response = await fetch(`${API}/site-settings/public`);
      const data = await response.json();

      if (response.ok && data?.success && data?.item) {
        const item = data.item;

        // Correct the old header values that are currently stored in DB.
        const normalizedItem = {
          ...item,

          // FIXED ENGLISH HEADER
          nameEn: "Swami Vivekananda Vichar Prachar Seva Samiti",

          taglineEn: "Service • Knowledge • Propagation",

          registrationEn: "REG.No:- 284/ALWAR/2009-10",

          uniqueIdEn: "Unique ID:- RJ/2026/0967197",
        };

        setSiteSettings((prev) => ({
          ...prev,
          ...normalizedItem,
          social: {
            ...prev.social,
            ...(item.social || {}),
          },
          leaders: Array.isArray(item.leaders) ? item.leaders : prev.leaders,
        }));
      }
    } catch (error) {
      console.error("Public site settings load error:", error);
    } finally {
      setSiteSettingsLoading(false);
    }
  };

  useEffect(() => {
    loadPublicSettings();
  }, []);

  const refreshSiteSettings = async () => {
    await loadPublicSettings();
  };

  const value = useMemo(
    () => ({
      siteSettings,
      siteSettingsLoading,
      refreshSiteSettings,
    }),
    [siteSettings, siteSettingsLoading],
  );

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);

  if (!context) {
    throw new Error("useSiteSettings must be used inside SiteSettingsProvider");
  }

  return context;
}
