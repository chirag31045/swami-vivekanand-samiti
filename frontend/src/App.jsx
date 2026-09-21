import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Routes,
  Route,
  NavLink,
  Link,
  useParams,
  useLocation,
} from "react-router-dom";
import {
  Menu,
  X,
  Heart,
  Phone,
  MapPin,
  ArrowRight,
  IndianRupee,
  ShieldCheck,
  Instagram,
  Facebook,
  MessageCircle,
  Twitter,
  Users,
  FileText,
  ExternalLink,
  Sun,
  Moon,
  Languages,
  Mail,
  Plus,
} from "lucide-react";
import { siteData } from "./data/siteData";
import {
  SiteSettingsProvider,
  useSiteSettings,
  getAssetUrl,
} from "./pages/siteSettingsContext";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import Donate from "./pages/Donate";
import DonationAdmin from "./pages/DonationAdmin";
import AdminProfile from "./pages/AdminProfile";
const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const API_ORIGIN = API.replace(/\/api\/?$/, "");
const links = [
  ["/", "home"],
  ["/about", "about"],
  ["/activities", "activities"],
  ["/documents", "documents"],
  ["/gallery", "gallery"],
  ["/contact", "contact"],
];

const translations = {
  hi: {
    home: "होम",
    about: "हमारे बारे में",
    activities: "सेवा कार्य",
    privacy: "गोपनीयता नीति",
    gallery: "गैलरी",
    contact: "संपर्क",
    documents: "प्रमाण पत्र",
    volunteer: "स्वयंसेवक बनें",
    donate: "सहयोग करें",
    services: "सेवा • ज्ञान • प्रचार",
    hero: "स्वामी विवेकानन्द के विचारों से",
    hero2: "समाज सेवा की ओर",
    heroText:
      "युवा जागरण, शिक्षा, संस्कार और समाज सेवा के माध्यम से सकारात्मक परिवर्तन की दिशा में हमारा प्रयास।",
    aboutBtn: "समिति के बारे में",
    supportBtn: "सेवा में सहयोग",
    whatWeDo: "हम क्या करते हैं",
    keyAreas: "सेवा के प्रमुख क्षेत्र",
    allActivities: "सभी गतिविधियाँ",
    inspiration: "प्रेरणा",
    transparency: "वित्तीय पारदर्शिता",
    transparentTitle: "सेवा के साथ पारदर्शिता भी",
    transparentText:
      "समिति की आय, व्यय और सेवा गतिविधियों से संबंधित जानकारी को व्यवस्थित रूप से प्रकाशित करने के लिए यह सेक्शन बनाया गया है। वास्तविक आँकड़े प्रशासन द्वारा सत्यापित कर प्रकाशित किए जा सकते हैं।",
    viewFinance: "वित्तीय विवरण देखें",
    trust: "विश्वास और जवाबदेही",
    trustText:
      "स्वामी विवेकानन्द विचार प्रचार सेवा समिति समाज सेवा, शिक्षा, स्वास्थ्य एवं जनकल्याण के लिए समर्पित एक सामाजिक संस्था है",
    pageAbout:
      "समिति का उद्देश्य सेवा, ज्ञान, संस्कार और विचार प्रचार के माध्यम से समाज में सकारात्मक योगदान देना है।",
    introTitle: "समिति का परिचय",
    introText:
      "यहाँ समिति का विस्तृत परिचय, उद्देश्य, स्थापना की पृष्ठभूमि, कार्यक्षेत्र और आगामी लक्ष्य लिखे जा सकते हैं। आप अपने अधिकृत दस्तावेज़ के अनुसार इस सामग्री को अपडेट कर सकते हैं।",
    registration: "पंजीकरण",
    uniqueId: "विशिष्ट पहचान संख्या",
    address: "पता",
    activitiesIntro:
      "समिति द्वारा संचालित या प्रस्तावित प्रमुख सेवा क्षेत्रों का विवरण।",
    details: "विस्तार देखें",
    financeIntro:
      "आय और व्यय का सारांश तथा वित्तीय रिपोर्ट प्रकाशित करने के लिए समर्पित पेज।",
    income: "कुल आय",
    expense: "कुल व्यय",
    balance: "शेष",
    records: "वित्तीय रिकॉर्ड",
    date: "तिथि",
    type: "प्रकार",
    category: "श्रेणी",
    description: "विवरण",
    amount: "राशि",
    incomeWord: "आय",
    expenseWord: "व्यय",
    important: "महत्वपूर्ण:",
    demo: "ऊपर दिए demo आँकड़े वेबसाइट का नमूना दिखाने के लिए हैं। इन्हें समिति के सत्यापित वित्तीय रिकॉर्ड से बदलें।",
    galleryIntro:
      "समिति के कार्यक्रम, सेवा गतिविधियाँ और जागरूकता अभियानों की तस्वीरें।",
    galleryPlaceholder: "यहाँ अन्य कार्यक्रमों की तस्वीरें जोड़ी जा सकती हैं।",
    uploadPhoto: "फोटो जोड़ें",
    uploading: "फोटो अपलोड हो रही है...",
    uploadSuccess: "फोटो सफलतापूर्वक जोड़ दी गई।",
    uploadError: "फोटो अपलोड नहीं हो पाई।",
    serviceObjectives: "पंजीकृत उद्देश्यों के अनुसार सेवा क्षेत्र",
    serviceSource:
      "समिति के पंजीकृत दस्तावेज़ में दिए उद्देश्यों का संक्षिप्त विवरण",
    certificateSection: "पंजीकरण प्रमाण पत्र",
    ngoSection: "एनजीओ दर्पण प्रमाण पत्र",
    donateTitle: "सेवा में सहयोग",
    donateIntro:
      "समिति की सेवा गतिविधियों में सहयोग करने के लिए नीचे विवरण भरें।",
    name: "नाम",
    email: "ईमेल",
    mobile: "मोबाइल",
    purpose: "उद्देश्य",
    sendDonation: "सहयोग अनुरोध भेजें",
    sending: "भेजा जा रहा है...",
    backendError: "Backend से कनेक्शन नहीं हो पाया। पहले backend चालू करें।",
    bank: "बैंक / UPI विवरण",
    bankText:
      "यहाँ समिति के verified bank account / UPI QR की जानकारी जोड़ी जाएगी।",
    qr: "UPI QR IMAGE\nयहाँ अपलोड करें",
    account: "Account Name:",
    upi: "UPI ID:",
    docsTitle: "प्रमाण पत्र",
    docsIntro: "समिति के पंजीकरण एवं एनजीओ दर्पण से संबंधित प्रमाण पत्र।",
    regCert: "पंजीकरण प्रमाण पत्र",
    regDesc: "पंजीकरण संख्या 284/ALWAR/2009-10.",
    ngoCert: "एनजीओ दर्पण प्रमाण पत्र",
    ngoDesc: "विशिष्ट पहचान संख्या RJ/2026/0967197.",
    viewPdf: "पीडीएफ देखें",
    volTitle: "स्वयंसेवक बनें",
    volIntro:
      "समिति की सेवा गतिविधियों में अपना समय, कौशल और सहयोग देने के लिए आवेदन करें।",
    join: "आप भी सेवा से जुड़ें",
    joinText:
      "शिक्षा, युवा जागरण, सामाजिक सेवा, कार्यक्रम प्रबंधन और डिजिटल कार्यों में स्वयंसेवा करें।",
    city: "शहर / जिला",
    area: "रुचि का क्षेत्र",
    choose: "चुनें",
    message: "संदेश / उपलब्ध समय",
    sendVolunteer: "स्वयंसेवक आवेदन भेजें",
    application: "स्वयंसेवक आवेदन दर्ज हो गया। आवेदन संख्या:",
    contactIntro:
      "समिति से जुड़ने, कार्यक्रम या सेवा संबंधी जानकारी के लिए संपर्क करें।",
    office: "कार्यालय",
    quick: "त्वरित लिंक",
    rights: "सर्वाधिकार सुरक्षित।",
    language: "भाषा",
    light: "लाइट",
    dark: "डार्क",
    theme: "थीम",
    privacyIntro: "वेबसाइट पर आपकी जानकारी के उपयोग और सुरक्षा से संबंधित जानकारी।",
    privacyTitle: "आपकी गोपनीयता हमारे लिए महत्वपूर्ण है",
    privacySummary: "हम वेबसाइट के माध्यम से प्राप्त जानकारी का उपयोग सेवा अनुरोधों, स्वयंसेवक आवेदन, संपर्क और आवश्यक प्रशासनिक कार्यों के लिए करते हैं।",
  },
  en: {
    home: "Home",
    about: "About Us",
    activities: "Services",
    privacy: "Privacy Policy",
    gallery: "Gallery",
    contact: "Contact",
    documents: "Certificates",
    volunteer: "Become a Volunteer",
    donate: "Donate",
    services: "Service • Knowledge • Outreach",
    hero: "Inspired by Swami Vivekananda",
    hero2: "Towards Social Service",
    heroText:
      "Our effort is to create positive change through youth awareness, education, values and community service.",
    aboutBtn: "About the Samiti",
    supportBtn: "Support the Cause",
    whatWeDo: "What We Do",
    keyAreas: "Key Service Areas",
    allActivities: "All Activities",
    inspiration: "Inspiration",
    transparency: "Financial Transparency",
    transparentTitle: "Service with Transparency",
    transparentText:
      "This section is designed to publish organized information about the Samiti's income, expenses and service activities. Verified figures can be published by the administration.",
    viewFinance: "View Financial Details",
    trust: "Trust & Accountability",
    trustText:
      "Swami Vivekanand Vichar Prachar Seva Samiti is a social organization dedicated to community service, education, healthcare, and public welfare.",
    pageAbout:
      "The Samiti aims to contribute positively to society through service, knowledge, values and the outreach of Swami Vivekananda's ideas.",
    introTitle: "About the Samiti",
    introText:
      "Add the Samiti's detailed introduction, objectives, history, working areas and future goals here. Update this section according to authorized documents.",
    registration: "Registration",
    uniqueId: "Unique ID",
    address: "Address",
    activitiesIntro:
      "Details of the major service areas operated or proposed by the Samiti.",
    details: "View Details",
    financeIntro:
      "A dedicated page for income, expense summaries and financial reports.",
    income: "Total Income",
    expense: "Total Expense",
    balance: "Balance",
    records: "Financial Records",
    date: "Date",
    type: "Type",
    category: "Category",
    description: "Description",
    amount: "Amount",
    incomeWord: "Income",
    expenseWord: "Expense",
    important: "Important:",
    demo: "The figures above are demo values for the website. Replace them with verified financial records of the Samiti.",
    galleryIntro:
      "Photos from Samiti programs, service activities and awareness campaigns.",
    galleryPlaceholder: "More program photos can be added here.",
    uploading: "Uploading photo...",
    uploadSuccess: "Photo added successfully.",
    uploadError: "Photo upload failed.",
    serviceObjectives: "Service Areas Based on Registered Objectives",
    serviceSource:
      "A concise summary of the objectives stated in the Samiti's registered document.",
    certificateSection: "Registration Certificate",
    ngoSection: "NGO Darpan Certificate",
    donateTitle: "Support the Cause",
    donateIntro:
      "Fill in the details below to support the Samiti's service activities.",
    name: "Name",
    email: "Email",
    mobile: "Mobile",
    purpose: "Purpose",
    sendDonation: "Send Support Request",
    sending: "Sending...",
    backendError: "Backend connection failed. Start the backend first.",
    bank: "Bank / UPI Details",
    bankText: "Verified bank account / UPI QR information can be added here.",
    qr: "UPI QR IMAGE\nUpload here",
    account: "Account Name:",
    upi: "UPI ID:",
    docsTitle: "Certificates",
    docsIntro: "Registration and NGO Darpan certificates of the Samiti.",
    regCert: "Registration Certificate",
    regDesc: "Registration No. 284/ALWAR/2009-10.",
    ngoCert: "NGO Darpan Certificate",
    ngoDesc: "Unique ID RJ/2026/0967197.",
    viewPdf: "View PDF",
    volTitle: "Become a Volunteer",
    volIntro:
      "Apply to contribute your time, skills and support to Samiti activities.",
    join: "Join the Service",
    joinText:
      "Volunteer in education, youth awareness, social service, event management and digital work.",
    city: "City / District",
    area: "Area of Interest",
    choose: "Choose",
    message: "Message / Availability",
    sendVolunteer: "Submit Volunteer Application",
    application: "Volunteer application submitted. Application No:",
    contactIntro:
      "Contact the Samiti for programs, service activities or other information.",
    office: "Office",
    quick: "Quick Links",
    rights: "All rights reserved.",
    language: "Language",
    light: "Light",
    dark: "Dark",
    theme: "Theme",
    privacyIntro: "Information about how information submitted through this website is used and protected.",
    privacyTitle: "Your Privacy Matters",
    privacySummary: "Information received through this website is used for service requests, volunteer applications, communication and necessary administrative activities.",
  },
};

