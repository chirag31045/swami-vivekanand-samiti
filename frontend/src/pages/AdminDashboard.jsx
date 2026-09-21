import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  WalletCards,
  Image,
  LogOut,
  Moon,
  Sun,
  ChevronDown,
  RefreshCw,
  CheckCircle2,
  Clock3,
  XCircle,
  Eye,
  Trash2,
  Menu,
  Plus,
  X,
  Pencil,
  Upload,
  FileSpreadsheet,
  Download,
  CircleCheck,
  CircleX,
  CheckSquare,
  Square,
  Loader2,
  Save,
  ImagePlus,
  FileText,
  Settings,
  UserPlus,
  UserRound,
} from "lucide-react";

import Pagination from "../pages/Pagination";
import * as XLSX from "xlsx";
import { useSiteSettings, getAssetUrl } from "../pages/siteSettingsContext";
import DonationAdmin from "./DonationAdmin";
import AdminRegistration from "./AdminRegistration";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const AREAS_OF_INTEREST = [
  "शिक्षा सेवा / Education",
  "युवा जागरण / Youth",
  "सामाजिक सेवा / Social Service",
  "कार्यक्रम प्रबंधन / Event Management",
  "डिजिटल / IT सेवा / Digital IT",
  "अन्य / Other",
];

const INITIAL_VOLUNTEER_FORM = {
  name: "",
  phone: "",
  email: "",
  city: "",
  area: "",
  message: "",
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const volunteerFileInputRef = useRef(null);
  const token = localStorage.getItem("adminToken");
  const { siteSettings, refreshSiteSettings } = useSiteSettings();

  const [adminUser] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("adminUser") || '{"username":"admin"}',
      );
    } catch {
      return { username: "admin" };
    }
  });

  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("adminTheme") === "dark",
  );
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminProfile, setAdminProfile] = useState(null);
  const [activeSection, setActiveSection] = useState("dashboard");

  // Volunteers State
  const [volunteers, setVolunteers] = useState([]);
  const [volunteerLoading, setVolunteerLoading] = useState(false);
  const [volunteerType, setVolunteerType] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState({
    total: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
    newApplications: 0,
  });

  // Filter States
  const [filters, setFilters] = useState({
    search: "",
    city: "",
    area: "",
    status: "",
    startDate: "",
    endDate: "",
  });

  // Finance & Gallery
  const [finance, setFinance] = useState([]);
  const [financeLoading, setFinanceLoading] = useState(false);

  const [donationStats, setDonationStats] = useState({
    paid: { count: 0, amount: 0 },
    pending: { count: 0, amount: 0 },
    failed: { count: 0, amount: 0 },
    refunded: { count: 0, amount: 0 },
  });

  const [gallery, setGallery] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);

  // Modals & Actions
  const [volunteerModal, setVolunteerModal] = useState(false);
  const [editingVolunteer, setEditingVolunteer] = useState(null);
  const [volunteerForm, setVolunteerForm] = useState(INITIAL_VOLUNTEER_FORM);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [viewVolunteer, setViewVolunteer] = useState(null);

  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [bulkModal, setBulkModal] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState("");

  // Toast Feedback
  const [toastMessage, setToastMessage] = useState("");
  const [successApplicationNo, setSuccessApplicationNo] = useState("");
  const [openStatusDropdown, setOpenStatusDropdown] = useState(null);
  const [selectedVolunteers, setSelectedVolunteers] = useState([]);
  const [bulkStatusLoading, setBulkStatusLoading] = useState(false);

  const [galleryModal, setGalleryModal] = useState(false);
  const [galleryEditId, setGalleryEditId] = useState(null);
  const [galleryFile, setGalleryFile] = useState(null);
  const [galleryPreview, setGalleryPreview] = useState("");
  const [gallerySaving, setGallerySaving] = useState(false);
  const [galleryDeleteId, setGalleryDeleteId] = useState(null);
  const [galleryView, setGalleryView] = useState(null);
  const [galleryDeleteModal, setGalleryDeleteModal] = useState(false);

  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activityModal, setActivityModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [activitySaving, setActivitySaving] = useState(false);
  const [activityView, setActivityView] = useState(null);
  const [activityDeleteNo, setActivityDeleteNo] = useState(null);
  const [activityDeleteModal, setActivityDeleteModal] = useState(false);
  const [activityFile, setActivityFile] = useState(null);
  const [activityPreview, setActivityPreview] = useState("");
  const EMPTY_ACTIVITY_FORM = {
    activityNo: "",
    hiTitle: "",
    hiShortText: "",
    hiDetails: "",
    enTitle: "",
    enShortText: "",
    enDetails: "",
  };
  const [activityForm, setActivityForm] = useState(EMPTY_ACTIVITY_FORM);
  const [bulkActivityModal, setBulkActivityModal] = useState(false);
  const [bulkActivities, setBulkActivities] = useState([]);
  const [bulkImages, setBulkImages] = useState([]);
  const [bulkSaving, setBulkSaving] = useState(false);

  const EMPTY_SITE_SETTINGS_FORM = {
    nameHi: "",
    nameEn: "",

    taglineHi: "",
    taglineEn: "",

    registrationHi: "",
    registrationEn: "",

    uniqueIdHi: "",
    uniqueIdEn: "",

    contactIntroHi: "",
    contactIntroEn: "",

    addressHi: "",
    addressEn: "",

    phone: "",
    email: "",
    mapUrl: "",

    instagram: "",
    facebook: "",
    whatsapp: "",
    twitter: "",

    leaders: [],
  };

  const [siteSettingsForm, setSiteSettingsForm] = useState(
    EMPTY_SITE_SETTINGS_FORM,
  );

  const [siteSettingsLoading, setSiteSettingsLoading] = useState(false);

  const [siteSettingsSaving, setSiteSettingsSaving] = useState(false);

  const [siteLogoFile, setSiteLogoFile] = useState(null);

  const [sitePosterFile, setSitePosterFile] = useState(null);

  const [siteLogoPreview, setSiteLogoPreview] = useState("");

  const [sitePosterPreview, setSitePosterPreview] = useState("");

  useEffect(() => {
    localStorage.setItem("adminTheme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const logout = async () => {
    const currentToken = localStorage.getItem("adminToken");
    try {
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

  const showToast = (msg, duration = 3000) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), duration);
  };

  /* Unified API Fetcher */
  const apiRequest = async (endpoint, options = {}) => {
    if (!token) {
      logout();
      return null;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };

    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    try {
      const response = await fetch(`${API}${endpoint}`, {
        ...options,
        headers,
      });
      if (response.status === 401) {
        logout();
        return null;
      }
      return await response.json();
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  };

  /* =========================
   BULK VOLUNTEER SELECTION
========================= */

  const toggleVolunteerSelection = (id) => {
    setSelectedVolunteers((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleSelectAllVolunteers = () => {
    if (selectedVolunteers.length === volunteers.length) {
      setSelectedVolunteers([]);
    } else {
      setSelectedVolunteers(volunteers.map((v) => v._id));
    }
  };

  const getStatusIcon = (status) => {
    switch (String(status || "").toLowerCase()) {
      case "approved":
        return <CircleCheck size={20} />;

      case "rejected":
        return <CircleX size={20} />;

      case "pending":
      default:
        return <Clock3 size={20} />;
    }
  };

  /* Fetch Volunteers */
  const loadVolunteers = async (
    type = volunteerType,
    currentPage = page,
    currentLimit = limit,
  ) => {
    setVolunteerLoading(true);
    try {
      const params = new URLSearchParams();
      if (type === "approved" || type === "rejected")
        params.set("status", type);
      if (type === "new") params.set("type", "new");

      Object.entries(filters).forEach(([key, val]) => {
        if (val.trim()) params.set(key, val.trim());
      });

      params.set("page", currentPage);
      params.set("limit", currentLimit);

      const data = await apiRequest(`/volunteers?${params.toString()}`);
      if (data?.success) {
        setVolunteers(data.items || []);
        setTotalItems(Number(data.pagination?.total) || 0);
        setTotalPages(Number(data.pagination?.totalPages) || 1);
        if (data.counts) setCounts(data.counts);
      }
    } finally {
      setVolunteerLoading(false);
    }
  };

  const loadFinance = async () => {
    setFinanceLoading(true);
    const data = await apiRequest("/finance");
    if (data?.success) setFinance(data.items || []);
    setFinanceLoading(false);
  };

  const loadGallery = async () => {
    setGalleryLoading(true);
    const data = await apiRequest("/gallery");
    if (data?.success) setGallery(data.items || []);
    setGalleryLoading(false);
  };

  const openGalleryAdd = () => {
    setGalleryEditId(null);
    setGalleryFile(null);
    setGalleryPreview("");
    setGalleryModal(true);
  };

  const openGalleryEdit = (photo) => {
    setGalleryEditId(photo._id);
    setGalleryFile(null);
    setGalleryPreview(
      photo.url?.startsWith("http")
        ? photo.url
        : `${API.replace("/api", "")}${photo.url}`,
    );
    setGalleryModal(true);
  };

  const closeGalleryModal = () => {
    if (gallerySaving) return;

    setGalleryModal(false);
    setGalleryEditId(null);
    setGalleryFile(null);
    setGalleryPreview("");
  };

  const handleGalleryFileChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5 MB.");
      return;
    }

    setGalleryFile(file);
    setGalleryPreview(URL.createObjectURL(file));
  };

  const saveGalleryImage = async () => {
    if (!galleryEditId && !galleryFile) {
      showToast("Please select an image.");
      return;
    }

    const isUpdate = Boolean(galleryEditId);

    try {
      setGallerySaving(true);

      const formData = new FormData();

      if (galleryFile) {
        formData.append("photo", galleryFile);
      }

      const url = isUpdate
        ? `${API}/gallery/${galleryEditId}`
        : `${API}/gallery/upload`;

      const response = await fetch(url, {
        method: isUpdate ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.status === 401) {
        logout();
        return;
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to save gallery image.");
      }

      closeGalleryModal();

      await loadGallery();

      showToast(
        isUpdate
          ? "Gallery image updated successfully."
          : "Gallery image uploaded successfully.",
      );
    } catch (error) {
      console.error("Gallery save error:", error);
      showToast(error.message || "Failed to save gallery image.");
    } finally {
      setGallerySaving(false);
    }
  };

  const openGalleryDelete = (id) => {
    setGalleryDeleteId(id);
    setGalleryDeleteModal(true);
  };

  const confirmGalleryDelete = async () => {
    if (!galleryDeleteId) return;

    const id = galleryDeleteId;

    try {
      const response = await fetch(`${API}/gallery/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        logout();
        return;
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete image.");
      }

      setGallery((prev) => prev.filter((item) => item._id !== id));

      setGalleryDeleteId(null);
      setGalleryDeleteModal(false);

      showToast("Gallery image deleted successfully.");
    } catch (error) {
      console.error("Gallery delete error:", error);

      setGalleryDeleteId(null);

      showToast(error.message || "Failed to delete image.");
    }
  };

  const loadAdminProfile = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API}/admin/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        logout();
        return;
      }
      const data = await response.json();
      if (response.ok && data?.success && data?.profile) {
        setAdminProfile(data.profile);
        localStorage.setItem("adminUser", JSON.stringify(data.profile));
      }
    } catch (error) {
      console.error("Admin profile loading error:", error);
    }
  };

  useEffect(() => {
    if (!token) return logout();
    loadVolunteers();
    loadFinance();
    loadGallery();
    loadAdminProfile();
  }, []);

  useEffect(() => {
    if (["volunteers", "approved", "new", "rejected"].includes(activeSection)) {
      loadVolunteers(volunteerType, page, limit);
    }
  }, [activeSection, volunteerType, page, limit]);

  /* Section & Tab Handlers */
  const openSection = (section) => {
    setActiveSection(section);
    setProfileOpen(false);
    setSidebarOpen(false);

    if (["volunteers", "approved", "new", "rejected"].includes(section)) {
      setVolunteerType(section === "volunteers" ? "all" : section);

      setPage(1);

      return;
    }

    if (section === "finance") {
      loadFinance();
      return;
    }

    if (section === "gallery") {
      loadGallery();
      return;
    }

    if (section === "activities") {
      loadActivities();
      return;
    }

    if (section === "websiteSettings") {
      loadSiteSettings();
      return;
    }

    // Donation components load their own API data
    if (section === "donations") {
      return;
    }
  };
  const changeStatus = async (id, status) => {
    const data = await apiRequest(`/volunteers/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });

    if (data?.success) {
      setVolunteers((prev) =>
        prev.map((v) => (v._id === id ? { ...v, status } : v)),
      );
      loadVolunteers(volunteerType, page, limit);
    } else {
      alert(data?.message || "Failed to update status");
    }
  };

  /* =========================
   BULK CHANGE STATUS
========================= */

  const bulkChangeStatus = async (status) => {
    if (!selectedVolunteers.length) {
      alert("Please select at least one volunteer.");
      return;
    }

    const statusText =
      status === "approved"
        ? "approve"
        : status === "rejected"
          ? "reject"
          : "move to pending";

    const confirmed = window.confirm(
      `Are you sure you want to ${statusText} ${selectedVolunteers.length} volunteer(s)?`,
    );

    if (!confirmed) return;

    try {
      setBulkStatusLoading(true);

      const response = await fetch(`${API}/volunteers/bulk-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ids: selectedVolunteers,
          status,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok || !data.success) {
        alert(data.message || "Failed to update volunteer statuses.");
        return;
      }

      // Update current table immediately
      setVolunteers((prev) =>
        prev.map((volunteer) =>
          selectedVolunteers.includes(volunteer._id)
            ? {
                ...volunteer,
                status,
              }
            : volunteer,
        ),
      );

      // Clear selection
      setSelectedVolunteers([]);

      // Refresh data
      await loadVolunteers();

      if (sectionVolunteerType) {
        await loadVolunteerSection(
          sectionVolunteerType,
          sectionPage,
          sectionLimit,
        );
      }
    } catch (error) {
      console.error("Bulk status update error:", error);
      alert("Something went wrong while updating statuses.");
    } finally {
      setBulkStatusLoading(false);
    }
  };

  /* Add / Edit Volunteer */
  const openVolunteerModal = (volunteer = null) => {
    setEditingVolunteer(volunteer);
    setVolunteerForm(volunteer ? { ...volunteer } : INITIAL_VOLUNTEER_FORM);
    setVolunteerModal(true);
  };

  const validateVolunteerForm = () => {
    const name = volunteerForm.name.trim();
    const phone = volunteerForm.phone.trim();
    const email = volunteerForm.email.trim();
    const city = volunteerForm.city.trim();
    const area = volunteerForm.area.trim();
    const message = volunteerForm.message.trim();

    if (!name) {
      return "Name is required.";
    }

    if (name.length < 3) {
      return "Name must be at least 3 characters.";
    }

    if (!/^[A-Za-z\u0900-\u097F\s]+$/.test(name)) {
      return "Name can contain only letters.";
    }

    if (!phone) {
      return "Mobile number is required.";
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      return "Enter a valid 10-digit mobile number.";
    }

    if (!email) {
      return "Email is required.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Enter a valid email address.";
    }

    if (!city) {
      return "City is required.";
    }

    if (city.length < 2) {
      return "City must be at least 2 characters.";
    }

    if (!area) {
      return "Area of Interest is required.";
    }

    if (!AREAS_OF_INTEREST.includes(area)) {
      return "Please select a valid Area of Interest.";
    }

    if (!message) {
      return "Message is required.";
    }

    if (message.length < 5) {
      return "Message must be at least 5 characters.";
    }

    if (message.length > 500) {
      return "Message cannot exceed 500 characters.";
    }

    return "";
  };

  const handleVolunteerSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateVolunteerForm();

    if (validationError) {
      alert(validationError);
      return;
    }

    setSubmitLoading(true);

    try {
      const isEdit = Boolean(editingVolunteer);
      const url = isEdit
        ? `/volunteers/${editingVolunteer._id}/status`
        : "/volunteers";
      const method = isEdit ? "PATCH" : "POST";

      const data = await apiRequest(url, {
        method,
        body: JSON.stringify(volunteerForm),
      });

      if (!data?.success)
        throw new Error(data?.message || "Failed to save volunteer");

      setVolunteerModal(false);
      showToast(
        isEdit
          ? "Volunteer updated successfully."
          : "Volunteer added successfully.",
      );

      if (!isEdit && data.item?.applicationNo) {
        setSuccessApplicationNo(data.item.applicationNo);
      }

      loadVolunteers(volunteerType, page, limit);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  /* Delete Volunteer */
  const handleDeleteVolunteer = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);

    try {
      const data = await apiRequest(`/volunteers/${deleteId}`, {
        method: "DELETE",
      });
      if (data?.success) {
        setDeleteModal(false);
        setDeleteId(null);
        showToast("Volunteer deleted successfully.");
        if (volunteers.length === 1 && page > 1) setPage(page - 1);
        else loadVolunteers(volunteerType, page, limit);
      } else {
        throw new Error(data?.message || "Failed to delete");
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  /* Bulk Import */
  const submitBulkImport = async () => {
    if (!bulkFile) return setBulkError("Please choose an Excel file first.");
    setBulkLoading(true);
    setBulkError("");

    try {
      const formData = new FormData();
      formData.append("file", bulkFile);

      const data = await apiRequest("/volunteers/bulk", {
        method: "POST",
        body: formData,
      });

      if (!data?.success)
        throw new Error(data?.message || "Bulk import failed");

      setBulkModal(false);
      setBulkFile(null);
      if (volunteerFileInputRef.current)
        volunteerFileInputRef.current.value = "";

      showToast(data.message);
      loadVolunteers(volunteerType, page, limit);
    } catch (err) {
      setBulkError(err.message);
    } finally {
      setBulkLoading(false);
    }
  };

  const loadActivities = async () => {
    setActivitiesLoading(true);

    try {
      const data = await apiRequest("/activities");

      if (data?.success) {
        setActivities(data.items || []);
      }
    } catch (error) {
      console.error("Activities loading error:", error);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const openActivityAdd = () => {
    setEditingActivity(null);
    setActivityFile(null);
    setActivityPreview("");
    setActivityModal(true);
    setActivityForm(EMPTY_ACTIVITY_FORM);
  };

  const openActivityEdit = (activity) => {
    setEditingActivity(activity);

    setActivityForm({
      activityNo: activity.activityNo || "",
      hiTitle: activity.hi?.title || "",
      hiShortText: activity.hi?.shortText || "",
      hiDetails: activity.hi?.details || "",
      enTitle: activity.en?.title || "",
      enShortText: activity.en?.shortText || "",
      enDetails: activity.en?.details || "",
    });

    setActivityFile(null);

    setActivityPreview(
      activity.image?.startsWith("http")
        ? activity.image
        : `${API.replace("/api", "")}${activity.image}`,
    );

    setActivityModal(true);
  };

  const closeActivityModal = () => {
    if (activitySaving) return;

    setActivityModal(false);
    setEditingActivity(null);
    setActivityFile(null);
    setActivityPreview("");
  };

  const handleActivityFileChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please select an image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("Image size must be less than 5 MB.");
      return;
    }

    setActivityFile(file);
    setActivityPreview(URL.createObjectURL(file));
  };

  const saveActivity = async () => {
    if (!editingActivity && !activityFile) {
      showToast("Activity image is required.");
      return;
    }

    try {
      setActivitySaving(true);

      const formData = new FormData();

      formData.append(
        "activityNo",
        editingActivity ? editingActivity.activityNo : activityForm.activityNo,
      );

      formData.append("hiTitle", activityForm.hiTitle);

      formData.append("hiShortText", activityForm.hiShortText);

      formData.append("hiDetails", activityForm.hiDetails);

      formData.append("enTitle", activityForm.enTitle);

      formData.append("enShortText", activityForm.enShortText);

      formData.append("enDetails", activityForm.enDetails);

      if (activityFile) {
        formData.append("image", activityFile);
      }

      const url = editingActivity
        ? `${API}/activities/${editingActivity.activityNo}`
        : `${API}/activities`;

      const response = await fetch(url, {
        method: editingActivity ? "PUT" : "POST",

        headers: {
          Authorization: `Bearer ${token}`,
        },

        body: formData,
      });

      if (response.status === 401) {
        logout();
        return;
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to save activity.");
      }

      closeActivityModal();

      await loadActivities();

      showToast(
        editingActivity
          ? "Activity updated successfully."
          : "Activity added successfully.",
      );
    } catch (error) {
      console.error("Activity save error:", error);

      showToast(error.message || "Failed to save activity.");
    } finally {
      setActivitySaving(false);
    }
  };

  const openActivityDelete = (activityNo) => {
    setActivityDeleteNo(activityNo);
    setActivityDeleteModal(true);
  };

  const confirmActivityDelete = async () => {
    if (!activityDeleteNo) return;

    try {
      const data = await apiRequest(`/activities/${activityDeleteNo}`, {
        method: "DELETE",
      });

      if (!data?.success) {
        throw new Error(data?.message || "Failed to delete activity.");
      }

      setActivities((prev) =>
        prev.filter((item) => item.activityNo !== activityDeleteNo),
      );

      setActivityDeleteNo(null);
      setActivityDeleteModal(false);

      showToast("Activity deleted successfully.");
    } catch (error) {
      console.error("Activity delete error:", error);

      showToast(error.message || "Failed to delete activity.");
    }
  };

  const openBulkActivityModal = () => {
    setBulkActivities(
      Array.from({ length: 15 }, (_, index) => ({
        activityNo: index + 1,
        hiTitle: "",
        hiShortText: "",
        hiDetails: "",
        enTitle: "",
        enShortText: "",
        enDetails: "",
      })),
    );

    setBulkImages([]);

    setBulkActivityModal(true);
  };

  const updateBulkActivity = (index, field, value) => {
    setBulkActivities((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  };

  const handleBulkImages = (e) => {
    const files = Array.from(e.target.files || []);

    if (files.length !== 15) {
      showToast("Please select exactly 15 images.");
      return;
    }

    const invalid = files.some(
      (file) => !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024,
    );

    if (invalid) {
      showToast("Only images up to 5 MB are allowed.");
      return;
    }

    setBulkImages(files);
  };

  const saveBulkActivities = async () => {
    if (bulkActivities.length !== 15) {
      showToast("15 activities are required.");
      return;
    }

    if (bulkImages.length !== 15) {
      showToast("Please select exactly 15 images.");
      return;
    }

    try {
      setBulkSaving(true);

      const formData = new FormData();

      formData.append("activities", JSON.stringify(bulkActivities));

      bulkImages.forEach((file) => {
        formData.append("images", file);
      });

      const response = await fetch(`${API}/activities/bulk`, {
        method: "POST",

        headers: {
          Authorization: `Bearer ${token}`,
        },

        body: formData,
      });

      if (response.status === 401) {
        logout();
        return;
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to add activities.");
      }

      setBulkActivityModal(false);
      setBulkActivities([]);
      setBulkImages([]);

      await loadActivities();

      showToast(data.message || "Activities added successfully.");
    } catch (error) {
      console.error("Bulk activity error:", error);

      showToast(error.message || "Failed to add activities.");
    } finally {
      setBulkSaving(false);
    }
  };

  const buildSiteSettingsForm = (settings) => {
    return {
      nameHi: settings?.nameHi || "",

      nameEn: settings?.nameEn || "",

      taglineHi: settings?.taglineHi || "",

      taglineEn: settings?.taglineEn || "",

      registrationHi: settings?.registrationHi || settings?.registration || "",

      registrationEn: settings?.registrationEn || "",

      uniqueIdHi: settings?.uniqueIdHi || settings?.uniqueId || "",

      uniqueIdEn: settings?.uniqueIdEn || "",

      contactIntroHi: settings?.contactIntroHi || "",

      contactIntroEn: settings?.contactIntroEn || "",

      addressHi: settings?.addressHi || "",

      addressEn: settings?.addressEn || "",

      phone: settings?.phone || "",

      email: settings?.email || "",

      mapUrl: settings?.mapUrl || "",

      instagram: settings?.social?.instagram || "",

      facebook: settings?.social?.facebook || "",

      whatsapp: settings?.social?.whatsapp || "",

      twitter: settings?.social?.twitter || "",

      leaders: Array.isArray(settings?.leaders) ? settings.leaders : [],
    };
  };

  const loadSiteSettings = async () => {
    try {
      setSiteSettingsLoading(true);

      const data = await apiRequest("/site-settings/admin");

      if (data?.success && data?.item) {
        setSiteSettingsForm(buildSiteSettingsForm(data.item));

        setSiteLogoPreview(getAssetUrl(data.item.logo));

        setSitePosterPreview(getAssetUrl(data.item.poster));
      }
    } catch (error) {
      console.error("Load site settings error:", error);

      showToast("Failed to load website settings.");
    } finally {
      setSiteSettingsLoading(false);
    }
  };

  const handleSiteLogoChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please select an image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("Logo must be less than 5 MB.");
      return;
    }

    setSiteLogoFile(file);

    setSiteLogoPreview(URL.createObjectURL(file));
  };

  const handleSitePosterChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please select an image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("Poster must be less than 5 MB.");
      return;
    }

    setSitePosterFile(file);

    setSitePosterPreview(URL.createObjectURL(file));
  };

  const updateSiteLeader = (index, field, value) => {
    setSiteSettingsForm((prev) => ({
      ...prev,

      leaders: prev.leaders.map((leader, i) =>
        i === index
          ? {
              ...leader,
              [field]: value,
            }
          : leader,
      ),
    }));
  };

  const addSiteLeader = () => {
    setSiteSettingsForm((prev) => ({
      ...prev,

      leaders: [
        ...prev.leaders,

        {
          roleHi: "",
          roleEn: "",
          nameHi: "",
          nameEn: "",
          phone: "",
        },
      ],
    }));
  };

  const removeSiteLeader = (index) => {
    setSiteSettingsForm((prev) => ({
      ...prev,

      leaders: prev.leaders.filter((_, i) => i !== index),
    }));
  };

  const saveSiteSettings = async () => {
    try {
      setSiteSettingsSaving(true);

      const formData = new FormData();

      formData.append("nameHi", siteSettingsForm.nameHi);

      formData.append("nameEn", siteSettingsForm.nameEn);

      formData.append("taglineHi", siteSettingsForm.taglineHi);

      formData.append("taglineEn", siteSettingsForm.taglineEn);

      formData.append("registrationHi", siteSettingsForm.registrationHi);

      formData.append("registrationEn", siteSettingsForm.registrationEn);

      formData.append("uniqueIdHi", siteSettingsForm.uniqueIdHi);

      formData.append("uniqueIdEn", siteSettingsForm.uniqueIdEn);

      formData.append("contactIntroHi", siteSettingsForm.contactIntroHi);

      formData.append("contactIntroEn", siteSettingsForm.contactIntroEn);

      formData.append("addressHi", siteSettingsForm.addressHi);

      formData.append("addressEn", siteSettingsForm.addressEn);

      formData.append("phone", siteSettingsForm.phone);

      formData.append("email", siteSettingsForm.email);

      formData.append("mapUrl", siteSettingsForm.mapUrl);

      /* SOCIAL */

      formData.append("instagram", siteSettingsForm.instagram);

      formData.append("facebook", siteSettingsForm.facebook);

      formData.append("whatsapp", siteSettingsForm.whatsapp);

      formData.append("twitter", siteSettingsForm.twitter);

      /* LEADERS */

      formData.append("leaders", JSON.stringify(siteSettingsForm.leaders));

      /* FILES */

      if (siteLogoFile) {
        formData.append("logo", siteLogoFile);
      }

      if (sitePosterFile) {
        formData.append("poster", sitePosterFile);
      }

      const response = await fetch(`${API}/site-settings/admin`, {
        method: "PUT",

        headers: {
          Authorization: `Bearer ${token}`,
        },

        body: formData,
      });

      if (response.status === 401) {
        logout();
        return;
      }

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Failed to update website settings.");
      }

      setSiteSettingsForm(buildSiteSettingsForm(data.item));

      setSiteLogoFile(null);

      setSitePosterFile(null);

      setSiteLogoPreview(getAssetUrl(data.item.logo));

      setSitePosterPreview(getAssetUrl(data.item.poster));

      await refreshSiteSettings();

      showToast("Website settings updated successfully.");
    } catch (error) {
      console.error("Save site settings error:", error);

      showToast(error.message || "Failed to update website settings.");
    } finally {
      setSiteSettingsSaving(false);
    }
  };

  const downloadVolunteerTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["name", "phone", "email", "city", "area", "message", "status"],
      [
        "Rahul Sharma",
        "9876543210",
        "rahul@example.com",
        "Jaipur",
        "युवा जागरण / Youth",
        "Ready to help",
        "pending",
      ],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Volunteers");
    XLSX.writeFile(wb, "volunteer-template.xlsx");
  };

  const totalFinance = finance.reduce(
    (sum, item) => sum + Number(item.amount || item.totalAmount || 0),
    0,
  );

  

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "volunteers", label: "Volunteers", icon: Users },
    { id: "approved", label: "Approved Volunteers", icon: CheckCircle2 },
    { id: "new", label: "New Applications", icon: Clock3 },
    { id: "rejected", label: "Rejected Volunteers", icon: XCircle },
    { id: "gallery", label: "Gallery", icon: Image },
    { id: "activities", label: "Activities", icon: FileText },
    { id: "websiteSettings", label: "Website Settings", icon: Settings },
    { id: "donations", label: "Donations", icon: WalletCards },
    { id: "adminRegistration", label: "Admin Registration", icon: UserPlus },
  ];

  const cards = [
    {
      title: "Total Volunteers",
      value: counts.total,
      subtitle: `${counts.newApplications} new`,
      icon: Users,
      section: "volunteers",
    },
   {
      title: "Total Donation",
      value: `₹${Number(donationStats.paid?.amount || 0).toLocaleString("en-IN")}`,
      subtitle: `${donationStats.paid?.count || 0} paid donations`,
      icon: WalletCards,
      section: "donations",
    },
    {
      title: "Approved Volunteers",
      value: counts.approved,
      subtitle: "Approved",
      icon: CheckCircle2,
      section: "approved",
    },
    {
      title: "New Applications",
      value: counts.newApplications,
      subtitle: "Last 24 hrs",
      icon: Clock3,
      section: "new",
    },
    {
      title: "Rejected",
      value: counts.rejected,
      subtitle: "Rejected",
      icon: XCircle,
      section: "rejected",
    },
    {
      title: "Gallery",
      value: gallery.length,
      subtitle: "Photos",
      icon: Image,
      section: "gallery",
    },
  ];

  return (
    <div className={`adminDashboard ${darkMode ? "adminDark" : "adminLight"}`}>
      {/* SIDEBAR */}
      <aside className={`adminSidebar ${sidebarOpen ? "sidebarOpen" : ""}`}>
        <div className="adminSidebarBrand">
          <img src={getAssetUrl(siteSettings.logo)} alt="Logo" />
          <div>
            <strong>Swami Vivekananda</strong>
            <span>Admin Panel</span>
          </div>
        </div>

        <div className="adminSidebarMenu">
          {sidebarItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`adminSidebarItem ${activeSection === id ? "active" : ""}`}
              onClick={() => openSection(id)}
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

      {sidebarOpen && (
        <div
          className="adminSidebarOverlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* MAIN CONTAINER */}
      <main className="adminMain">
        <header className="adminTopHeader">
          <div className="adminHeaderLeft">
            <button
              type="button"
              className="mobileMenuButton"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu size={22} />
            </button>
            <div>
              <h1>
                {sidebarItems.find((s) => s.id === activeSection)?.label ||
                  "Dashboard"}
              </h1>
              <p>Swami Vivekananda Vichar Prachar Seva Samiti</p>
            </div>
          </div>

          <div className="adminHeaderRight">
            <button
              className="adminThemeButton"
              onClick={() => setDarkMode(!darkMode)}
              title="Toggle Theme"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className="adminProfileWrap">
              <button
                type="button"
                className={`adminProfileButton ${profileOpen ? "profileActive" : ""}`}
                onClick={() => setProfileOpen(!profileOpen)}
              >
                <img
                  src={
                    adminProfile?.profileImage
                      ? getAssetUrl(adminProfile.profileImage)
                      : getAssetUrl(siteSettings.logo)
                  }
                  alt={adminProfile?.displayName || adminUser.username || "Admin"}
                  className="adminProfileImage"
                />
                <ChevronDown
                  size={17}
                  className={profileOpen ? "profileRotate" : ""}
                />
              </button>

              {profileOpen && (
                <div className="adminProfileDropdown">
                  <div className="profileDropdownHeader">
                    <img
                      src={
                        adminProfile?.profileImage
                          ? getAssetUrl(adminProfile.profileImage)
                          : getAssetUrl(siteSettings.logo)
                      }
                      alt={adminProfile?.displayName || adminUser.username || "Admin"}
                      className="adminProfileImage"
                    />
                    <div>
                      <strong>{adminProfile?.displayName || adminUser.displayName || adminUser.username}</strong>
                      <span>{adminProfile?.role || "Administrator"}</span>
                    </div>
                  </div>
                  <div className="profileDropdownDivider" />
                  <button
                    type="button"
                    className="profileLogout"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate("/admin/profile");
                    }}
                  >
                    <UserRound size={17} />
                    <span>Profile</span>
                  </button>
                  <button
                    type="button"
                    className="profileLogout"
                    onClick={logout}
                  >
                    <LogOut size={17} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="adminContent">
          {/* DASHBOARD CARDS */}
          {activeSection === "dashboard" && (
            <>
              <div className="adminWelcome">
                <h2>Welcome, {adminProfile?.displayName || adminUser.displayName || adminUser.username}</h2>
                <p>
                  Manage volunteers, financial transactions, and gallery from
                  one place.
                </p>
              </div>

              <div className="adminCards">
                {cards.map(
                  ({ title, value, subtitle, icon: Icon, section }) => (
                    <button
                      key={title}
                      className="adminCard"
                      onClick={() => openSection(section)}
                    >
                      <div className="adminCardTop">
                        <div className="adminCardIcon">
                          <Icon size={23} />
                        </div>
                        <span>View Details →</span>
                      </div>
                      <strong>{value}</strong>
                      <h3>{title}</h3>
                      <p>{subtitle}</p>
                    </button>
                  ),
                )}
              </div>
            </>
          )}

          {/* VOLUNTEER SECTION */}
          {["volunteers", "approved", "new", "rejected"].includes(
            activeSection,
          ) && (
            <section className="adminPanel">
              <div className="adminPanelHeader">
                <div>
                  <h2>
                    {activeSection === "new"
                      ? "New Applications"
                      : `${volunteerType.toUpperCase()} Volunteers`}
                  </h2>
                  <p>
                    {activeSection === "new"
                      ? "Created in last 24 hours"
                      : "Manage applications"}
                  </p>
                </div>

                <div className="volunteerHeaderActions">
                  <button
                    type="button"
                    className="adminAddVolunteerButton"
                    onClick={() => openVolunteerModal()}
                  >
                    <Plus size={17} />
                    <span>Add Volunteer</span>
                  </button>

                  <button
                    type="button"
                    className="adminBulkVolunteerButton"
                    onClick={() => {
                      setBulkModal(true);
                      setBulkFile(null);
                      setBulkError("");
                    }}
                  >
                    <Upload size={17} /> Bulk Import
                  </button>

                  <button
                    type="button"
                    className="adminBulkVolunteerButton"
                    onClick={downloadVolunteerTemplate}
                  >
                    <Download size={16} /> Template
                  </button>

                  <button
                    type="button"
                    className="adminRefreshButton"
                    onClick={() => loadVolunteers()}
                  >
                    <RefreshCw size={17} /> Refresh
                  </button>
                </div>
              </div>

              {/* FILTERS */}
              <div className="volunteerFilterBox">
                <div className="volunteerFilterGrid">
                  <input
                    type="text"
                    placeholder="Search name / phone"
                    value={filters.search}
                    onChange={(e) =>
                      setFilters({ ...filters, search: e.target.value })
                    }
                  />
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) =>
                      setFilters({ ...filters, startDate: e.target.value })
                    }
                  />
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) =>
                      setFilters({ ...filters, endDate: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    placeholder="Search City"
                    value={filters.city}
                    onChange={(e) =>
                      setFilters({ ...filters, city: e.target.value })
                    }
                  />
                </div>

                <div className="volunteerFilterGrid">
                  <input
                    type="text"
                    placeholder="Search Area"
                    value={filters.area}
                    onChange={(e) =>
                      setFilters({ ...filters, area: e.target.value })
                    }
                  />
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      setFilters({ ...filters, status: e.target.value })
                    }
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>

                  <div className="volunteerFilterActions">
                    <button
                      type="button"
                      className="volunteerSearchButton"
                      onClick={() => {
                        setPage(1);
                        loadVolunteers(volunteerType, 1);
                      }}
                    >
                      Search
                    </button>
                    <button
                      type="button"
                      className="volunteerResetButton"
                      onClick={() => {
                        setFilters({
                          search: "",
                          city: "",
                          area: "",
                          status: "",
                          startDate: "",
                          endDate: "",
                        });
                        setPage(1);
                        setTimeout(() => loadVolunteers(volunteerType, 1), 0);
                      }}
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <div className="volunteerFilterTabs">
                  {["all", "new", "approved", "rejected"].map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      className={volunteerType === tab ? "active" : ""}
                      onClick={() => {
                        setVolunteerType(tab);
                        setPage(1);
                      }}
                    >
                      {tab.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              {selectedVolunteers.length > 0 && (
                <div className="bulk-status-bar">
                  <div className="bulk-status-info">
                    <CheckSquare size={19} />

                    <strong>{selectedVolunteers.length}</strong>

                    <span>
                      volunteer{selectedVolunteers.length > 1 ? "s" : ""}{" "}
                      selected
                    </span>
                  </div>

                  <div className="bulk-status-actions">
                    <button
                      type="button"
                      className="bulk-status-btn pending"
                      disabled={bulkStatusLoading}
                      onClick={() => bulkChangeStatus("pending")}
                    >
                      <Clock3 size={17} />
                      Pending
                    </button>

                    <button
                      type="button"
                      className="bulk-status-btn approved"
                      disabled={bulkStatusLoading}
                      onClick={() => bulkChangeStatus("approved")}
                    >
                      <CircleCheck size={17} />
                      Approve
                    </button>

                    <button
                      type="button"
                      className="bulk-status-btn rejected"
                      disabled={bulkStatusLoading}
                      onClick={() => bulkChangeStatus("rejected")}
                    >
                      <CircleX size={17} />
                      Reject
                    </button>

                    <button
                      type="button"
                      className="bulk-clear-btn"
                      disabled={bulkStatusLoading}
                      onClick={() => setSelectedVolunteers([])}
                    >
                      <X size={17} />
                      Clear
                    </button>
                  </div>
                </div>
              )}

              {/* TABLE */}
              {volunteerLoading ? (
                <div className="adminEmpty">Loading applications...</div>
              ) : volunteers.length === 0 ? (
                <div className="adminEmpty">No applications found.</div>
              ) : (
                <div className="adminTableWrap">
                  <table className="adminTable">
                    <thead>
                      <tr>
                        <th className="volunteer-select-column">
                          <input
                            type="checkbox"
                            checked={
                              volunteers.length > 0 &&
                              selectedVolunteers.length === volunteers.length
                            }
                            onChange={toggleSelectAllVolunteers}
                            aria-label="Select all volunteers"
                          />
                        </th>

                        <th>Application No.</th>
                        <th>Name</th>
                        <th>Mobile</th>
                        <th>Email</th>
                        <th>City</th>
                        <th>Area</th>
                        <th>Message</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {volunteers.map((v) => (
                        <tr key={v._id}>
                          <td className="volunteer-select-column">
                            <input
                              type="checkbox"
                              checked={selectedVolunteers.includes(v._id)}
                              onChange={() => toggleVolunteerSelection(v._id)}
                              aria-label={`Select ${v.name}`}
                            />
                          </td>

                          <td>{v.applicationNo || "-"}</td>

                          <td>{v.name || "-"}</td>

                          <td>{v.phone || "-"}</td>

                          <td>{v.email || "-"}</td>

                          <td>{v.city || "-"}</td>

                          <td>{v.area || "-"}</td>

                          {/* IMPORTANT: Message */}
                          <td>{v.message || "-"}</td>

                          {/* Status */}
                          <td>
                            <div className="status-dropdown">
                              <button
                                type="button"
                                className={`status-icon-button status-${v.status || "pending"}`}
                                onClick={() =>
                                  setOpenStatusDropdown(
                                    openStatusDropdown === v._id ? null : v._id,
                                  )
                                }
                                title="Change Status"
                              >
                                {getStatusIcon(v.status || "pending")}
                              </button>

                              {openStatusDropdown === v._id && (
                                <div className="status-menu">
                                  <button
                                    type="button"
                                    className="status-option pending"
                                    onClick={() => {
                                      changeStatus(v._id, "pending");
                                      setOpenStatusDropdown(null);
                                    }}
                                  >
                                    <Clock3 size={17} />
                                    <span>Pending</span>
                                  </button>

                                  <button
                                    type="button"
                                    className="status-option approved"
                                    onClick={() => {
                                      changeStatus(v._id, "approved");
                                      setOpenStatusDropdown(null);
                                    }}
                                  >
                                    <CircleCheck size={17} />
                                    <span>Approved</span>
                                  </button>

                                  <button
                                    type="button"
                                    className="status-option rejected"
                                    onClick={() => {
                                      changeStatus(v._id, "rejected");
                                      setOpenStatusDropdown(null);
                                    }}
                                  >
                                    <CircleX size={17} />
                                    <span>Rejected</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Date */}
                          <td>
                            {v.createdAt
                              ? new Date(v.createdAt).toLocaleDateString(
                                  "en-IN",
                                )
                              : "-"}
                          </td>

                          {/* Action */}
                          <td className="volunteerActionCell">
                            <div className="volunteerActionButtons">
                              {/* VIEW */}
                              <button
                                type="button"
                                className="volunteerViewButton"
                                onClick={() => setViewVolunteer(v)}
                                title="View Volunteer"
                              >
                                <Eye size={15} />
                              </button>

                              <button
                                type="button"
                                className="volunteerEditButton"
                                onClick={() => openVolunteerModal(v)}
                                title="Edit Volunteer"
                              >
                                <Pencil size={15} />
                              </button>

                              <button
                                type="button"
                                className="volunteerDeleteButton"
                                onClick={() => {
                                  setDeleteId(v._id);
                                  setDeleteModal(true);
                                }}
                                title="Delete Volunteer"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={limit}
                    onPageChange={(p) => setPage(p)}
                    onItemsPerPageChange={(l) => {
                      setLimit(l);
                      setPage(1);
                    }}
                  />
                </div>
              )}
            </section>
          )}

          {/* FINANCE TAB */}
          {activeSection === "finance" && (
            <section className="adminPanel">
              <div className="adminPanelHeader">
                <div>
                  <h2>Financial Transactions</h2>
                  <p>View verified transactions.</p>
                </div>
                <button className="adminRefreshButton" onClick={loadFinance}>
                  <RefreshCw size={17} /> Refresh
                </button>
              </div>

              {financeLoading ? (
                <div className="adminEmpty">Loading...</div>
              ) : finance.length === 0 ? (
                <div className="adminEmpty">No financial records found.</div>
              ) : (
                <div className="adminTableWrap">
                  <table className="adminTable">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Description</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {finance.map((f, i) => (
                        <tr key={f._id || i}>
                          <td>
                            {f.createdAt
                              ? new Date(f.createdAt).toLocaleDateString(
                                  "en-IN",
                                )
                              : "-"}
                          </td>
                          <td>{f.type || "-"}</td>
                          <td>{f.description || f.title || "-"}</td>
                          <td>
                            ₹
                            {Number(
                              f.amount || f.totalAmount || 0,
                            ).toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* =====================================================
    DONATIONS
===================================================== */}

          {activeSection === "donations" && <DonationAdmin />}

          {/* ADMIN REGISTRATION TAB */}
          {activeSection === "adminRegistration" && <AdminRegistration />}

          {/* GALLERY TAB */}
          {/* ================= GALLERY ================= */}

          {activeSection === "gallery" && (
            <section className="adminPanel">
              <div className="adminPanelHeader">
                <div>
                  <h2>Gallery</h2>

                  <p>Add, update and manage website gallery images.</p>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                  }}
                >
                  <button
                    type="button"
                    className="adminRefreshButton"
                    onClick={loadGallery}
                  >
                    <RefreshCw size={17} />
                    Refresh
                  </button>

                  <button
                    type="button"
                    className="adminRefreshButton"
                    onClick={openGalleryAdd}
                  >
                    <Plus size={17} />
                    Add Image
                  </button>
                </div>
              </div>

              {galleryLoading ? (
                <div className="adminEmpty">Loading...</div>
              ) : gallery.length === 0 ? (
                <div className="adminEmpty">
                  <ImagePlus size={35} />

                  <p>No gallery images found.</p>

                  <button
                    type="button"
                    className="adminRefreshButton"
                    onClick={openGalleryAdd}
                  >
                    <Plus size={16} />
                    Add First Image
                  </button>
                </div>
              ) : (
                <div className="adminGalleryGrid">
                  {gallery.map((photo, index) => {
                    const imageUrl = photo.url?.startsWith("http")
                      ? photo.url
                      : `${API.replace("/api", "")}${photo.url}`;

                    return (
                      <div
                        className="adminGalleryItem"
                        key={photo._id || index}
                      >
                        <div className="adminGalleryImageWrap">
                          <img
                            src={imageUrl}
                            alt={photo.originalName || "Gallery"}
                          />
                        </div>

                        <div className="adminGalleryInfo">
                          <span title={photo.originalName || "Gallery Image"}>
                            {photo.originalName || "Gallery Image"}
                          </span>

                          <div className="adminGalleryActions">
                            <button
                              type="button"
                              onClick={() =>
                                setGalleryView({
                                  ...photo,
                                  imageUrl,
                                })
                              }
                              title="View Image"
                            >
                              <Eye size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => openGalleryEdit(photo)}
                              title="Update Image"
                            >
                              <Pencil size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => openGalleryDelete(photo._id)}
                              title="Delete Image"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ===============================
        ADD / UPDATE GALLERY MODAL
    =============================== */}

              {galleryModal && (
                <div
                  className="galleryModalOverlay"
                  onClick={closeGalleryModal}
                >
                  <div
                    className="galleryModal"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="galleryModalHeader">
                      <div>
                        <span>WEBSITE GALLERY</span>

                        <h3>{galleryEditId ? "Update Image" : "Add Image"}</h3>
                      </div>

                      <button
                        type="button"
                        onClick={closeGalleryModal}
                        disabled={gallerySaving}
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="galleryModalBody">
                      {galleryPreview && (
                        <div className="galleryPreview">
                          <img src={galleryPreview} alt="Preview" />
                        </div>
                      )}

                      <label className="galleryUploadBox">
                        <Upload size={28} />

                        <strong>
                          {galleryFile
                            ? galleryFile.name
                            : galleryEditId
                              ? "Choose new image"
                              : "Choose image"}
                        </strong>

                        <span>JPG, PNG, WEBP • Max 5 MB</span>

                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleGalleryFileChange}
                        />
                      </label>
                    </div>

                    <div className="galleryModalFooter">
                      <button
                        type="button"
                        onClick={closeGalleryModal}
                        disabled={gallerySaving}
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={saveGalleryImage}
                        disabled={gallerySaving}
                      >
                        {gallerySaving ? (
                          "Saving..."
                        ) : galleryEditId ? (
                          <>
                            <Save size={16} />
                            Update Image
                          </>
                        ) : (
                          <>
                            <Upload size={16} />
                            Upload Image
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>

        {galleryView && (
          <div
            className="galleryViewOverlay"
            onClick={() => setGalleryView(null)}
          >
            <div
              className="galleryViewModal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="galleryViewHeader">
                <div>
                  <span>WEBSITE GALLERY</span>
                  <h3>Image Preview</h3>
                </div>

                <button
                  type="button"
                  onClick={() => setGalleryView(null)}
                  title="Close"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="galleryViewBody">
                <img
                  src={galleryView.imageUrl}
                  alt={galleryView.originalName || "Gallery Image"}
                />
              </div>

              <div className="galleryViewFooter">
                <span>{galleryView.originalName || "Gallery Image"}</span>

                <button type="button" onClick={() => setGalleryView(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===============================
    GALLERY DELETE CONFIRMATION
================================ */}

        {galleryDeleteModal && (
          <div
            className="galleryDeleteOverlay"
            onClick={() => {
              if (!galleryDeleteId) {
                setGalleryDeleteModal(false);
              }
            }}
          >
            <div
              className="galleryDeleteModal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="galleryDeleteClose"
                onClick={() => {
                  setGalleryDeleteId(null);
                  setGalleryDeleteModal(false);
                }}
              >
                <X size={19} />
              </button>

              <div className="galleryDeleteIcon">
                <Trash2 size={30} />
              </div>

              <h3>Delete Image?</h3>

              <p>Are you sure you want to delete this gallery image?</p>

              <span>This action cannot be undone.</span>

              <div className="galleryDeleteActions">
                <button
                  type="button"
                  onClick={() => {
                    setGalleryDeleteId(null);
                    setGalleryDeleteModal(false);
                  }}
                >
                  Cancel
                </button>

                <button type="button" onClick={confirmGalleryDelete}>
                  <Trash2 size={16} />
                  Delete Image
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= ACTIVITIES ================= */}

        {activeSection === "activities" && (
          <section className="adminPanel">
            <div className="adminPanelHeader">
              <div>
                <h2>Activities</h2>
                <p>Add, update, view and manage all website activities.</p>
              </div>

              <div className="activityHeaderActions">
                <button
                  type="button"
                  className="adminRefreshButton"
                  onClick={loadActivities}
                >
                  <RefreshCw size={17} />
                  Refresh
                </button>

                <button
                  type="button"
                  className="adminRefreshButton"
                  onClick={openActivityAdd}
                >
                  <Plus size={17} />
                  Add Activity
                </button>

                <button
                  type="button"
                  className="adminRefreshButton"
                  onClick={openBulkActivityModal}
                >
                  <Upload size={17} />
                  Bulk Add
                </button>
              </div>
            </div>

            {activitiesLoading ? (
              <div className="adminEmpty">Loading activities...</div>
            ) : activities.length === 0 ? (
              <div className="adminEmpty">
                <FileText size={35} />
                <p>No activities found.</p>

                <button
                  type="button"
                  className="adminRefreshButton"
                  onClick={openActivityAdd}
                >
                  <Plus size={16} />
                  Add First Activity
                </button>
              </div>
            ) : (
              <div className="adminActivityGrid">
                {[...activities]
                  .sort((a, b) => a.activityNo - b.activityNo)
                  .map((activity) => {
                    const imageUrl = activity.image?.startsWith("http")
                      ? activity.image
                      : `${API.replace("/api", "")}${activity.image}`;

                    return (
                      <article
                        className="adminActivityCard"
                        key={activity.activityNo}
                      >
                        <div className="adminActivityImage">
                          <img
                            src={imageUrl}
                            alt={activity.en?.title || "Activity"}
                          />

                          <span>Activity {activity.activityNo}</span>
                        </div>

                        <div className="adminActivityContent">
                          <h3>{activity.en?.title || "Untitled Activity"}</h3>

                          <p>{activity.en?.shortText || "-"}</p>

                          <div className="adminActivityActions">
                            {/* VIEW */}
                            <button
                              type="button"
                              onClick={() =>
                                setActivityView({
                                  ...activity,
                                  imageUrl,
                                })
                              }
                              title="View Activity"
                            >
                              <Eye size={16} />
                            </button>

                            {/* UPDATE */}
                            <button
                              type="button"
                              onClick={() => openActivityEdit(activity)}
                              title="Update Activity"
                            >
                              <Pencil size={16} />
                            </button>

                            {/* DELETE */}
                            <button
                              type="button"
                              onClick={() =>
                                openActivityDelete(activity.activityNo)
                              }
                              title="Delete Activity"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
              </div>
            )}
          </section>
        )}

        {activeSection === "websiteSettings" && (
          <div className="adminPanel">
            <div className="adminPanelHeader">
              <div>
                <h2>Website Settings</h2>

                <p>
                  Manage website logo, poster, contact information and social
                  links.
                </p>
              </div>

              <button
                type="button"
                className="adminAddVolunteerButton"
                onClick={saveSiteSettings}
                disabled={siteSettingsSaving}
              >
                {siteSettingsSaving ? (
                  <>
                    <Loader2 size={15} className="spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    Save Changes
                  </>
                )}
              </button>
            </div>

            {/* ================= BRAND ================= */}

            <div className="siteSettingsBlock">
              <h3>Branding</h3>

              <div className="siteSettingsMediaGrid">
                <div className="siteSettingsMediaCard">
                  <label>Website Logo</label>

                  <div className="siteSettingsPreview logoPreview">
                    {siteLogoPreview && (
                      <img src={siteLogoPreview} alt="Logo Preview" />
                    )}
                  </div>

                  <label className="siteSettingsFileButton">
                    <Upload size={15} />
                    Change Logo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSiteLogoChange}
                    />
                  </label>
                </div>

                <div className="siteSettingsMediaCard">
                  <label>Home Poster</label>

                  <div className="siteSettingsPreview posterPreview">
                    {sitePosterPreview && (
                      <img src={sitePosterPreview} alt="Poster Preview" />
                    )}
                  </div>

                  <label className="siteSettingsFileButton">
                    <Upload size={15} />
                    Change Poster
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSitePosterChange}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* ================= WEBSITE INFO ================= */}

            <div className="siteSettingsBlock">
              <h3>Website Information</h3>

              <div className="siteSettingsGrid">
                <div className="siteSettingsField">
                  <label>Hindi Website Name</label>

                  <input
                    value={siteSettingsForm.nameHi}
                    onChange={(e) =>
                      setSiteSettingsForm((prev) => ({
                        ...prev,
                        nameHi: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="siteSettingsField">
                  <label>English Website Name</label>

                  <input
                    value={siteSettingsForm.nameEn}
                    onChange={(e) =>
                      setSiteSettingsForm((prev) => ({
                        ...prev,
                        nameEn: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="siteSettingsField">
                  <label>Hindi Tagline</label>

                  <input
                    value={siteSettingsForm.taglineHi}
                    onChange={(e) =>
                      setSiteSettingsForm((prev) => ({
                        ...prev,
                        taglineHi: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="siteSettingsField">
                  <label>English Tagline</label>

                  <input
                    value={siteSettingsForm.taglineEn}
                    onChange={(e) =>
                      setSiteSettingsForm((prev) => ({
                        ...prev,
                        taglineEn: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="siteSettingsField">
                  <label>Hindi Registration</label>

                  <input
                    value={siteSettingsForm.registrationHi}
                    onChange={(e) =>
                      setSiteSettingsForm((prev) => ({
                        ...prev,
                        registrationHi: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="siteSettingsField">
                  <label>English Registration</label>

                  <input
                    value={siteSettingsForm.registrationEn}
                    onChange={(e) =>
                      setSiteSettingsForm((prev) => ({
                        ...prev,
                        registrationEn: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="siteSettingsField">
                  <label>Unique ID Hindi</label>

                  <input
                    value={siteSettingsForm.uniqueIdHi}
                    onChange={(e) =>
                      setSiteSettingsForm((prev) => ({
                        ...prev,
                        uniqueIdHi: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="siteSettingsField">
                  <label>Unique ID English</label>

                  <input
                    value={siteSettingsForm.uniqueIdEn}
                    onChange={(e) =>
                      setSiteSettingsForm((prev) => ({
                        ...prev,
                        uniqueIdEn: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* ================= CONTACT ================= */}

            <div className="siteSettingsBlock">
              <h3>Contact Information</h3>

              <div className="siteSettingsGrid">
                <div className="siteSettingsField full">
                  <label>Hindi Contact Introduction</label>

                  <textarea
                    value={siteSettingsForm.contactIntroHi}
                    onChange={(e) =>
                      setSiteSettingsForm((prev) => ({
                        ...prev,
                        contactIntroHi: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="siteSettingsField full">
                  <label>English Contact Introduction</label>

                  <textarea
                    value={siteSettingsForm.contactIntroEn}
                    onChange={(e) =>
                      setSiteSettingsForm((prev) => ({
                        ...prev,
                        contactIntroEn: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="siteSettingsField">
                  <label>Hindi Address</label>

                  <textarea
                    value={siteSettingsForm.addressHi}
                    onChange={(e) =>
                      setSiteSettingsForm((prev) => ({
                        ...prev,
                        addressHi: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="siteSettingsField">
                  <label>English Address</label>

                  <textarea
                    value={siteSettingsForm.addressEn}
                    onChange={(e) =>
                      setSiteSettingsForm((prev) => ({
                        ...prev,
                        addressEn: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="siteSettingsField">
                  <label>Phone</label>

                  <input
                    value={siteSettingsForm.phone}
                    onChange={(e) =>
                      setSiteSettingsForm((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="siteSettingsField">
                  <label>Email</label>

                  <input
                    type="email"
                    value={siteSettingsForm.email}
                    onChange={(e) =>
                      setSiteSettingsForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="siteSettingsField full">
                  <label>Google Maps URL</label>

                  <input
                    value={siteSettingsForm.mapUrl}
                    onChange={(e) =>
                      setSiteSettingsForm((prev) => ({
                        ...prev,
                        mapUrl: e.target.value,
                      }))
                    }
                    placeholder="https://maps.google.com/..."
                  />
                </div>
              </div>
            </div>

            {/* ================= SOCIAL ================= */}

            <div className="siteSettingsBlock">
              <h3>Social Media</h3>

              <div className="siteSettingsGrid">
                {[
                  ["instagram", "Instagram URL"],

                  ["facebook", "Facebook URL"],

                  ["whatsapp", "WhatsApp URL"],

                  ["twitter", "Twitter / X URL"],
                ].map(([field, label]) => (
                  <div className="siteSettingsField" key={field}>
                    <label>{label}</label>

                    <input
                      value={siteSettingsForm[field]}
                      onChange={(e) =>
                        setSiteSettingsForm((prev) => ({
                          ...prev,

                          [field]: e.target.value,
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* ================= LEADERS ================= */}

            <div className="siteSettingsBlock">
              <div className="siteSettingsBlockHeader">
                <div>
                  <h3>Contact Leaders</h3>

                  <p>
                    Manage President, Secretary, Treasurer and other contact
                    persons.
                  </p>
                </div>

                <button
                  type="button"
                  className="adminAddVolunteerButton"
                  onClick={addSiteLeader}
                >
                  <Plus size={15} />
                  Add Leader
                </button>
              </div>

              <div className="siteLeadersList">
                {siteSettingsForm.leaders.map((leader, index) => (
                  <div className="siteLeaderCard" key={index}>
                    <div className="siteSettingsGrid">
                      <div className="siteSettingsField">
                        <label>Hindi Role</label>

                        <input
                          value={leader.roleHi}
                          onChange={(e) =>
                            updateSiteLeader(index, "roleHi", e.target.value)
                          }
                        />
                      </div>

                      <div className="siteSettingsField">
                        <label>English Role</label>

                        <input
                          value={leader.roleEn}
                          onChange={(e) =>
                            updateSiteLeader(index, "roleEn", e.target.value)
                          }
                        />
                      </div>

                      <div className="siteSettingsField">
                        <label>Hindi Name</label>

                        <input
                          value={leader.nameHi}
                          onChange={(e) =>
                            updateSiteLeader(index, "nameHi", e.target.value)
                          }
                        />
                      </div>

                      <div className="siteSettingsField">
                        <label>English Name</label>

                        <input
                          value={leader.nameEn}
                          onChange={(e) =>
                            updateSiteLeader(index, "nameEn", e.target.value)
                          }
                        />
                      </div>

                      <div className="siteSettingsField">
                        <label>Phone</label>

                        <input
                          value={leader.phone}
                          onChange={(e) =>
                            updateSiteLeader(index, "phone", e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      className="siteLeaderDelete"
                      onClick={() => removeSiteLeader(index)}
                    >
                      <Trash2 size={15} />
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= ACTIVITY ADD / UPDATE MODAL ================= */}

        {activityModal && (
          <div
            className="activityModalOverlay"
            onClick={() => !activitySaving && closeActivityModal()}
          >
            <div className="activityModal" onClick={(e) => e.stopPropagation()}>
              {/* HEADER */}
              <div className="activityModalHeader">
                <div>
                  <span>WEBSITE ACTIVITIES</span>

                  <h3>
                    {editingActivity ? "Update Activity" : "Add Activity"}
                  </h3>

                  <p>
                    {editingActivity
                      ? `Update Activity ${editingActivity.activityNo}`
                      : "Create a new website activity"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeActivityModal}
                  disabled={activitySaving}
                >
                  <X size={20} />
                </button>
              </div>

              {/* BODY */}
              <div className="activityModalBody">
                {/* ACTIVITY NUMBER */}
                <div className="activityField">
                  <label>Activity Number *</label>

                  <input
                    type="number"
                    min="1"
                    max="15"
                    disabled={Boolean(editingActivity)}
                    value={activityForm.activityNo}
                    onChange={(e) =>
                      setActivityForm({
                        ...activityForm,
                        activityNo: e.target.value,
                      })
                    }
                    placeholder="1 - 15"
                  />
                </div>

                {/* IMAGE */}
                <div className="activityImageUpload">
                  {activityPreview && (
                    <div className="activityImagePreview">
                      <img src={activityPreview} alt="Activity Preview" />
                    </div>
                  )}

                  <label className="activityUploadBox">
                    <ImagePlus size={28} />

                    <strong>
                      {activityFile
                        ? activityFile.name
                        : editingActivity
                          ? "Choose new image"
                          : "Choose activity image"}
                    </strong>

                    <span>JPG, PNG, WEBP • Max 5 MB</span>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleActivityFileChange}
                    />
                  </label>
                </div>

                {/* LANGUAGE GRID */}
                <div className="activityLanguageGrid">
                  {/* HINDI */}
                  <div className="activityLanguageCard">
                    <div className="activityLanguageTitle">हिन्दी Content</div>

                    <div className="activityField">
                      <label>Hindi Title *</label>

                      <input
                        type="text"
                        value={activityForm.hiTitle}
                        onChange={(e) =>
                          setActivityForm({
                            ...activityForm,
                            hiTitle: e.target.value,
                          })
                        }
                        placeholder="Hindi activity title"
                      />
                    </div>

                    <div className="activityField">
                      <label>Hindi Short Content *</label>

                      <textarea
                        rows="3"
                        value={activityForm.hiShortText}
                        onChange={(e) =>
                          setActivityForm({
                            ...activityForm,
                            hiShortText: e.target.value,
                          })
                        }
                        placeholder="Short Hindi content"
                      />
                    </div>

                    <div className="activityField">
                      <label>Hindi Full Content *</label>

                      <textarea
                        rows="7"
                        value={activityForm.hiDetails}
                        onChange={(e) =>
                          setActivityForm({
                            ...activityForm,
                            hiDetails: e.target.value,
                          })
                        }
                        placeholder="Complete Hindi content"
                      />
                    </div>
                  </div>

                  {/* ENGLISH */}
                  <div className="activityLanguageCard">
                    <div className="activityLanguageTitle">English Content</div>

                    <div className="activityField">
                      <label>English Title *</label>

                      <input
                        type="text"
                        value={activityForm.enTitle}
                        onChange={(e) =>
                          setActivityForm({
                            ...activityForm,
                            enTitle: e.target.value,
                          })
                        }
                        placeholder="English activity title"
                      />
                    </div>

                    <div className="activityField">
                      <label>English Short Content *</label>

                      <textarea
                        rows="3"
                        value={activityForm.enShortText}
                        onChange={(e) =>
                          setActivityForm({
                            ...activityForm,
                            enShortText: e.target.value,
                          })
                        }
                        placeholder="Short English content"
                      />
                    </div>

                    <div className="activityField">
                      <label>English Full Content *</label>

                      <textarea
                        rows="7"
                        value={activityForm.enDetails}
                        onChange={(e) =>
                          setActivityForm({
                            ...activityForm,
                            enDetails: e.target.value,
                          })
                        }
                        placeholder="Complete English content"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER */}
              <div className="activityModalFooter">
                <button
                  type="button"
                  onClick={closeActivityModal}
                  disabled={activitySaving}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={saveActivity}
                  disabled={activitySaving}
                >
                  {activitySaving ? (
                    <>
                      <Loader2 size={16} className="spin" />
                      Saving...
                    </>
                  ) : editingActivity ? (
                    <>
                      <Save size={16} />
                      Update Activity
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Add Activity
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* ================= ACTIVITY VIEW MODAL ================= */}

        {activityView && (
          <div
            className="activityViewOverlay"
            onClick={() => setActivityView(null)}
          >
            <div
              className="activityViewModal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="activityViewHeader">
                <div>
                  <span>WEBSITE ACTIVITY</span>

                  <h3>Activity {activityView.activityNo}</h3>
                </div>

                <button type="button" onClick={() => setActivityView(null)}>
                  <X size={20} />
                </button>
              </div>

              <div className="activityViewBody">
                <div className="activityViewImage">
                  <img
                    src={activityView.imageUrl}
                    alt={activityView.en?.title}
                  />
                </div>

                <div className="activityViewContent">
                  <div className="activityViewLanguage">
                    <h4>English</h4>

                    <h2>{activityView.en?.title}</h2>

                    <p>{activityView.en?.shortText}</p>

                    <div>{activityView.en?.details}</div>
                  </div>

                  <div className="activityViewLanguage">
                    <h4>हिन्दी</h4>

                    <h2>{activityView.hi?.title}</h2>

                    <p>{activityView.hi?.shortText}</p>

                    <div>{activityView.hi?.details}</div>
                  </div>
                </div>
              </div>

              <div className="activityModalFooter">
                <button type="button" onClick={() => setActivityView(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        {/* ================= ACTIVITY DELETE MODAL ================= */}

        {activityDeleteModal && (
          <div
            className="activityDeleteOverlay"
            onClick={() => {
              setActivityDeleteModal(false);
              setActivityDeleteNo(null);
            }}
          >
            <div
              className="activityDeleteModal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="activityDeleteClose"
                onClick={() => {
                  setActivityDeleteModal(false);
                  setActivityDeleteNo(null);
                }}
              >
                <X size={18} />
              </button>

              <div className="activityDeleteIcon">
                <Trash2 size={30} />
              </div>

              <h3>Delete Activity?</h3>

              <p>
                Are you sure you want to delete Activity{" "}
                <strong>{activityDeleteNo}</strong>?
              </p>

              <span>
                This will also remove its image. This action cannot be undone.
              </span>

              <div className="activityDeleteActions">
                <button
                  type="button"
                  onClick={() => {
                    setActivityDeleteModal(false);
                    setActivityDeleteNo(null);
                  }}
                >
                  Cancel
                </button>

                <button type="button" onClick={confirmActivityDelete}>
                  <Trash2 size={16} />
                  Delete Activity
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= BULK ACTIVITY MODAL ================= */}

        {bulkActivityModal && (
          <div
            className="activityModalOverlay"
            onClick={() => !bulkSaving && setBulkActivityModal(false)}
          >
            <div
              className="activityBulkModal"
              onClick={(e) => e.stopPropagation()}
            >
              {/* HEADER */}
              <div className="activityModalHeader">
                <div>
                  <span>WEBSITE ACTIVITIES</span>

                  <h3>Bulk Add Activities</h3>

                  <p>Add all 15 activities, content and images together.</p>
                </div>

                <button
                  type="button"
                  disabled={bulkSaving}
                  onClick={() => setBulkActivityModal(false)}
                >
                  <X size={20} />
                </button>
              </div>

              {/* INFO */}
              <div className="bulkActivityInfo">
                <FileText size={22} />

                <div>
                  <strong>15 Activities Required</strong>

                  <span>Activity 1 → Image 1, Activity 2 → Image 2 ...</span>
                </div>
              </div>

              {/* IMAGES */}
              <div className="bulkActivityImageUpload">
                <label>
                  <ImagePlus size={25} />

                  <strong>Select 15 Activity Images</strong>

                  <span>JPG, PNG, WEBP • Max 5 MB each</span>

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleBulkImages}
                  />
                </label>

                <div className="bulkImageCounter">
                  {bulkImages.length}/15 Images Selected
                </div>
              </div>

              {/* ACTIVITIES */}
              <div className="bulkActivityList">
                {bulkActivities.map((activity, index) => (
                  <div className="bulkActivityItem" key={activity.activityNo}>
                    <div className="bulkActivityNumber">
                      <span>
                        {String(activity.activityNo).padStart(2, "0")}
                      </span>

                      <strong>Activity {activity.activityNo}</strong>
                    </div>

                    <div className="bulkActivityFields">
                      <input
                        type="text"
                        placeholder="Hindi Title *"
                        value={activity.hiTitle}
                        onChange={(e) =>
                          updateBulkActivity(index, "hiTitle", e.target.value)
                        }
                      />

                      <input
                        type="text"
                        placeholder="English Title *"
                        value={activity.enTitle}
                        onChange={(e) =>
                          updateBulkActivity(index, "enTitle", e.target.value)
                        }
                      />

                      <textarea
                        placeholder="Hindi Short Content *"
                        value={activity.hiShortText}
                        onChange={(e) =>
                          updateBulkActivity(
                            index,
                            "hiShortText",
                            e.target.value,
                          )
                        }
                      />

                      <textarea
                        placeholder="English Short Content *"
                        value={activity.enShortText}
                        onChange={(e) =>
                          updateBulkActivity(
                            index,
                            "enShortText",
                            e.target.value,
                          )
                        }
                      />

                      <textarea
                        placeholder="Hindi Full Content *"
                        value={activity.hiDetails}
                        onChange={(e) =>
                          updateBulkActivity(index, "hiDetails", e.target.value)
                        }
                      />

                      <textarea
                        placeholder="English Full Content *"
                        value={activity.enDetails}
                        onChange={(e) =>
                          updateBulkActivity(index, "enDetails", e.target.value)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* FOOTER */}
              <div className="activityModalFooter">
                <button
                  type="button"
                  disabled={bulkSaving}
                  onClick={() => setBulkActivityModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={bulkSaving}
                  onClick={saveBulkActivities}
                >
                  {bulkSaving ? (
                    <>
                      <Loader2 size={16} className="spin" />
                      Saving 15 Activities...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Add 15 Activities
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* UNIFIED VOLUNTEER ADD / EDIT MODAL */}
        {volunteerModal && (
          <div
            className="addVolunteerOverlay"
            onClick={() => !submitLoading && setVolunteerModal(false)}
          >
            <div
              className="addVolunteerModal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="addVolunteerModalHeader">
                <h2>{editingVolunteer ? "Edit Volunteer" : "Add Volunteer"}</h2>
                <button
                  type="button"
                  className="addVolunteerClose"
                  onClick={() => setVolunteerModal(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleVolunteerSubmit}>
                <div className="addVolunteerGrid">
                  <div className="addVolunteerField">
                    <label>Name *</label>
                    <input
                      type="text"
                      required
                      minLength={3}
                      maxLength={50}
                      value={volunteerForm.name}
                      onChange={(e) =>
                        setVolunteerForm({
                          ...volunteerForm,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="addVolunteerField">
                    <label>Mobile *</label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={volunteerForm.phone}
                      onChange={(e) =>
                        setVolunteerForm({
                          ...volunteerForm,
                          phone: e.target.value.replace(/\D/g, ""),
                        })
                      }
                    />
                  </div>
                  <div className="addVolunteerField">
                    <label>Email</label>
                    <input
                      type="email"
                      required
                      maxLength={100}
                      value={volunteerForm.email}
                      onChange={(e) =>
                        setVolunteerForm({
                          ...volunteerForm,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="addVolunteerField">
                    <label>City</label>
                    <input
                      type="text"
                      required
                      minLength={2}
                      maxLength={50}
                      value={volunteerForm.city}
                      onChange={(e) =>
                        setVolunteerForm({
                          ...volunteerForm,
                          city: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="addVolunteerField">
                    <label>Area of Interest *</label>
                    <select
                      required
                      value={volunteerForm.area}
                      onChange={(e) =>
                        setVolunteerForm({
                          ...volunteerForm,
                          area: e.target.value,
                        })
                      }
                    >
                      <option value="">Choose</option>
                      {AREAS_OF_INTEREST.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="addVolunteerField addVolunteerFull">
                    <label>Message</label>
                    <textarea
                      rows="3"
                      required
                      minLength={5}
                      maxLength={500}
                      value={volunteerForm.message}
                      onChange={(e) =>
                        setVolunteerForm({
                          ...volunteerForm,
                          message: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="addVolunteerActions">
                  <button
                    type="button"
                    className="addVolunteerCancel"
                    onClick={() => setVolunteerModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="addVolunteerSubmit"
                    disabled={submitLoading}
                  >
                    {submitLoading
                      ? "Saving..."
                      : editingVolunteer
                        ? "Update Volunteer"
                        : "Add Volunteer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* BULK IMPORT MODAL */}
        {bulkModal && (
          <div
            className="addVolunteerOverlay"
            onClick={() => !bulkLoading && setBulkModal(false)}
          >
            <div
              className="bulkVolunteerModal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="addVolunteerModalHeader">
                <h2>Bulk Import Volunteers</h2>
                <button
                  type="button"
                  className="addVolunteerClose"
                  onClick={() => setBulkModal(false)}
                >
                  ×
                </button>
              </div>

              <div className="bulkExcelInfo">
                <FileSpreadsheet size={28} />
                <div>
                  <strong>Columns:</strong>
                  <p>name, phone, email, city, area, message, status</p>
                </div>
              </div>

              <div className="bulkFileBox">
                <input
                  id="excelFileInput"
                  ref={volunteerFileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setBulkFile(f);
                  }}
                />
                <label
                  htmlFor="excelFileInput"
                  className="bulkFileLabel"
                  style={{ cursor: "pointer" }}
                >
                  <Upload size={22} />
                  <span>{bulkFile ? bulkFile.name : "Choose Excel File"}</span>
                </label>
              </div>

              {bulkError && (
                <div className="bulkVolunteerError">{bulkError}</div>
              )}

              <div className="addVolunteerActions">
                <button
                  type="button"
                  className="addVolunteerCancel"
                  onClick={() => setBulkModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="addVolunteerSubmit"
                  disabled={bulkLoading || !bulkFile}
                  onClick={submitBulkImport}
                >
                  {bulkLoading ? "Importing..." : "Import Volunteers"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
    VIEW VOLUNTEER DETAILS MODAL
===================================================== */}

        {viewVolunteer && (
          <div
            className="volunteerViewOverlay"
            onClick={() => setViewVolunteer(null)}
          >
            <div
              className="volunteerViewModal"
              onClick={(e) => e.stopPropagation()}
            >
              {/* HEADER */}
              <div className="volunteerViewHeader">
                <div>
                  <span className="volunteerViewEyebrow">
                    Volunteer Details
                  </span>

                  <h2>{viewVolunteer.name || "Volunteer"}</h2>

                  <p>Swami Vivekanand Vichar Prachar Seva Samiti</p>
                </div>

                <button
                  type="button"
                  className="volunteerViewClose"
                  onClick={() => setViewVolunteer(null)}
                  title="Close"
                >
                  <X size={20} />
                </button>
              </div>

              {/* APPLICATION + STATUS */}
              <div className="volunteerViewTopInfo">
                <div className="volunteerViewApplication">
                  <span>Application No.</span>
                  <strong>{viewVolunteer.applicationNo || "-"}</strong>
                </div>

                <div
                  className={`volunteerViewStatus volunteerViewStatus-${(
                    viewVolunteer.status || "pending"
                  ).toLowerCase()}`}
                >
                  {getStatusIcon(viewVolunteer.status || "pending")}

                  <span>
                    {(viewVolunteer.status || "pending")
                      .charAt(0)
                      .toUpperCase() +
                      (viewVolunteer.status || "pending").slice(1)}
                  </span>
                </div>
              </div>

              {/* DETAILS */}
              <div className="volunteerViewDetails">
                <div className="volunteerViewField">
                  <span>Name</span>
                  <strong>{viewVolunteer.name || "-"}</strong>
                </div>

                <div className="volunteerViewField">
                  <span>Mobile</span>
                  <strong>{viewVolunteer.phone || "-"}</strong>
                </div>

                <div className="volunteerViewField volunteerViewFieldFull">
                  <span>Email</span>
                  <strong>{viewVolunteer.email || "-"}</strong>
                </div>

                <div className="volunteerViewField">
                  <span>City</span>
                  <strong>{viewVolunteer.city || "-"}</strong>
                </div>

                <div className="volunteerViewField">
                  <span>Area of Interest</span>
                  <strong>{viewVolunteer.area || "-"}</strong>
                </div>

                <div className="volunteerViewField">
                  <span>Application Date</span>
                  <strong>
                    {viewVolunteer.createdAt
                      ? new Date(viewVolunteer.createdAt).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          },
                        )
                      : "-"}
                  </strong>
                </div>

                {/* MESSAGE */}
                <div className="volunteerViewMessage">
                  <span>Message</span>

                  <div>{viewVolunteer.message || "No message provided."}</div>
                </div>
              </div>

              {/* FOOTER */}
              <div className="volunteerViewFooter">
                <button
                  type="button"
                  className="volunteerViewCloseButton"
                  onClick={() => setViewVolunteer(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DELETE CONFIRMATION MODAL */}
        {deleteModal && (
          <div
            className="deleteModalOverlay"
            onClick={() => !deleteLoading && setDeleteModal(false)}
          >
            <div className="deleteModal" onClick={(e) => e.stopPropagation()}>
              <div className="deleteWarningIcon">
                <Trash2 size={30} />
              </div>
              <h2>Delete Application?</h2>
              <p>Are you sure? This action cannot be undone.</p>
              <div className="deleteModalActions">
                <button
                  type="button"
                  className="deleteCancelButton"
                  onClick={() => setDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="deleteConfirmButton"
                  disabled={deleteLoading}
                  onClick={handleDeleteVolunteer}
                >
                  {deleteLoading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TOAST / POPUPS */}
        {toastMessage && (
          <div className="volunteerSuccessToast">
            <CheckCircle2 size={24} />
            <p>{toastMessage}</p>
            <button type="button" onClick={() => setToastMessage("")}>
              <X size={16} />
            </button>
          </div>
        )}

        {successApplicationNo && (
          <div
            className="volunteerSuccessOverlay"
            onClick={() => setSuccessApplicationNo("")}
          >
            <div
              className="volunteerSuccessPopup"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="volunteerSuccessIcon">✓</div>
              <h2>Volunteer Added!</h2>
              <div className="volunteerApplicationNo">
                <span>Application No.</span>
                <strong>{successApplicationNo}</strong>
              </div>
              <button
                type="button"
                className="volunteerSuccessOk"
                onClick={() => setSuccessApplicationNo("")}
              >
                OK
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
