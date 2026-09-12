import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Routes, Route, NavLink, Link } from "react-router-dom";
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
import { siteData, activities } from "./data/siteData";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const API_ORIGIN = API.replace(/\/api\/?$/, "");

const translations = {
  hi: {
    home: "होम",
    about: "हमारे बारे में",
    activities: "सेवा कार्य",
    finance: "वित्तीय पारदर्शिता",
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
      "दान और खर्च के रिकॉर्ड के लिए सुरक्षित backend API और database structure तैयार है।",
    pageAbout:
      "समिति का उद्देश्य सेवा, ज्ञान, संस्कार और विचार प्रचार के माध्यम से समाज में सकारात्मक योगदान देना है।",
    introTitle: "समिति का परिचय",
    introText:
      "यहाँ समिति का विस्तृत परिचय, उद्देश्य, स्थापना की पृष्ठभूमि, कार्यक्षेत्र और आगामी लक्ष्य लिखे जा सकते हैं। आप अपने अधिकृत दस्तावेज़ के अनुसार इस सामग्री को अपडेट कर सकते हैं।",
    registration: "पंजीकरण",
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
    ngoSection: "NGO Darpan प्रमाण पत्र",
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
    docsIntro: "समिति के पंजीकरण एवं NGO Darpan से संबंधित प्रमाण पत्र।",
    regCert: "Registration Certificate",
    regDesc: "पंजीकरण संख्या 284/ALWAR/2009-10.",
    ngoCert: "NGO Darpan Certificate",
    ngoDesc: "Unique ID RJ/2026/0967197.",
    viewPdf: "PDF देखें",
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
    socialNote: "Social media के official links siteData.js में बदलें।",
    rights: "सर्वाधिकार सुरक्षित।",
    language: "भाषा",
    light: "लाइट",
    dark: "डार्क",
    theme: "थीम",
  },
  en: {
    home: "Home",
    about: "About Us",
    activities: "Services",
    finance: "Financial Transparency",
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
      "A secure backend API and database structure is prepared for donation and expense records.",
    pageAbout:
      "The Samiti aims to contribute positively to society through service, knowledge, values and the outreach of Swami Vivekananda's ideas.",
    introTitle: "About the Samiti",
    introText:
      "Add the Samiti's detailed introduction, objectives, history, working areas and future goals here. Update this section according to authorized documents.",
    registration: "Registration",
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
    uploadPhoto: "Add Photo",
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
    socialNote: "Replace the official social-media links in siteData.js.",
    rights: "All rights reserved.",
    language: "Language",
    light: "Light",
    dark: "Dark",
    theme: "Theme",
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

function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const { t, lang, setLang, dark, setDark } = useLang();
  const links = [
    ["/", "home"],
    ["/about", "about"],
    ["/activities", "activities"],
    ["/finance", "finance"],
    ["/gallery", "gallery"],
    ["/contact", "contact"],
  ];
  return (
    <div className="app">
      <div className="topbar">
        <div>
          <span>{siteData.registration}</span>
          <span>{siteData.uniqueId}</span>
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
          <img src="/assets/logo.png" alt="Samiti logo" />
          <div>
            <strong>स्वामी विवेकानन्द</strong>
            <small>विचार प्रचार सेवा समिति</small>
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
      <footer className="footer">
        <div className="footerGrid">
          <div>
            <img src="/assets/logo.png" className="footerLogo" />
            <h3>{siteData.name}</h3>
            <p>{siteData.tagline}</p>
          </div>
          <div>
            <h4>{t("quick")}</h4>
            <Link to="/about">{t("about")}</Link>
            <Link to="/finance">{t("finance")}</Link>
            <Link to="/documents">{t("documents")}</Link>
            <Link to="/volunteer">{t("volunteer")}</Link>
            <Link to="/contact">{t("contact")}</Link>
          </div>
          <div>
            <h4>{t("contact")}</h4>
            <p>
              <MapPin size={16} />

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  siteData.address,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {siteData.address}
              </a>
            </p>
            <p>
              <Phone size={16} />
              <a href={`tel:${siteData.leaders[0].phone}`}>
                {siteData.leaders[0].phone}
              </a>
            </p>
            <p>
              <Mail size={16} />
              <a
                href="https://mail.google.com/mail/?view=cm&fs=1&to=svvpss13012010@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                svvpss13012010@gmail.com
              </a>
            </p>
            <div className="socials">
              <a
                href={siteData.social.instagram}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
              >
                <Instagram />
              </a>
              <a
                href={siteData.social.facebook}
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
              >
                <Facebook />
              </a>
              <a
                href={siteData.social.whatsapp}
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
              >
                <MessageCircle />
              </a>
              <a
                href={siteData.social.twitter}
                target="_blank"
                rel="noreferrer"
                aria-label="Twitter"
              >
                <Twitter />
              </a>
            </div>
            <small className="socialNote">{t("socialNote")}</small>
          </div>
        </div>
        <div className="copyright">
          © {new Date().getFullYear()} {siteData.name}. {t("rights")}
        </div>
      </footer>
    </div>
  );
}

function Home() {
  const { t } = useLang();
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
              {t("aboutBtn")} <ArrowRight size={18} />
            </Link>
            <Link className="secondary" to="/donate">
              <Heart size={18} />
              {t("supportBtn")}
            </Link>
          </div>
        </div>
        <div className="heroPoster">
          <img src="/assets/poster.jpg" alt="Samiti poster" />
        </div>
      </section>
      <section className="section">
        <div className="sectionHead">
          <div>
            <span className="eyebrow">{t("whatWeDo")}</span>
            <h2>{t("keyAreas")}</h2>
          </div>
          <Link to="/activities">
            {t("allActivities")} <ArrowRight size={18} />
          </Link>
        </div>
        <div className="cards">
          {activities.map(([title, text], i) => (
            <article className="card" key={title}>
              <div className="iconCircle">0{i + 1}</div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="quoteBand">
        <div>
          <span className="eyebrow">{t("inspiration")}</span>
          <h2>“उठो, जागो और तब तक नहीं रुको जब तक लक्ष्य प्राप्त न हो जाए।”</h2>
          <p>— स्वामी विवेकानन्द</p>
        </div>
      </section>
      <section className="section split">
        <div>
          <span className="eyebrow">{t("transparency")}</span>
          <h2>{t("transparentTitle")}</h2>
          <p>{t("transparentText")}</p>
          <Link className="primary" to="/finance">
            {t("viewFinance")} <ArrowRight size={18} />
          </Link>
        </div>
        <div className="trustBox">
          <ShieldCheck size={42} />
          <h3>{t("trust")}</h3>
          <p>{t("trustText")}</p>
        </div>
      </section>
    </>
  );
}
function About() {
  const { t } = useLang();
  return (
    <Page title={t("about")} intro={t("pageAbout")}>
      <div className="aboutGrid">
        <img src="/assets/logo.png" className="aboutLogo" />
        <div>
          <h2>{t("introTitle")}</h2>
          <p>{t("introText")}</p>
          <div className="infoList">
            <div>
              <b>{t("registration")}</b>
              <span>{siteData.registration}</span>
            </div>
            <div>
              <b>Unique ID</b>
              <span>{siteData.uniqueId}</span>
            </div>
            <div>
              <b>{t("address")}</b>
              <span>{siteData.address}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="certificateSection">
        <div>
          <span className="eyebrow">{t("certificateSection")}</span>
          <h2>{t("certificateSection")}</h2>
          <iframe
            className="pdfFrame"
            src="/documents/registration-certificate.pdf"
            title="Registration Certificate"
          />
        </div>
        <div>
          <span className="eyebrow">{t("ngoSection")}</span>
          <h2>{t("ngoSection")}</h2>
          <iframe
            className="pdfFrame"
            src="/documents/ngo-darpan-certificate.pdf"
            title="NGO Darpan Certificate"
          />
        </div>
      </div>
    </Page>
  );
}
function langObjectiveCards(t) {
  return t("about") === "हमारे बारे में"
    ? [
        [
          "मानव कल्याण",
          "जाति, धर्म, सम्प्रदाय या लिंग भेद के बिना मानव कल्याण के लिए कार्य करना।",
        ],
        [
          "शिक्षा एवं डिजिटल साक्षरता",
          "शिक्षा का प्रचार-प्रसार, पुस्तकालय/वाचनालय, खेल एवं डिजिटल शिक्षा और कंप्यूटर साक्षरता कार्यक्रम।",
        ],
        [
          "रोजगार एवं कौशल विकास",
          "युवाओं के लिए तकनीकी, शिक्षक, नर्सिंग, कंप्यूटर, औद्योगिक और अन्य कौशल प्रशिक्षण केंद्रों को बढ़ावा देना।",
        ],
        [
          "स्वास्थ्य सेवा",
          "स्वास्थ्य जागरूकता, चिकित्सा प्रशिक्षण, निःशुल्क मेडिकल/नेत्र कैंप और जरूरतमंदों को स्वास्थ्य सहायता।",
        ],
        [
          "महिला सशक्तिकरण",
          "महिला विकास योजनाओं में सहयोग, रोजगार प्रशिक्षण और स्वयं सहायता समूहों के माध्यम से सशक्तिकरण।",
        ],
      ]
    : [
        [
          "Human Welfare",
          "Work for human welfare without discrimination of caste, religion, community or gender.",
        ],
        [
          "Education & Digital Literacy",
          "Promote education, libraries, sports, digital education and computer literacy programs.",
        ],
        [
          "Employment & Skill Development",
          "Support technical, teaching, nursing, computer, industrial and other skill-development training.",
        ],
        [
          "Health Services",
          "Promote health awareness, medical training, free medical/eye camps and support for people in need.",
        ],
        [
          "Women Empowerment",
          "Support women-development schemes, employment training and self-help group based empowerment.",
        ],
      ];
}

function Activities() {
  const { t } = useLang();
  const objectiveCards = langObjectiveCards(t);
  return (
    <Page title={t("activities")} intro={t("activitiesIntro")}>
      <div className="cards">
        {activities.map(([title, text], i) => (
          <article className="card large" key={title}>
            <div className="iconCircle">0{i + 1}</div>
            <h3>{title}</h3>
            <p>{text}</p>
            <button className="textBtn">
              {t("details")} <ArrowRight size={16} />
            </button>
          </article>
        ))}
      </div>
      <div className="objectiveSection">
        <span className="eyebrow">{t("serviceObjectives")}</span>
        <h2>{t("serviceObjectives")}</h2>
        <p className="objectiveSource">{t("serviceSource")}</p>
        <div className="objectiveGrid">
          {objectiveCards.map((x, i) => (
            <article className="objectiveCard" key={i}>
              <div className="iconCircle">{i + 1}</div>
              <h3>{x[0]}</h3>
              <p>{x[1]}</p>
            </article>
          ))}
        </div>
      </div>
    </Page>
  );
}
function Finance() {
  const { t } = useLang();
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch(`${API}/finance/summary`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);
  const s = data?.summary || { income: 0, expense: 0, balance: 0 };
  return (
    <Page title={t("finance")} intro={t("financeIntro")}>
      <div className="financeCards">
        <div>
          <IndianRupee />
          <span>{t("income")}</span>
          <strong>₹{s.income.toLocaleString("en-IN")}</strong>
        </div>
        <div>
          <IndianRupee />
          <span>{t("expense")}</span>
          <strong>₹{s.expense.toLocaleString("en-IN")}</strong>
        </div>
        <div>
          <IndianRupee />
          <span>{t("balance")}</span>
          <strong>₹{s.balance.toLocaleString("en-IN")}</strong>
        </div>
      </div>
      <div className="tableWrap">
        <h2>{t("records")}</h2>
        <table>
          <thead>
            <tr>
              <th>{t("date")}</th>
              <th>{t("type")}</th>
              <th>{t("category")}</th>
              <th>{t("description")}</th>
              <th>{t("amount")}</th>
            </tr>
          </thead>
          <tbody>
            {(data?.records || []).map((r, i) => (
              <tr key={i}>
                <td>{r.date}</td>
                <td>
                  {r.type === "income" ? t("incomeWord") : t("expenseWord")}
                </td>
                <td>{r.category}</td>
                <td>{r.description}</td>
                <td>₹{Number(r.amount).toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="notice">
        <b>{t("important")}</b> {t("demo")}
      </div>
    </Page>
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
      .then((d) => setPhotos(d.items || []))
      .catch(() => {});
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
        <img src="/assets/poster.jpg" alt="Program poster" />
        <img src="/assets/logo.png" alt="Samiti logo" />
        {photos.map((p, i) => (
          <img key={i} src={p.url} alt={p.originalName || "Samiti activity"} />
        ))}
        <label className="galleryAddCard">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={upload}
            hidden
          />
          <span className="galleryPlus">
            <Plus size={42} />
          </span>
          <strong>{uploading ? t("uploading") : t("uploadPhoto")}</strong>
          <small>Click here to add more program photos</small>
        </label>
      </div>
    </Page>
  );
}
function Donate() {
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
  const { t } = useLang();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    area: "",
    message: "",
  });
  const [msg, setMsg] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setMsg(t("sending"));
    try {
      const r = await fetch(`${API}/volunteers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      setMsg(d.success ? `${t("application")} ${d.applicationNo}` : d.message);
    } catch {
      setMsg(t("backendError"));
    }
  };
  return (
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
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label>
            {t("mobile")}
            <input
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
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
            {t("city")}
            <input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </label>
        </div>
        <label>
          {t("area")}
          <select
            value={form.area}
            onChange={(e) => setForm({ ...form, area: e.target.value })}
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
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          ></textarea>
        </label>
        <button className="primary" type="submit">
          {t("sendVolunteer")} <Users size={17} />
        </button>
        {msg && <p className="status">{msg}</p>}
      </form>
    </Page>
  );
}
function Contact() {
  const { t } = useLang();
  return (
    <Page title={t("contact")} intro={t("contactIntro")}>
      <div className="contactGrid">
        {siteData.leaders.map((x) => (
          <div className="contactCard" key={x.role}>
            <span>{x.role}</span>
            <h3>{x.name}</h3>
            <p>
              <Phone size={16} /> {x.phone}
            </p>
          </div>
        ))}
        <div className="contactCard wide">
          <span>{t("office")}</span>
          <h3>{t("address")}</h3>
          <p>
            <MapPin size={16} /> {siteData.address}
          </p>
        </div>
             {/* Social Media */}
        <div className="contactCard wide">
          <span>Connect With Us</span>
          <h3>हमसे जुड़ें</h3>
          <p>हमारे साथ जुड़ने और नवीनतम गतिविधियों की जानकारी पाने के लिए:</p>
          <div className="contactSocials">

            {/* WhatsApp */}
            <a
              href={siteData.social.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle size={20} />
              WhatsApp
            </a>

            {/* Facebook */}
            <a
              href={siteData.social.facebook}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Facebook size={20} />
              Facebook
            </a>

            {/* Instagram */}
            <a
              href={siteData.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Instagram size={20} />
               Instagram
            </a>

            {/* Twitter / X */}
            <a
              href={siteData.social.twitter}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Twitter size={20} />
              Twitter 
            </a>

            {/* Email */}
            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=svvpss13012010@gmail.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Mail size={20} />
              Email
            </a>

          </div>
        </div>
      </div>
    </Page>
  );
}
function Page({ title, intro, children }) {
  return (
    <>
      <section className="pageHero">
        <span className="eyebrow">
          स्वामी विवेकानन्द विचार प्रचार सेवा समिति
        </span>
        <h1>{title}</h1>
        <p>{intro}</p>
      </section>
      <section className="section pageBody">{children}</section>
    </>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/volunteer" element={<Volunteer />} />
          <Route path="/donate" element={<Donate />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </Layout>
    </LanguageProvider>
  );
}