const LanguageContext = createContext();
function useLang() {
  return useContext(LanguageContext);
}
function LanguageProvider({ children }) {
  const [lang, setLang] = useState(
    localStorage.getItem("samiti-language") || "hi",
  );
  const [dark, setDark] = useState(
    localStorage.getItem("samiti-theme") === "dark",
  );
  useEffect(() => {
    localStorage.setItem("samiti-language", lang);
    document.documentElement.lang = lang;
  }, [lang]);
  useEffect(() => {
    localStorage.setItem("samiti-theme", dark ? "dark" : "light");
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);
  const value = useMemo(
    () => ({
      lang,
      setLang,
      dark,
      setDark,
      t: (key) => translations[lang][key] ?? key,
    }),
    [lang, dark],
  );
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

const getHeaderNameParts = (name = "") => {
  const words = String(name).trim().split(/\s+/).filter(Boolean);

  return {
    title: words.slice(0, 2).join(" "),
    subtitle: words.slice(2).join(" "),
  };
};

function Layout({ children }) {
  const [open, setOpen] = useState(false);

  const { t, lang, setLang, dark, setDark } = useLang();

  const { siteSettings } = useSiteSettings();

  const baseSiteData = siteData[lang] || siteData.hi;

  const currentSiteData = {
    ...baseSiteData,

    name: lang === "en" ? siteSettings.nameEn : siteSettings.nameHi,

    tagline: lang === "en" ? siteSettings.taglineEn : siteSettings.taglineHi,

    registration:
      lang === "en" ? siteSettings.registrationEn : siteSettings.registrationHi,

    uniqueId: lang === "en" ? siteSettings.uniqueIdEn : siteSettings.uniqueIdHi,

    address: lang === "en" ? siteSettings.addressEn : siteSettings.addressHi,

    phone: siteSettings.phone,

    email: siteSettings.email,

    social: siteSettings.social,

    leaders: (siteSettings.leaders || []).map((leader) => ({
      role: lang === "en" ? leader.roleEn : leader.roleHi,

      name: lang === "en" ? leader.nameEn : leader.nameHi,

      phone: leader.phone,
    })),
  };

  const headerName = lang === "en" ? siteSettings.nameEn : siteSettings.nameHi;

  const { title: headerTitle, subtitle: headerSubtitle } =
    getHeaderNameParts(headerName);

  const mapLink =
    siteSettings.mapUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      currentSiteData.address,
    )}`;

  return (
    <div className="app">
      <div className="topbar">
        <div>
          <span>{currentSiteData.registration}</span>

          <span>{currentSiteData.uniqueId}</span>
        </div>

        <div className="topControls">
          <label>
            <Languages size={15} />

            <span className="controlLabel">{t("language")}</span>

            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              aria-label="Language"
            >
              <option value="hi">हिन्दी</option>

              <option value="en">English</option>
            </select>
          </label>

          <button
            className="themeToggle"
            onClick={() => setDark(!dark)}
            aria-label={t("theme")}
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}

            <span>{dark ? t("light") : t("dark")}</span>
          </button>
        </div>
      </div>

      <header className="header">
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <img src={getAssetUrl(siteSettings.logo)} alt="Samiti logo" />

          <div>
            <strong>{headerTitle}</strong>

            <small>{headerSubtitle}</small>
          </div>
        </Link>

        <button className="menuBtn" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>

        <nav className={open ? "nav open" : "nav"}>
          {links.map(([to, key]) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)}>
              {t(key)}
            </NavLink>
          ))}

          <Link
            className="volunteerBtn"
            to="/volunteer"
            onClick={() => setOpen(false)}
          >
            <Users size={17} />
            {t("volunteer")}
          </Link>

          <Link
            className="donateBtn"
            to="/donate"
            onClick={() => setOpen(false)}
          >
            <Heart size={17} />
            {t("donate")}
          </Link>
        </nav>
      </header>

      <main>{children}</main>

      {/* ================= FOOTER ================= */}

      <footer className="footer">
        <div className="footerGrid">
          <div>
            <img
              src={getAssetUrl(siteSettings.logo)}
              className="footerLogo"
              alt="Samiti logo"
            />

            <h3>{currentSiteData.name}</h3>

            <p>{currentSiteData.tagline}</p>
          </div>

          <div>
            <h4>{t("quick")}</h4>

            <Link to="/about">{t("about")}</Link>

            <Link to="/privacy-policy">{t("privacy")}</Link>

            <Link to="/documents">{t("documents")}</Link>

            <Link to="/volunteer">{t("volunteer")}</Link>

            <Link to="/contact">{t("contact")}</Link>
          </div>

          <div>
            <h4>{t("contact")}</h4>

            <p>
              <MapPin size={16} />

              <a href={mapLink} target="_blank" rel="noopener noreferrer">
                {currentSiteData.address}
              </a>
            </p>

            <p>
              <Phone size={16} />

              <a href={`tel:${currentSiteData.phone}`}>
                {currentSiteData.phone}
              </a>
            </p>

            <p>
              <Mail size={16} />

              <a href={`mailto:${currentSiteData.email}`}>
                {currentSiteData.email}
              </a>
            </p>

            <div className="socials">
              <a
                href={currentSiteData.social.instagram}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
              >
                <Instagram />
              </a>

              <a
                href={currentSiteData.social.facebook}
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
              >
                <Facebook />
              </a>

              <a
                href={currentSiteData.social.whatsapp}
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
              >
                <MessageCircle />
              </a>

              <a
                href={currentSiteData.social.twitter}
                target="_blank"
                rel="noreferrer"
                aria-label="Twitter"
              >
                <Twitter />
              </a>
            </div>
          </div>
        </div>

        <div className="copyright">
          © {new Date().getFullYear()} {currentSiteData.name}. {t("rights")}
        </div>
      </footer>
    </div>
  );
}

function Home() {
  const { t, lang } = useLang();

  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState("");
  const { siteSettings } = useSiteSettings();

  useEffect(() => {
    let mounted = true;

    const loadActivities = async () => {
      try {
        const response = await fetch(`${API}/activities`);

        const data = await response.json();

        if (mounted && response.ok && data?.success) {
          setActivities(data.items || []);
        }
      } catch (error) {
        console.error("Home activities error:", error);
      } finally {
        if (mounted) {
          setActivitiesLoading(false);
        }
      }
    };

    loadActivities();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <section className="hero">
        <div className="heroContent">
          <span className="eyebrow">{t("services")}</span>

          <h1>
            {t("hero")}
            <br />
            <em>{t("hero2")}</em>
          </h1>

          <p>{t("heroText")}</p>

          <div className="actions">
            <Link className="primary" to="/about">
              {t("aboutBtn")}
              <ArrowRight size={18} />
            </Link>

            <Link className="secondary" to="/donate">
              <Heart size={18} />
              {t("supportBtn")}
            </Link>
          </div>
        </div>

        <div className="heroPoster">
          <img
            src={getAssetUrl(siteSettings.poster)}
            alt={lang === "en" ? "Samiti poster" : "समिति पोस्टर"}
          />
        </div>
      </section>

      {/* =================================================
          DYNAMIC ACTIVITIES FROM API
      ================================================= */}

      <section className="section">
        <div className="sectionHead">
          <div>
            <span className="eyebrow">{t("whatWeDo")}</span>

            <h2>{t("keyAreas")}</h2>
          </div>

          <Link to="/activities">
            {t("allActivities")}
            <ArrowRight size={18} />
          </Link>
        </div>

        {activitiesLoading ? (
          <div className="adminEmpty">Loading...</div>
        ) : activitiesError ? (
          <div className="adminEmpty">{activitiesError}</div>
        ) : (
          <div className="cards">
            {activities.map((activity) => {
              const content = activity?.[lang] || activity?.en || activity?.hi;

              if (!content) return null;

              return (
                <article className="card" key={activity.activityNo}>
                  <div className="iconCircle">{activity.activityNo}</div>

                  <h3>{content.title}</h3>

                  <p>{content.shortText}</p>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="quoteBand">
        <div>
          <span className="eyebrow">{t("inspiration")}</span>

          <h2>
            {lang === "en"
              ? "Arise, awake, and do not stop until the goal is reached."
              : "“उठो, जागो और तब तक नहीं रुको जब तक लक्ष्य प्राप्त न हो जाए।”"}
          </h2>

          <p>{lang === "en" ? "— Swami Vivekananda" : "— स्वामी विवेकानन्द"}</p>
        </div>
      </section>

      <section className="section split">
  <div>
    <span className="eyebrow">{t("privacy")}</span>

    <h2>{t("privacyTitle")}</h2>

    <p>{t("privacySummary")}</p>

    <Link className="primary" to="/privacy-policy">
      {t("privacy")}
      <ArrowRight size={18} />
    </Link>
  </div>

  <div className="trustBox">
    <ShieldCheck size={42} />

    <h3>{t("dataProtectionTitle") || (lang === "en" ? "Data Protection" : "डेटा सुरक्षा")}</h3>

    <p>
      {t("dataProtectionText") ||
        (lang === "en"
          ? "We take reasonable steps to protect your personal information and ensure restricted access."
          : "आपकी निजी जानकारी की सुरक्षा के लिए उचित उपाय किए जाते हैं और पहुंच सीमित रखी जाती है।")}
    </p>
  </div>
</section>
    </>
  );
}
function About() {
  const { t, lang } = useLang();
  const { siteSettings } = useSiteSettings();

  const registration =
    lang === "en" ? siteSettings.registrationEn : siteSettings.registrationHi;

  const uniqueId =
    lang === "en" ? siteSettings.uniqueIdEn : siteSettings.uniqueIdHi;

  const address =
    lang === "en" ? siteSettings.addressEn : siteSettings.addressHi;

  return (
    <Page title={t("about")} intro={t("pageAbout")}>
      <div className="aboutGrid">
        <img
          src={getAssetUrl(siteSettings.logo)}
          className="aboutLogo"
          alt="Samiti logo"
        />

        <div>
          <h2>{t("introTitle")}</h2>

          <p>{t("introText")}</p>

          <div className="infoList">
            <div>
              <b>{t("registration")}</b>
              <span>{registration}</span>
            </div>

            <div>
              <b>{t("uniqueId")}</b>
              <span>{uniqueId}</span>
            </div>

            <div>
              <b>{t("address")}</b>
              <span>{address}</span>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}
function Activities() {
  const { t, lang } = useLang();

  const [activities, setActivities] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/activities`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setActivities(data.items || []);
        }
      })
      .catch((error) => {
        console.error("Activities load error:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Page title={t("activities")} intro={t("activitiesIntro")}>
        <div className="adminEmpty">Loading...</div>
      </Page>
    );
  }

  return (
    <Page title={t("activities")} intro={t("activitiesIntro")}>
      <div className="cards">
        {activities.map((activity) => (
          <article className="card large" key={activity.activityNo}>
            <div className="iconCircle">{activity.activityNo}</div>

            <h3>{activity[lang]?.title}</h3>

            <p>{activity[lang]?.shortText}</p>

            <Link to={`/activities/${activity.activityNo}`} className="textBtn">
              {t("details")}
              <ArrowRight size={16} />
            </Link>
          </article>
        ))}
      </div>
    </Page>
  );
}
function ActivityDetail() {
  const { lang } = useLang();
  const { id } = useParams();

  const [activity, setActivity] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/activities/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setActivity(data.item);
        }
      })
      .catch((error) => {
        console.error("Activity detail error:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <section className="activityDetailPage">
        <div className="activityDetail">
          <p>Loading...</p>
        </div>
      </section>
    );
  }

  if (!activity) {
    return (
      <Page
        title={lang === "en" ? "Activity Not Found" : "गतिविधि नहीं मिली"}
        intro=""
      >
        <Link to="/activities" className="primary">
          {lang === "en" ? "Back to Activities" : "गतिविधियों पर वापस जाएँ"}
        </Link>
      </Page>
    );
  }

  const content = activity[lang] || activity.en;

  const imageUrl = activity.image?.startsWith("http")
    ? activity.image
    : `${API_ORIGIN}${activity.image}`;

  return (
    <section className="activityDetailPage">
      <div className="activityDetail">
        <div className="activityDetailContent">
          <span className="activityEyebrow">
            {lang === "en" ? "Our Activities" : "हमारी गतिविधियाँ"}
          </span>

          <h1>{content.title}</h1>

          <p>{content.details}</p>

          <Link to="/activities" className="primary activityBackBtn">
            {lang === "en"
              ? "← Back to Activities"
              : "← गतिविधियों पर वापस जाएँ"}
          </Link>
        </div>

        <div className="activityDetailImageBox">
          <img
            src={imageUrl}
            alt={content.title}
            className="activityDetailImage"
          />
        </div>
      </div>
    </section>
  );
}

