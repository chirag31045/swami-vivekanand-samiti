import mongoose from "mongoose";

const leaderSchema = new mongoose.Schema(
  {
    roleHi: {
      type: String,
      trim: true,
      default: "",
    },

    roleEn: {
      type: String,
      trim: true,
      default: "",
    },

    nameHi: {
      type: String,
      trim: true,
      default: "",
    },

    nameEn: {
      type: String,
      trim: true,
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const siteSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      unique: true,
      default: "main",
      index: true,
    },

    /* ================= BRAND ================= */

    logo: {
      type: String,
      default: "/assets/logo.png",
      trim: true,
    },

    poster: {
      type: String,
      default: "/assets/poster.png",
      trim: true,
    },

    nameHi: {
      type: String,
      trim: true,
      default: "स्वामी विवेकानन्द विचार प्रचार सेवा समिति",
    },

    nameEn: {
      type: String,
      trim: true,
      default: "Swami Vivekananda Vichar Prachar Seva Samiti",
    },

    taglineHi: {
      type: String,
      trim: true,
      default: "सेवा • ज्ञान • प्रचार",
    },

    taglineEn: {
      type: String,
      trim: true,
      default: "Service • Knowledge • Propagation",
    },

    /* ================= IDENTITY ================= */

registrationHi: {
  type: String,
  trim: true,
  default:
    "पंजीकरण क्रमांक:- 284/ALWAR/2009-10",
},

registrationEn: {
  type: String,
  trim: true,
  default:
    "REG.No:- 284/ALWAR/2009-10",
},

uniqueIdHi: {
  type: String,
  trim: true,
  default:
    "विशिष्ट पहचान संख्या:- RJ/2026/0967197",
},

uniqueIdEn: {
  type: String,
  trim: true,
  default:
    "Unique ID:- RJ/2026/0967197",
},
    /* ================= CONTACT ================= */

    contactIntroHi: {
      type: String,
      trim: true,
      default:
        "समिति से जुड़ने, कार्यक्रम या सेवा संबंधी जानकारी के लिए संपर्क करें।",
    },

    contactIntroEn: {
      type: String,
      trim: true,
      default:
        "Contact the Samiti for programs, service activities or other information.",
    },

    addressHi: {
      type: String,
      trim: true,
      default:
        "ग्राम खेड़ा, पोस्ट पालपुर, तह. किशनगढ़-बास, जिला खैरथल-तिजारा (राज.)",
    },

    addressEn: {
      type: String,
      trim: true,
      default:
        "Village Kheda, Post Palpur, Tehsil Kishangarh-Bas, District Khairthal-Tijara (Rajasthan)",
    },

    phone: {
      type: String,
      trim: true,
      default: "8769251133",
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "svvpss13012010@gmail.com",
    },

    mapUrl: {
      type: String,
      trim: true,
      default: "",
    },

    /* ================= SOCIAL ================= */

    social: {
      instagram: {
        type: String,
        trim: true,
        default: "",
      },

      facebook: {
        type: String,
        trim: true,
        default: "",
      },

      whatsapp: {
        type: String,
        trim: true,
        default: "",
      },

      twitter: {
        type: String,
        trim: true,
        default: "",
      },
    },

    /* ================= LEADERS ================= */

    leaders: {
      type: [leaderSchema],
      default: [
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
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "SiteSettings",
  siteSettingsSchema
);