function Gallery() {
  const { t } = useLang();
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    fetch(`${API}/gallery`)
      .then((r) => r.json())
      .then((d) => {
        const items = (d.items || []).map((item) => ({
          ...item,
          url: item.url?.startsWith("http")
            ? item.url
            : `${API_ORIGIN}${item.url}`,
        }));

        setPhotos(items);
      })
      .catch((error) => {
        console.error("Gallery load error:", error);
      });
  }, []);
  const upload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setMsg("");
    try {
      const added = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("photo", file);
        const r = await fetch(`${API}/gallery/upload`, {
          method: "POST",
          body: fd,
        });
        const d = await r.json();
        if (!d.success) throw new Error(d.message || t("uploadError"));
        added.push({ ...d.item, url: `${API_ORIGIN}${d.item.url}` });
      }
      setPhotos((p) => [...added, ...p]);
      setMsg(t("uploadSuccess"));
    } catch (err) {
      setMsg(err.message || t("uploadError"));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };
  return (
    <Page title={t("gallery")} intro={t("galleryIntro")}>
      <div className="galleryActions">
        {msg && <span className="uploadMsg">{msg}</span>}
      </div>
      <div className="gallery">
        {photos.map((p, i) => (
          <img key={i} src={p.url} alt={p.originalName || "Samiti activity"} />
        ))}
      </div>
    </Page>
  );
}
function DonationForm() {
  const { t } = useLang();
  const [form, setForm] = useState({
    donorName: "",
    email: "",
    phone: "",
    amount: "",
    purpose: "General Seva",
  });
  const [msg, setMsg] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setMsg(t("sending"));
    try {
      const r = await fetch(`${API}/donations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      setMsg(
        d.success
          ? `Request recorded. Receipt: ${d.donation.receiptNo}`
          : d.message,
      );
    } catch {
      setMsg(t("backendError"));
    }
  };
  return (
    <Page title={t("donateTitle")} intro={t("donateIntro")}>
      <div className="donateGrid">
        <form className="form" onSubmit={submit}>
          <label>
            {t("name")}
            <input
              required
              value={form.donorName}
              onChange={(e) => setForm({ ...form, donorName: e.target.value })}
            />
          </label>
          <label>
            {t("email")}
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label>
            {t("mobile")}
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>
          <label>
            {t("amount")} (₹)
            <input
              required
              type="number"
              min="1"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </label>
          <label>
            {t("purpose")}
            <select
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
            >
              <option>General Seva</option>
              <option>Education</option>
              <option>Social Service</option>
              <option>Yuva Jagran</option>
            </select>
          </label>
          <button className="primary" type="submit">
            {t("sendDonation")} <Heart size={17} />
          </button>
          {msg && <p className="status">{msg}</p>}
        </form>
        <div className="bankBox">
          <h2>{t("bank")}</h2>
          <p>{t("bankText")}</p>
          <div className="placeholder">{t("qr")}</div>
          <p>
            <b>{t("account")}</b> VERIFIED NAME
          </p>
          <p>
            <b>{t("upi")}</b> example@upi
          </p>
        </div>
      </div>
    </Page>
  );
}
function PrivacyPolicy() {
  const { t, lang } = useLang();

  const sections =
    lang === "en"
      ? [
          [
            "Information We Collect",
            "We may collect information that you voluntarily provide through volunteer, contact, donation or other website forms, such as your name, phone number, email address and message details.",
          ],
          [
            "How We Use Information",
            "Information submitted through this website is used to respond to requests, manage volunteer applications, communicate with users and support the Samiti's administrative activities.",
          ],
          [
            "Data Protection",
            "We take reasonable steps to protect information submitted through the website. Access to administrative information is restricted to authorized users.",
          ],
          [
            "Third-Party Services",
            "The website may use third-party services for hosting, image storage, communication, payments or analytics. Their own terms and privacy practices may apply.",
          ],
          [
            "Cookies and Local Storage",
            "The website may use browser storage for preferences such as language and theme. You can clear this data through your browser settings.",
          ],
          [
            "Contact",
            "If you have a privacy-related question or request, please use the contact details published on this website.",
          ],
        ]
      : [
          [
            "हम कौन-सी जानकारी लेते हैं",
            "स्वयंसेवक, संपर्क, सहयोग या अन्य वेबसाइट फॉर्म के माध्यम से आपके द्वारा दी गई जानकारी जैसे नाम, मोबाइल नंबर, ईमेल और संदेश का विवरण लिया जा सकता है।",
          ],
          [
            "जानकारी का उपयोग",
            "वेबसाइट पर दी गई जानकारी का उपयोग अनुरोधों का उत्तर देने, स्वयंसेवक आवेदन प्रबंधित करने, उपयोगकर्ताओं से संपर्क करने और समिति की प्रशासनिक गतिविधियों में सहायता के लिए किया जाता है।",
          ],
          [
            "डेटा सुरक्षा",
            "वेबसाइट के माध्यम से दी गई जानकारी की सुरक्षा के लिए उचित उपाय किए जाते हैं। प्रशासनिक जानकारी तक पहुंच अधिकृत उपयोगकर्ताओं तक सीमित रहती है।",
          ],
          [
            "थर्ड-पार्टी सेवाएं",
            "वेबसाइट होस्टिंग, इमेज स्टोरेज, संचार, भुगतान या अन्य तकनीकी सेवाओं के लिए थर्ड-पार्टी सेवाओं का उपयोग कर सकती है। उनकी अपनी शर्तें और गोपनीयता नीतियां लागू हो सकती हैं।",
          ],
          [
            "कुकीज और लोकल स्टोरेज",
            "भाषा और थीम जैसी प्राथमिकताओं के लिए वेबसाइट ब्राउज़र स्टोरेज का उपयोग कर सकती है। आप अपने ब्राउज़र की सेटिंग्स से इसे साफ कर सकते हैं।",
          ],
          [
            "संपर्क",
            "गोपनीयता से संबंधित प्रश्न या अनुरोध के लिए वेबसाइट पर दिए गए संपर्क विवरण का उपयोग करें।",
          ],
        ];

  return (
    <Page title={t("privacy")} intro={t("privacyIntro")}>
      <section className="privacyHomeSection">
        <div className="privacyHomeCard">
          <span className="eyebrow">{t("privacy")}</span>
          <h2>{t("privacyTitle")}</h2>
          <p>{t("privacySummary")}</p>
        </div>
      </section>

      <div className="privacyGrid">
        {sections.map(([title, text]) => (
          <article className="privacyCard" key={title}>
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </Page>
  );
}
function Documents() {
  const { t } = useLang();
  return (
    <Page title={t("docsTitle")} intro={t("docsIntro")}>
      <div className="documentGrid">
        <div className="documentCard">
          <FileText size={34} />
          <h3>{t("regCert")}</h3>
          <p>{t("regDesc")}</p>
          <a
            className="primary"
            href="/documents/registration-certificate.pdf"
            target="_blank"
            rel="noreferrer"
          >
            {t("viewPdf")} <ExternalLink size={16} />
          </a>
        </div>
        <div className="documentCard">
          <FileText size={34} />
          <h3>{t("ngoCert")}</h3>
          <p>{t("ngoDesc")}</p>
          <a
            className="primary"
            href="/documents/ngo-darpan-certificate.pdf"
            target="_blank"
            rel="noreferrer"
          >
            {t("viewPdf")} <ExternalLink size={16} />
          </a>
        </div>
      </div>
    </Page>
  );
}
function Volunteer() {
  const { t, lang } = useLang();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    area: "",
    message: "",
  });

  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [successPopup, setSuccessPopup] = useState(false);
  const [applicationNo, setApplicationNo] = useState("");

  const submit = async (e) => {
    e.preventDefault();

    if (submitting) return;

    setSubmitting(true);
    setMsg("");

    try {
      const r = await fetch(`${API}/volunteers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const d = await r.json();

      console.log("Volunteer API Response:", d);

      if (!r.ok || !d.success) {
        throw new Error(d.message || "Application submit नहीं हो सकी।");
      }

      // IMPORTANT
      const newApplicationNo = d.item?.applicationNo || "";

      console.log("Application No:", newApplicationNo);

      setApplicationNo(newApplicationNo);

      // Show popup
      setSuccessPopup(true);

      // Clear form
      setForm({
        name: "",
        phone: "",
        email: "",
        city: "",
        area: "",
        message: "",
      });
    } catch (error) {
      console.error("Volunteer submit error:", error);
      setMsg(error.message || "Backend से connection नहीं हो पाया।");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Page title={t("volTitle")} intro={t("volIntro")}>
        <div className="volunteerIntro">
          <Users size={38} />

          <div>
            <h2>{t("join")}</h2>

            <p>{t("joinText")}</p>
          </div>
        </div>

        <form className="form volunteerForm" onSubmit={submit}>
          <div className="formTwo">
            <label>
              {t("name")}

              <input
                required
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
              />
            </label>

            <label>
              {t("mobile")}

              <input
                required
                type="tel"
                value={form.phone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    phone: e.target.value,
                  })
                }
              />
            </label>

            <label>
              {t("email")}

              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
              />
            </label>

            <label>
              {t("city")}

              <input
                value={form.city}
                onChange={(e) =>
                  setForm({
                    ...form,
                    city: e.target.value,
                  })
                }
              />
            </label>
          </div>

          <label>
            {t("area")}

            <select
              value={form.area}
              onChange={(e) =>
                setForm({
                  ...form,
                  area: e.target.value,
                })
              }
            >
              <option value="">{t("choose")}</option>

              <option>शिक्षा सेवा / Education</option>

              <option>युवा जागरण / Youth</option>

              <option>सामाजिक सेवा / Social Service</option>

              <option>कार्यक्रम प्रबंधन / Event Management</option>

              <option>डिजिटल / IT सेवा / Digital IT</option>

              <option>अन्य / Other</option>
            </select>
          </label>

          <label>
            {t("message")}

            <textarea
              rows="5"
              value={form.message}
              onChange={(e) =>
                setForm({
                  ...form,
                  message: e.target.value,
                })
              }
            />
          </label>

          <button className="primary" type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : t("sendVolunteer")}

            <Users size={17} />
          </button>

          {msg && <p className="status errorStatus">{msg}</p>}
        </form>
      </Page>

      {/* ================= SUCCESS POPUP ================= */}

      {successPopup && (
        <div className="successOverlay" onClick={() => setSuccessPopup(false)}>
          <div className="successPopup" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="popupClose"
              onClick={() => setSuccessPopup(false)}
            >
              ×
            </button>

            <div className="successIcon">✓</div>

            <h2>
              {lang === "en"
                ? "Application Submitted Successfully!"
                : "आवेदन सफलतापूर्वक जमा हो गया!"}
            </h2>

            <p>
              {lang === "en"
                ? "Your volunteer application has been submitted successfully."
                : "आपका volunteer application successfully submit हो गया है।"}
            </p>

            {applicationNo && (
              <div className="applicationNumber">
                <span>
                  {lang === "en" ? "Application No." : "आवेदन संख्या"}
                </span>

                <strong>{applicationNo}</strong>
              </div>
            )}

            <button
              type="button"
              className="popupOk"
              onClick={() => setSuccessPopup(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
}
function Contact() {
  const { t, lang } = useLang();

  const { siteSettings } = useSiteSettings();

  const leaders = siteSettings.leaders || [];

  const address =
    lang === "en" ? siteSettings.addressEn : siteSettings.addressHi;

  const intro =
    lang === "en" ? siteSettings.contactIntroEn : siteSettings.contactIntroHi;

  const mapLink =
    siteSettings.mapUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      address,
    )}`;

  return (
    <Page title={t("contact")} intro={intro}>
      <div className="contactGrid">
        {leaders.map((leader, index) => (
          <div className="contactCard" key={`${leader.nameEn}-${index}`}>
            <span>{lang === "en" ? leader.roleEn : leader.roleHi}</span>

            <h3>{lang === "en" ? leader.nameEn : leader.nameHi}</h3>

            {leader.phone && (
              <p>
                <Phone size={16} />

                <a href={`tel:${leader.phone}`}>{leader.phone}</a>
              </p>
            )}
          </div>
        ))}

        <div className="contactCard wide">
          <span>{t("office")}</span>

          <h3>{t("address")}</h3>

          <p>
            <MapPin size={16} />

            <a href={mapLink} target="_blank" rel="noopener noreferrer">
              {address}
            </a>
          </p>

          <p>
            <Phone size={16} />

            <a href={`tel:${siteSettings.phone}`}>{siteSettings.phone}</a>
          </p>

          <p>
            <Mail size={16} />

            <a href={`mailto:${siteSettings.email}`}>{siteSettings.email}</a>
          </p>
        </div>

        <div className="contactCard wide">
          <h3>{lang === "en" ? "Connect With Us" : "हमसे जुड़ें"}</h3>

          <p>{intro}</p>

          <div className="contactSocials">
            {siteSettings.social.whatsapp && (
              <a
                href={siteSettings.social.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={20} />

                {lang === "en" ? "WhatsApp" : "व्हाट्सऐप"}
              </a>
            )}

            {siteSettings.social.facebook && (
              <a
                href={siteSettings.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Facebook size={20} />

                {lang === "en" ? "Facebook" : "फेसबुक"}
              </a>
            )}

            {siteSettings.social.instagram && (
              <a
                href={siteSettings.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram size={20} />

                {lang === "en" ? "Instagram" : "इंस्टाग्राम"}
              </a>
            )}

            {siteSettings.social.twitter && (
              <a
                href={siteSettings.social.twitter}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter size={20} />

                {lang === "en" ? "Twitter" : "Twitter / X"}
              </a>
            )}

            {siteSettings.email && (
              <a href={`mailto:${siteSettings.email}`}>
                <Mail size={20} />

                {lang === "en" ? "Email" : "ईमेल"}
              </a>
            )}
          </div>
        </div>
      </div>
    </Page>
  );
}
function Page({ title, intro, children }) {
  const { lang } = useLang();
  const currentSiteData = siteData[lang] || siteData.hi;

  return (
    <>
      <section className="pageHero">
        <span className="eyebrow">{currentSiteData.name}</span>
        <h1>{title}</h1>
        <p>{intro}</p>
      </section>
      <section className="section pageBody">{children}</section>
    </>
  );
}

function DonateRoute() {
  const { lang } = useLang();

  return <Donate lang={lang} />;
}

function PublicRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/activities" element={<Activities />} />
        <Route path="/activities/:id" element={<ActivityDetail />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/volunteer" element={<Volunteer />} />
        <Route path="/donate" element={<DonateRoute />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <SiteSettingsProvider>
        <Routes>
          {/* PUBLIC WEBSITE */}
          <Route path="/*" element={<PublicRoutes />} />

          {/* ADMIN */}
          <Route path="/admin/login" element={<AdminLogin />} />

          <Route path="/admin/dashboard" element={<AdminDashboard />} />

          <Route path="/admin/donations" element={<DonationAdmin />} />
          <Route path="/admin/profile" element={<AdminProfile />} />
        </Routes>
      </SiteSettingsProvider>
    </LanguageProvider>
  );
}
