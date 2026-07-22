import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "@/components/AuthContext";
import { useLanguage } from "@/components/LanguageContext";
import { 
  Shield, Check, AlertTriangle, Eye, Printer, Trash2, 
  Plus, Sparkles, MessageCircle, Star, Phone, FileText, 
  Calendar, Layers, Edit2, Sliders, DollarSign, ArrowRight,
  User, Mail, Clock, Download, FileSignature, HelpCircle, Save,
  Monitor, Smartphone, Tablet, Settings, Activity, Palette, Send, CheckCircle2, Lock, MapPin
} from "lucide-react";
import { LOGIN } from "@/constants/testIds";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const API = `${BACKEND_URL}/api`;

const DEFAULT_GLOBAL_SETTINGS = {
  general: {
    site_name: "Swiss Platten",
    company_name: "Swiss Platten GmbH",
    phone: "+41 79 123 45 67",
    opening_hours: "Mo-Fr: 09:00 - 18:00 | Sa: 10:00 - 16:00",
    email: "info@plattenlegerallerart.ch",
    address: "Bahnhofstrasse 30, 5430 Wettingen",
    uid: "CHE-123.456.789 MWST",
    logo_mode: "text",
    logo_text: "SWISS PLATTEN",
    logo_initials: "SP",
    logo_subtitle: "Atelier d'Architecture",
    logo_image_url: "",
    logo_image_height: "40",
    logo_image_width: "40",
    logo_image_alt: "Swiss Platten Logo",
    footer_description: "Ihr zertifizierter Schweizer Meisterbetrieb für exklusive Plattenlegearbeiten, präzise Bodenschleiftechnik und langlebige Spezialabdichtungen. Handwerk auf höchstem Niveau.",
    footer_copyright: "© 2024 Swiss Platten GmbH. Alle Rechte vorbehalten.",
    footer_phone: "+41 79 123 45 67",
    footer_opening_hours: "Mo-Fr: 09:00 - 18:00 | Sa: 10:00 - 16:00",
    footer_email: "info@plattenlegerallerart.ch",
    footer_address: "Bahnhofstrasse 30, 5430 Wettingen",
    footer_bg_color: "#0f172a"
  },
  smtp: {
    host: "smtp.plattenlegerallerart.ch",
    port: 587,
    username: "smtp_user",
    password: "password_placeholder",
    from_email: "info@plattenlegerallerart.ch",
    from_name: "Swiss Platten GmbH",
    reply_to: "info@plattenlegerallerart.ch",
    starttls: true,
    active: false
  },
  cookies: {
    enabled: true,
    banner_title: "Wir verwenden Cookies mit Stil",
    banner_text: "Für ein schnelleres, sichereres und besseres Nutzererlebnis verwenden wir nur die notwendigsten Cookies sowie optionale Analyse-Cookies nach Ihrer Zustimmung.",
    accept_text: "Alle akzeptieren",
    reject_text: "Nur notwendige",
    settings_text: "Cookie-Einstellungen",
    save_text: "Auswahl speichern",
    policy_link_text: "Cookie-Richtlinie",
    policy_link_url: "/cookie-einstellungen",
    necessary_label: "Notwendige Cookies",
    analytics_label: "Analyse Cookies",
    marketing_label: "Marketing Cookies",
    necessary_desc: "Diese Cookies sind technisch erforderlich und immer aktiv.",
    analytics_desc: "Hilft uns, die Website qualitativ zu verbessern.",
    marketing_desc: "Wird für personalisierte Inhalte und Kampagnen genutzt.",
    show_preferences_link: true,
    show_banner_on_load: true,
    default_necessary: true,
    default_analytics: false,
    default_marketing: false
  }
};

export default function AdminDashboard() {
  const { user, login, logout, checkMe, loading } = useAuth();
  const { t } = useLanguage();

  // --- COMPREHENSIVE LOGIN / RESET ---
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [forceReset, setForceReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  // --- CMS ADMINISTRATIVE CORE STATES ---
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState("quotes");
  const [themeMode, setThemeMode] = useState("light"); // dark, light
  
  // Dynamic collections
  const [quotes, setQuotes] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [sliders, setSliders] = useState([]);
  const [banners, setBanners] = useState([]);
  const [editingBanner, setEditingPageBanner] = useState(null);
  const [bannerForm, setBannerForm] = useState({
    id: "", name: "", type: "image", location: "header_top",
    title: "", desc: "", btn_text: "", btn_link: "",
    image_desktop: "", bg_color: "rgb(17, 20, 24)", active: true
  });
  const [pages, setPages] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectForm, setProjectForm] = useState({
    id: "",
    title: "",
    slug: "",
    category: "commercial",
    image_url: "",
    location: "",
    duration: "",
    materials: "",
    works: "",
    desc: "",
    active: true,
    featured: false,
    order: 0
  });
  const [editingProject, setEditingProject] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [callbacks, setCallbacks] = useState([]);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [serviceAreaSection, setServiceAreaSection] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamMemberForm, setTeamMemberForm] = useState({
    id: "",
    name: "",
    role: "",
    title: "",
    bio: "",
    photo_url: "",
    email: "",
    phone: "",
    social_links: "",
    is_owner: false,
    is_active: true,
    is_featured: false,
    order: 0
  });
  const [editingTeamMember, setEditingTeamMember] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Modals & Active Editors
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [newNote, setNewNote] = useState("");
  const [editingSlider, setEditingSlider] = useState(null);
  const [editingFaq, setEditingFaq] = useState(null);
  const [editingPage, setEditingPage] = useState(null);
  const [editingServiceArea, setEditingServiceArea] = useState(null);
  const [serviceAreaForm, setServiceAreaForm] = useState({
    id: "", name: "", slug: "", KANTON: "", city: "", postal_codes: "", short_description: "", description: "",
    image_url: "", mobile_image_url: "", icon: "MapPin", latitude: 47.3769, longitude: 8.5417, radius: 25,
    is_active: true, is_featured: false, show_on_homepage: true, sort_order: 0, cta_text: "Offerte anfragen", cta_link: "/quote-request", service_ids: ""
  });
  const [activeContactTicket, setActiveContactTicket] = useState(null);
  const [contactReplyText, setContactReplyText] = useState("");
  const [isTestSmtpLoading, setIsTestSmtpLoading] = useState(false);
  const [bannerUploadLoading, setBannerUploadLoading] = useState(false);

  // --- SLIDER FORM STATE ---
  const [sliderForm, setSliderForm] = useState({
    id: "", title: "", subtitle: "", desc: "",
    image_desktop: "", image_mobile: "",
    btn1_text: "Kostenlose Offerte", btn1_link: "/quote-request",
    btn2_text: "Unsere Galerie", btn2_link: "/portfolio",
    active: true, order: 0, overlay_opacity: 0.4, transition_speed: 5000
  });

  // --- PAGE CMS FORM STATE ---
  const [pageForm, setPageForm] = useState({
    id: "", title: "", slug: "", content: "",
    published: true, on_startpage: false, menu_position: "footer",
    seo_title: "", seo_description: "", seo_keywords: ""
  });

  // --- FAQ FORM STATE ---
  const [faqForm, setFaqForm] = useState({
    id: "", category: "Plattenarbeiten",
    question_de: "", answer_de: "",
    question_en: "", answer_en: ""
  });

  // --- BRANDING & SMTP GLOBAL VARIABLES SETTINGS ---
  const [globalSettings, setGlobalSettings] = useState(DEFAULT_GLOBAL_SETTINGS);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [logoUploadLoading, setLogoUploadLoading] = useState(false);
  const [teamPhotoUploadLoading, setTeamPhotoUploadLoading] = useState(false);

  // Chat messaging inside quote
  const [quoteMessages, setQuoteMessages] = useState([]);
  const [newChatMessage, setNewChatMessage] = useState("");
  const quoteMessagesWsRef = useRef(null);

  const buildWebSocketUrl = (path) => {
    const wsProtocol = BACKEND_URL.startsWith("https") ? "wss" : "ws";
    const origin = BACKEND_URL.replace(/^https?/, wsProtocol);
    return `${origin}${path}`;
  };

  // Filters & Searches
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchFilter, setSearchFilter] = useState("");

  // Price calculations
  const [quoteItems, setQuoteItems] = useState([]);
  const [newItem, setNewItem] = useState({ description: "", qty: 1, unit_price: 0 });
  const [discountPct, setDiscountPct] = useState(0);
  const [mwstActive, setMwstActive] = useState(true);
  const [mwstRate, setMwstRate] = useState(8.1);
  const [validityDays, setValidityDays] = useState(30);
  const [paymentTerms, setPaymentTerms] = useState("30 Tage netto");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [regeneratingSummary, setRegeneratingSummary] = useState(false);

  const parseRgbColor = (color) => {
    const match = String(color || "").match(/rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/i);
    if (!match) return { r: 17, g: 20, b: 24 };
    return {
      r: Math.max(0, Math.min(255, Number(match[1]))),
      g: Math.max(0, Math.min(255, Number(match[2]))),
      b: Math.max(0, Math.min(255, Number(match[3]))),
    };
  };

  const buildRgbColor = (r, g, b) => `rgb(${Number(r) || 0}, ${Number(g) || 0}, ${Number(b) || 0})`;

  const handleAuthFailure = async (err, fallbackMessage = "Vorgang fehlgeschlagen.") => {
    if (err?.response?.status === 401) {
      alert("Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.");
      await logout();
      return true;
    }
    alert(fallbackMessage);
    return false;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setLoginError("Bitte alle Felder ausfüllen.");
      return;
    }
    setLoginLoading(true);
    setLoginError("");
    const res = await login(loginEmail, loginPassword);
    setLoginLoading(false);
    if (res.success) {
      const meRes = await axios.get(`${API}/auth/me`);
      if (meRes.data.needs_password_reset) {
        setForceReset(true);
      } else {
        setForceReset(false);
      }
    } else {
      setLoginError(res.error || "Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihr Passwort.");
    }
  };

  const handleForceResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setResetError("Passwortfelder dürfen nicht leer sein.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError("Passwörter stimmen nicht überein.");
      return;
    }
    try {
      const res = await axios.post(`${API}/auth/reset-password-first`, {
        current_password: loginPassword,
        new_password: newPassword
      });
      if (res.data.success) {
        setResetSuccess("Passwort erfolgreich aktualisiert!");
        setForceReset(false);
        checkMe();
      }
    } catch (err) {
      setResetError(err.response?.data?.detail || "Überprüfungsfehler.");
    }
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLogoUploadLoading(true);
      const res = await axios.post(`${API}/quotes/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setGlobalSettings((prev) => ({
        ...prev,
        general: {
          ...prev.general,
          logo_mode: "image",
          logo_image_url: res.data.url,
          logo_image_alt: prev.general.logo_image_alt || prev.general.company_name || "Swiss Platten Logo"
        }
      }));
    } catch (err) {
      alert(err.response?.data?.detail || "Logo konnte nicht hochgeladen werden.");
    } finally {
      setLogoUploadLoading(false);
      event.target.value = "";
    }
  };

  const fetchAllData = async () => {
    if (!user || forceReset) return;
    try {
      const [
        statsRes, quotesRes, contractsRes, slidersRes, 
        reviewsRes, faqsRes, contactsRes, callbacksRes, 
        notifsRes, pagesRes, projectsRes, logsRes, settingsRes, emailLogsRes, bannersRes, serviceAreasRes, teamRes, serviceAreaSectionRes
      ] = await Promise.all([
        axios.get(`${API}/admin/stats`),
        axios.get(`${API}/admin/quotes`),
        axios.get(`${API}/admin/contracts`),
        axios.get(`${API}/admin/sliders`),
        axios.get(`${API}/admin/reviews`),
        axios.get(`${API}/faqs`),
        axios.get(`${API}/admin/contacts`),
        axios.get(`${API}/admin/callbacks`),
        axios.get(`${API}/admin/notifications`),
        axios.get(`${API}/admin/pages`),
        axios.get(`${API}/admin/projects`),
        axios.get(`${API}/admin/audit-logs`),
        axios.get(`${API}/admin/settings`),
        axios.get(`${API}/admin/email-logs`),
        axios.get(`${API}/admin/banners`),
        axios.get(`${API}/admin/service-areas`),
        axios.get(`${API}/admin/team`),
        axios.get(`${API}/admin/homepage-sections/service-areas`)
      ]);
      setStats(statsRes.data);
      setQuotes(quotesRes.data);
      setContracts(contractsRes.data);
      setSliders(slidersRes.data);
      setReviews(reviewsRes.data);
      setFaqs(faqsRes.data);
      setContacts(contactsRes.data);
      setCallbacks(callbacksRes.data);
      setNotifications(notifsRes.data);
      setPages(pagesRes.data);
      setProjects(projectsRes.data);
      setAuditLogs(logsRes.data);
      setEmailLogs(emailLogsRes.data);
      setBanners(bannersRes.data);
      setServiceAreas(serviceAreasRes.data);
      setTeamMembers(teamRes.data);
      setServiceAreaSection(serviceAreaSectionRes.data);
      if (settingsRes.data && settingsRes.data.general) {
        setGlobalSettings({
          ...DEFAULT_GLOBAL_SETTINGS,
          ...settingsRes.data,
          general: { ...DEFAULT_GLOBAL_SETTINGS.general, ...(settingsRes.data.general || {}) },
          smtp: { ...DEFAULT_GLOBAL_SETTINGS.smtp, ...(settingsRes.data.smtp || {}) },
          cookies: { ...DEFAULT_GLOBAL_SETTINGS.cookies, ...(settingsRes.data.cookies || {}) }
        });
      }
    } catch (err) {
      if (err?.response?.status === 401) {
        await logout();
        return;
      }
      console.error("Error loading secure admin data:", err);
    }
  };

  useEffect(() => {
    if (user && !forceReset) {
      fetchAllData();
    }
  }, [user, forceReset]);

  // Load message thread for active quote
  const fetchQuoteMessages = async (quoteId) => {
    try {
      const res = await axios.get(`${API}/quotes/${quoteId}/messages`);
      setQuoteMessages(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!selectedQuote) {
      if (quoteMessagesWsRef.current) {
        quoteMessagesWsRef.current.close();
        quoteMessagesWsRef.current = null;
      }
      return;
    }

    fetchQuoteMessages(selectedQuote.id);
    setQuoteItems(selectedQuote.items || []);
    setDiscountPct(selectedQuote.discount_pct || 0);
    setMwstActive(selectedQuote.mwst_active !== undefined ? selectedQuote.mwst_active : true);
    setMwstRate(selectedQuote.mwst_rate || 8.1);
    setValidityDays(selectedQuote.validity_days || 30);
    setPaymentTerms(selectedQuote.payment_terms || "30 Tage netto");

    if (quoteMessagesWsRef.current) {
      quoteMessagesWsRef.current.close();
      quoteMessagesWsRef.current = null;
    }

    const websocket = new WebSocket(buildWebSocketUrl(`/api/quotes/${selectedQuote.id}/messages/ws`));
    websocket.onopen = () => {
      console.info(`Quote messages websocket connected for ${selectedQuote.id}`);
    };
    websocket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.type === "new_message" && payload?.message) {
          setQuoteMessages((prev) => {
            const alreadyExists = prev.some((m) => m.id === payload.message.id);
            if (alreadyExists) return prev;
            return [...prev, payload.message];
          });
        }
      } catch (error) {
        console.error("Invalid websocket payload for quote messages:", error);
      }
    };
    websocket.onclose = () => {
      console.info(`Quote messages websocket closed for ${selectedQuote.id}`);
    };
    websocket.onerror = (event) => {
      console.error("Quote messages websocket error:", event);
    };

    quoteMessagesWsRef.current = websocket;

    return () => {
      if (quoteMessagesWsRef.current) {
        quoteMessagesWsRef.current.close();
        quoteMessagesWsRef.current = null;
      }
    };
  }, [selectedQuote]);

  // --- EXPORTS & REMINDERS CRONS ---
  const handleExportCSV = () => {
    window.open(`${API}/admin/quotes/export-csv`, "_blank");
  };

  const handleRunReminders = async () => {
    try {
      const res = await axios.post(`${API}/admin/quotes/run-reminders`);
      if (res.data.success) {
        alert(`${res.data.reminded_count} Erinnerungen ausgeführt!`);
        fetchAllData();
      }
    } catch (e) {
      alert("Ein Fehler ist aufgetreten.");
    }
  };

  // --- CALCULATION LOGICS ---
  const safeNum = (val) => {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  const subtotal = quoteItems.reduce((acc, item) => acc + (safeNum(item.qty) * safeNum(item.unit_price)), 0);
  const discountAmount = subtotal * (safeNum(discountPct) / 100);
  const subtotalWithDiscount = subtotal - discountAmount;
  const mwstAmount = mwstActive ? (subtotalWithDiscount * (safeNum(mwstRate) / 100)) : 0;
  const grandTotal = subtotalWithDiscount + mwstAmount;

  const handleAddRowItem = () => {
    if (!newItem.description.trim() || newItem.qty <= 0 || newItem.unit_price < 0) return;
    const itemToAdd = {
      description: newItem.description,
      qty: Number(newItem.qty),
      unit_price: Number(newItem.unit_price),
      total_price: Number(newItem.qty) * Number(newItem.unit_price)
    };
    setQuoteItems(prev => [...prev, itemToAdd]);
    setNewItem({ description: "", qty: 1, unit_price: 0 });
  };

  const handleRemoveRowItem = (idx) => {
    setQuoteItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveQuoteCalculation = async () => {
    try {
      await axios.put(`${API}/admin/quotes/${selectedQuote.id}`, {
        items: quoteItems,
        discount_pct: Number(discountPct),
        mwst_active: mwstActive,
        mwst_rate: Number(mwstRate),
        validity_days: Number(validityDays),
        payment_terms: paymentTerms
      });
      alert("Kalkulation erfolgreich gespeichert!");
      fetchAllData();
    } catch (e) {
      alert("Ein Fehler ist aufgetreten.");
    }
  };

  const handleSendQuoteToClient = async () => {
    try {
      await axios.put(`${API}/admin/quotes/${selectedQuote.id}`, {
        items: quoteItems,
        discount_pct: Number(discountPct),
        mwst_active: mwstActive,
        mwst_rate: Number(mwstRate),
        validity_days: Number(validityDays),
        payment_terms: paymentTerms,
        status: "An Kunden gesendet"
      });
      alert(`Offerte erfolgreich an ${selectedQuote.email} gesendet!`);
      setSelectedQuote(null);
      fetchAllData();
    } catch (e) {
      alert("Senden fehlgeschlagen.");
    }
  };

  // --- GENERAL ACTIONS ---
  const handleUpdateStatus = async (quoteId, newStatus) => {
    try {
      await axios.put(`${API}/admin/quotes/${quoteId}/status`, { status: newStatus });
      fetchAllData();
      if (selectedQuote && selectedQuote.id === quoteId) {
        setSelectedQuote(prev => ({ ...prev, status: newStatus }));
      }
    } catch (e) {
      alert("Hata.");
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      const res = await axios.post(`${API}/admin/quotes/${selectedQuote.id}/notes`, { note: newNote });
      setSelectedQuote(prev => ({
        ...prev,
        internal_notes: [...(prev.internal_notes || []), res.data.note]
      }));
      setNewNote("");
      fetchAllData();
    } catch (e) {
      alert("Hata.");
    }
  };

  const handleRegenerateSummary = async (quoteId) => {
    setRegeneratingSummary(true);
    try {
      const res = await axios.post(`${API}/admin/quotes/${quoteId}/regenerate-summary`);
      setSelectedQuote(prev => ({ ...prev, ai_summary: res.data.ai_summary }));
      fetchAllData();
    } catch (e) {
      alert("AI summary hata.");
    } finally {
      setRegeneratingSummary(false);
    }
  };

  const handleDeleteQuote = async (quoteId) => {
    if (!window.confirm("Möchten Sie diese Anfrage löschen?")) return;
    try {
      await axios.delete(`${API}/admin/quotes/${quoteId}`);
      setSelectedQuote(null);
      fetchAllData();
    } catch (e) {
      alert("Löschen fehlgeschlagen.");
    }
  };

  // --- BANNERS CRUD ---
  const handleBannerSubmit = async (e) => {
    e.preventDefault();
    try {
      if (bannerForm.id) {
        await axios.put(`${API}/admin/banners/${bannerForm.id}`, bannerForm);
      } else {
        await axios.post(`${API}/admin/banners`, bannerForm);
      }
      setEditingPageBanner(false);
      setBannerForm({
        id: "", name: "", type: "image", location: "header_top",
        title: "", desc: "", btn_text: "", btn_link: "",
        image_desktop: "", bg_color: "rgb(17, 20, 24)", active: true
      });
      const updatedBanners = await axios.get(`${API}/admin/banners`);
      setBanners(updatedBanners.data || []);
    } catch (err) {
      await handleAuthFailure(err, "Fehler beim Speichern des Banners.");
    }
  };

  const handleDeleteBanner = async (id) => {
    if (!window.confirm("Banner löschen?")) return;
    try {
      await axios.delete(`${API}/admin/banners/${id}`);
      const updatedBanners = await axios.get(`${API}/admin/banners`);
      setBanners(updatedBanners.data || []);
    } catch (e) {
      await handleAuthFailure(e, "Löschen fehlgeschlagen.");
    }
  };

  const handleBannerImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      setBannerUploadLoading(true);
      const res = await axios.post(`${API}/quotes/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setBannerForm((prev) => ({
        ...prev,
        image_desktop: res.data.url
      }));
    } catch (err) {
      alert(err.response?.data?.detail || "Banner-Bild konnte nicht hochgeladen werden.");
    } finally {
      setBannerUploadLoading(false);
      event.target.value = "";
    }
  };

  const handleTeamPhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      setTeamPhotoUploadLoading(true);
      const res = await axios.post(`${API}/quotes/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setTeamMemberForm((prev) => ({
        ...prev,
        photo_url: res.data.url
      }));
    } catch (err) {
      alert(err.response?.data?.detail || "Foto konnte nicht hochgeladen werden.");
    } finally {
      setTeamPhotoUploadLoading(false);
      event.target.value = "";
    }
  };

  const handleTeamMemberSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: teamMemberForm.name,
        role: teamMemberForm.role,
        title: teamMemberForm.title,
        bio: teamMemberForm.bio,
        photo_url: teamMemberForm.photo_url,
        email: teamMemberForm.email,
        phone: teamMemberForm.phone,
        social_links: teamMemberForm.social_links,
        is_owner: Boolean(teamMemberForm.is_owner),
        is_active: Boolean(teamMemberForm.is_active),
        is_featured: Boolean(teamMemberForm.is_featured),
        order: Number(teamMemberForm.order) || 0
      };

      if (teamMemberForm.id) {
        await axios.put(`${API}/admin/team/${teamMemberForm.id}`, payload);
      } else {
        await axios.post(`${API}/admin/team`, payload);
      }

      setEditingTeamMember(false);
      setTeamMemberForm({
        id: "",
        name: "",
        role: "",
        title: "",
        bio: "",
        photo_url: "",
        email: "",
        phone: "",
        social_links: "",
        is_owner: false,
        is_active: true,
        is_featured: false,
        order: 0
      });
      fetchAllData();
    } catch (err) {
      await handleAuthFailure(err, "Fehler beim Speichern des Team-Mitglieds.");
    }
  };

  const handleEditTeamMember = (member) => {
    setTeamMemberForm({
      id: member.id,
      name: member.name || "",
      role: member.role || "",
      title: member.title || "",
      bio: member.bio || "",
      photo_url: member.photo_url || "",
      email: member.email || "",
      phone: member.phone || "",
      social_links: (member.social_links || []).join(", "),
      is_owner: Boolean(member.is_owner),
      is_active: member.is_active !== false,
      is_featured: Boolean(member.is_featured),
      order: member.order || 0
    });
    setEditingTeamMember(true);
  };

  const handleDeleteTeamMember = async (id) => {
    if (!window.confirm("Team-Mitglied löschen?")) return;
    try {
      await axios.delete(`${API}/admin/team/${id}`);
      fetchAllData();
    } catch (err) {
      await handleAuthFailure(err, "Fehler beim Löschen des Team-Mitglieds.");
    }
  };

  // --- PAGES CMS CRUD ---
  const handlePageSubmit = async (e) => {
    e.preventDefault();
    try {
      if (pageForm.id) {
        await axios.put(`${API}/admin/pages/${pageForm.id}`, pageForm);
      } else {
        await axios.post(`${API}/admin/pages`, pageForm);
      }
      setEditingPage(false);
      setPageForm({
        id: "", title: "", slug: "", content: "",
        published: true, on_startpage: false, menu_position: "footer",
        seo_title: "", seo_description: "", seo_keywords: ""
      });
      fetchAllData();
    } catch (err) {
      alert("Speichern fehlgeschlagen.");
    }
  };

  const handleDeletePage = async (id) => {
    if (!window.confirm("Seite wirklich löschen?")) return;
    try {
      await axios.delete(`${API}/admin/pages/${id}`);
      fetchAllData();
    } catch (e) {
      alert("Hata.");
    }
  };

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...projectForm,
        slug: projectForm.slug.trim().toLowerCase().replace(/\s+/g, "-"),
      };
      if (projectForm.id) {
        await axios.put(`${API}/admin/projects/${projectForm.id}`, payload);
      } else {
        await axios.post(`${API}/admin/projects`, payload);
      }
      setEditingProject(false);
      setProjectForm({
        id: "",
        title: "",
        slug: "",
        category: "commercial",
        image_url: "",
        location: "",
        duration: "",
        materials: "",
        works: "",
        desc: "",
        active: true,
        featured: false,
        order: 0
      });
      fetchAllData();
    } catch (err) {
      alert(err.response?.data?.detail || "Projekt speichern fehlgeschlagen.");
    }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm("Projekt wirklich löschen?")) return;
    try {
      await axios.delete(`${API}/admin/projects/${id}`);
      fetchAllData();
    } catch (err) {
      await handleAuthFailure(err, "Projekt löschen fehlgeschlagen.");
    }
  };

  const handleEditProject = (project) => {
    setProjectForm({
      id: project.id,
      title: project.title || "",
      slug: project.slug || "",
      category: project.category || "commercial",
      image_url: project.image_url || "",
      location: project.location || "",
      duration: project.duration || "",
      materials: project.materials || "",
      works: project.works || "",
      desc: project.desc || "",
      active: project.active !== false,
      featured: project.featured !== false,
      order: project.order || 0
    });
    setEditingProject(true);
  };

  // --- CHAT MESSAGE CLIENT / ADMIN ---
  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!newChatMessage.trim() || !selectedQuote) return;
    try {
      await axios.post(`${API}/quotes/${selectedQuote.id}/messages`, {
        sender: "Admin",
        message: newChatMessage
      });
      setNewChatMessage("");
      fetchQuoteMessages(selectedQuote.id);
    } catch (e) {
      alert("Fehler beim Senden.");
    }
  };

  // --- FAQ & REVIEWS & TICKET REPLIES ---
  const handleFaqSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/admin/faqs`, faqForm);
      setEditingFaq(false);
      setFaqForm({ id: "", category: "Plattenarbeiten", question_de: "", answer_de: "" });
      fetchAllData();
    } catch (e) {
      alert("Hata.");
    }
  };

  const handleDeleteFaq = async (id) => {
    if (!window.confirm("FAQ löschen?")) return;
    try {
      await axios.delete(`${API}/admin/faqs/${id}`);
      fetchAllData();
    } catch (e) {
      alert("Hata.");
    }
  };

  const handleApproveReview = async (id, approved) => {
    try {
      await axios.put(`${API}/admin/reviews/${id}/approve`, { approved });
      fetchAllData();
    } catch (e) {
      alert("Hata.");
    }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm("Review löschen?")) return;
    try {
      await axios.delete(`${API}/admin/reviews/${id}`);
      fetchAllData();
    } catch (e) {
      alert("Hata.");
    }
  };

  const handleUpdateCallbackStatus = async (callbackId, newStatus) => {
    try {
      await axios.put(`${API}/admin/callbacks/${callbackId}/status`, { status: newStatus });
      setCallbacks((prev) =>
        prev.map((cb) => (cb.id === callbackId ? { ...cb, status: newStatus } : cb))
      );
      setNotifications((prev) => prev);
    } catch (err) {
      await handleAuthFailure(err, "Rückruf-Status konnte nicht aktualisiert werden.");
    }
  };

  const handleSliderSubmit = async (e) => {
    e.preventDefault();
    try {
      if (sliderForm.id) {
        await axios.put(`${API}/admin/sliders/${sliderForm.id}`, sliderForm);
      } else {
        await axios.post(`${API}/admin/sliders`, sliderForm);
      }
      setEditingSlider(false);
      setSliderForm({
        id: "", title: "", subtitle: "", desc: "",
        image_desktop: "", image_mobile: "",
        btn1_text: "Kostenlose Offerte", btn1_link: "/quote-request",
        btn2_text: "Unsere Galerie", btn2_link: "/portfolio",
        active: true, order: 0, overlay_opacity: 0.4, transition_speed: 5000
      });
      fetchAllData();
    } catch (e) {
      alert("Slider hata.");
    }
  };

  const handleDeleteSlider = async (id) => {
    if (!window.confirm("Slider löschen?")) return;
    try {
      await axios.delete(`${API}/admin/sliders/${id}`);
      fetchAllData();
    } catch (e) {
      alert("Hata.");
    }
  };

  // Reply to Message Tickets directly
  const handleTicketReplySubmit = async (e) => {
    e.preventDefault();
    if (!contactReplyText.trim()) return;
    try {
      await axios.post(`${API}/admin/contacts/${activeContactTicket.id}/reply`, {
        reply: contactReplyText
      });
      alert("E-Mail-Antwort erfolgreich an den Kunden gesendet!");
      setContactReplyText("");
      setActiveContactTicket(null);
      fetchAllData();
    } catch (err) {
      alert("Senden fehlgeschlagen.");
    }
  };

  const handleTestSmtp = async () => {
    setIsTestSmtpLoading(true);
    try {
      const payload = {
        ...globalSettings.smtp,
        test_recipient: globalSettings.general?.email || "info@plattenlegerallerart.ch"
      };
      const res = await axios.post(`${API}/admin/settings/test-smtp`, payload);
      if (res.data?.success) {
        alert(`SMTP-Test erfolgreich! ${res.data?.messageId ? `Nachricht-ID: ${res.data.messageId}` : "Test-E-Mail wurde versendet."}`);
      } else {
        alert(res.data?.error || "SMTP-Test fehlgeschlagen.");
      }
    } catch (e) {
      alert(e?.response?.data?.error || "Verbindung fehlgeschlagen.");
    } finally {
      setIsTestSmtpLoading(false);
    }
  };

  const filteredQuotes = quotes.filter(q => {
    const matchesSearch = `${q.first_name} ${q.last_name} ${q.reference_number}`.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesStatus = statusFilter === "all" || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const unreadContactsCount = contacts.filter((c) => c.status === "Neu").length;
  const unreadCallbacksCount = callbacks.filter((cb) => cb.status === "Neu").length;
  const communicationTodoCount = unreadContactsCount + unreadCallbacksCount;

  if (loading) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center bg-[#FAF9F6]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C5A880]" />
      </div>
    );
  }

  // --- FORCE RESET PASSWORDS OVERLAYS ---
  if (user && forceReset) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white border border-[#C5A880]/20 p-8 sm:p-12 rounded shadow-2xl space-y-6">
          <div className="text-center space-y-3">
            <Lock className="w-12 h-12 text-[#C5A880] mx-auto" />
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Erstanmeldung: Passwort ändern</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Bitte legen Sie ein neues, sicheres Passwort fest.</p>
          </div>

          <form onSubmit={handleForceResetPassword} className="space-y-4 font-semibold text-xs uppercase tracking-widest text-slate-500">
            <div className="space-y-1">
              <label>Neues Passwort *</label>
              <input 
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-[#C5A880] focus:outline-none text-slate-800"
                required
              />
            </div>
            <div className="space-y-1">
              <label>Passwort bestätigen *</label>
              <input 
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-[#C5A880] focus:outline-none text-slate-800"
                required
              />
            </div>

            {resetError && (
              <div className="bg-red-50 border border-red-200 p-3 rounded flex items-center space-x-2 text-xs text-red-700">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{resetError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[10px] tracking-widest uppercase py-3.5 border border-[#C5A880]/30 rounded-sm"
            >
              Passwort speichern & eintreten
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- SECT 1: SECURED LOGIN PAGE ---
  if (!user) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white border border-[#C5A880]/20 p-8 sm:p-12 rounded shadow-2xl space-y-6">
          <div className="text-center space-y-3">
            <Shield className="w-12 h-12 text-[#C5A880] mx-auto" />
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Atelier-Verwaltung Login</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t("admin.loginDesc")}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">E-Mail</label>
              <input 
                type="email"
                data-testid={LOGIN.emailInput}
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-[#C5A880] focus:outline-none"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Passwort</label>
              <input 
                type="password"
                data-testid={LOGIN.passwordInput}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-[#C5A880] focus:outline-none"
                required
              />
            </div>

            {loginError && (
              <div className="bg-red-50 border border-red-200 p-3 rounded flex items-center space-x-2 text-xs text-red-700">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              data-testid={LOGIN.submitButton}
              disabled={loginLoading}
              className="w-full bg-slate-900 text-white hover:bg-slate-800 py-3.5 rounded text-xs font-bold uppercase tracking-widest transition-colors disabled:bg-slate-700"
            >
              {loginLoading ? "Wird geladen..." : "Anmelden"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- SECT 2: REDESIGNED SIDEBAR SAAS LAYOUT CMS ---
  const sidebarItems = [
    { id: "quotes", label: "Offerten", icon: <FileText className="w-4 h-4" /> },
    { id: "contracts", label: "Verträge", icon: <FileSignature className="w-4 h-4" /> },
    { id: "pages", label: "Seiten CMS", icon: <Layers className="w-4 h-4" /> },
    { id: "projects", label: "Projekte", icon: <Monitor className="w-4 h-4" /> },
    { id: "sliders", label: "Hero Slider", icon: <Sliders className="w-4 h-4" /> },
    { id: "faqs", label: "FAQs & Reviews", icon: <HelpCircle className="w-4 h-4" /> },
    { id: "serviceareas", label: "Einsatzgebiete", icon: <MapPin className="w-4 h-4" /> },
    { id: "team", label: "Team", icon: <User className="w-4 h-4" /> },
    { id: "contacts", label: "Nachrichten & Calls", icon: <MessageCircle className="w-4 h-4" /> },
    { id: "banners", label: "Banner Manager", icon: <Palette className="w-4 h-4" /> },
    { id: "settings", label: "System-Einstellungen", icon: <Settings className="w-4 h-4" /> },
    { id: "audit", label: "Audit-Protokolle", icon: <Activity className="w-4 h-4" /> }
  ];

  return (
    <div className={`flex min-h-screen flex-col lg:flex-row ${themeMode === "dark" ? "bg-slate-950 text-white dark" : "bg-slate-100 text-slate-900"}`}>
      {/* 1. Permanent Left SaaS Sidebar */}
      <aside className="w-full lg:w-64 bg-[#111418] text-slate-300 border-r border-[#C5A880]/15 flex flex-col justify-between shrink-0 lg:min-h-screen">
        <div>
          {/* Logo brand header */}
          <div className="h-20 flex items-center px-6 border-b border-[#C5A880]/10">
            <span className="text-[#C5A880] text-sm font-black tracking-widest uppercase flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>ATELIER SUITE</span>
            </span>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2 lg:space-y-1 lg:grid-cols-1">
            {sidebarItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSelectedQuote(null);
                    setEditingPage(false);
                    setEditingSlider(false);
                    setEditingFaq(false);
                    setEditingServiceArea(false);
                  }}
                  className={`w-full flex items-center justify-center lg:justify-start space-x-3 px-4 py-3 rounded text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all ${
                    active 
                      ? "bg-[#C5A880] text-slate-950 font-black shadow-lg" 
                      : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.id === "contacts" && communicationTodoCount > 0 && (
                    <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-black text-white">
                      {communicationTodoCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Account bottom bar */}
        <div className="p-4 border-t border-[#C5A880]/10 flex justify-between items-center bg-slate-950/20">
          <div>
            <span className="block text-[10px] font-black uppercase text-[#C5A880]">{user.role}</span>
            <span className="block text-xs font-bold text-white truncate max-w-[140px]">{user.name}</span>
          </div>
          <button 
            onClick={logout}
            className="text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-red-500"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* 2. Main Content Frame */}
      <div className="flex-grow flex flex-col min-h-screen min-w-0">
        
        {/* Upper Header Nav */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm">
          {/* Breadcrumbs */}
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-2">
            <span>Admin</span>
            <span>/</span>
            <span className="text-slate-800">{activeTab.toUpperCase()}</span>
          </div>

          {/* Theme switcher & counter */}
          <div className="flex items-center space-x-6">
            {/* Quick Unread counter */}
            {stats && (stats.totals.new_quotes > 0 || communicationTodoCount > 0) && (
              <span className="bg-red-50 border border-red-200 text-red-600 px-3 py-1 text-[10px] font-bold tracking-widest uppercase rounded-sm">
                {stats.totals.new_quotes + communicationTodoCount} NEUE AKTION ERFORDERLICH
              </span>
            )}

            {/* Light/Dark mode */}
            <button 
              onClick={() => setThemeMode(themeMode === "light" ? "dark" : "light")}
              className="text-slate-600 hover:text-[#C5A880] transition-colors"
            >
              <Palette className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Dashboard Analytics Bar */}
        {activeTab === "quotes" && stats && (
          <div className="p-8 pb-0 grid grid-cols-2 lg:grid-cols-4 gap-6 bg-slate-50">
            <div className="bg-white border border-[#C5A880]/10 p-6 rounded shadow-sm">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Offerten</span>
              <span className="text-3xl font-black text-slate-950 mt-1 block">{stats.totals.quotes}</span>
            </div>
            <div className="bg-white border border-[#C5A880]/10 p-6 rounded shadow-sm">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Neu</span>
              <span className="text-3xl font-black text-red-600 mt-1 block">{stats.totals.new_quotes}</span>
            </div>
            <div className="bg-white border border-[#C5A880]/10 p-6 rounded shadow-sm">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Akzeptiert</span>
              <span className="text-3xl font-black text-green-600 mt-1 block">{stats.totals.completed_quotes}</span>
            </div>
            <div className="bg-slate-900 text-white p-6 rounded shadow-sm border border-[#C5A880]/15">
              <span className="block text-[10px] font-black text-[#C5A880] uppercase tracking-widest">CIRO (CHF)</span>
              <span className="text-2xl font-black text-white mt-1 block">CHF {stats.totals.accepted_total_ciro?.toLocaleString() || "0.00"}</span>
            </div>
          </div>
        )}

        {/* Core Workspace Section */}
        <main className="p-8 flex-grow">
          
          {/* TAB 1: OFFERS (OFFERTEN) */}
          {activeTab === "quotes" && (
            <div className="bg-white border border-slate-200 p-8 rounded shadow-sm space-y-6">
              <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                  <input 
                    type="text"
                    placeholder="Kunde, Offerte-Nr. suchen..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm w-full sm:max-w-xs focus:ring-1 focus:ring-[#C5A880] focus:outline-none font-semibold text-slate-700"
                  />
                  
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-[#C5A880] focus:outline-none font-bold text-slate-700"
                  >
                    <option value="all">Alle Stati</option>
                    {[
                      "Neu", "In Prüfung", "Rückfrage erforderlich", "Preis wird vorbereitet",
                      "Angebot erstellt", "An Kunden gesendet", "Vom Kunden geöffnet",
                      "Akzeptiert", "Abgelehnt", "Unterschrift ausstehend", "Unterschrieben",
                      "Vertrag abgeschlossen", "Archiviert"
                    ].map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 w-full lg:w-auto">
                  <button
                    onClick={handleExportCSV}
                    className="bg-white border border-[#C5A880]/30 hover:bg-slate-50 text-slate-700 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-all"
                  >
                    Bexio CSV Export
                  </button>
                  <button
                    onClick={handleRunReminders}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-all border border-[#C5A880]/20"
                  >
                    Erinnerungen Ausführen (Cron)
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50">
                      <th className="p-4">Offerte-Nr.</th>
                      <th className="p-4">Kunde</th>
                      <th className="p-4">Dienstleistung</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Geöffnet?</th>
                      <th className="p-4">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {filteredQuotes.map((q) => (
                      <tr key={q.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-black text-slate-900">{q.reference_number}</td>
                        <td className="p-4">
                          <span className="block font-bold">{q.first_name} {q.last_name}</span>
                          <span className="block text-slate-400 text-xs">{q.postal_code} {q.city}</span>
                        </td>
                        <td className="p-4">
                          <span className="block truncate max-w-[200px] text-slate-700 font-bold">{q.services.join(", ")}</span>
                          <span className="block text-slate-400 text-xs">{q.surface_area} m²</span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-wider ${
                            q.status === "Neu" 
                              ? "bg-red-50 text-red-600 border border-red-100" 
                              : q.status === "Akzeptiert" || q.status === "Vertrag abgeschlossen"
                              ? "bg-green-50 text-green-600 border border-green-100"
                              : "bg-amber-50 text-amber-600 border border-amber-100"
                          }`}>
                            {q.status}
                          </span>
                        </td>
                        <td className="p-4">
                          {q.opened_at ? (
                            <span className="text-xs text-green-600 font-bold">Ja ({new Date(q.opened_at).toLocaleDateString()})</span>
                          ) : (
                            <span className="text-xs text-slate-400">Nein</span>
                          )}
                        </td>
                        <td className="p-4 space-x-2">
                          <button 
                            onClick={() => setSelectedQuote(q)}
                            className="bg-slate-100 hover:bg-[#C5A880] hover:text-white p-2 rounded transition-colors text-slate-700 inline-flex items-center"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteQuote(q.id)}
                            className="bg-slate-100 hover:bg-red-600 hover:text-white p-2 rounded transition-colors text-slate-700 inline-flex items-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: CONTRACTS */}
          {activeTab === "contracts" && (
            <div className="bg-white border border-slate-200 p-8 rounded shadow-sm space-y-6">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Akzeptierte & unterschriebene Verträge</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50">
                      <th className="p-4">Vertragsnummer</th>
                      <th className="p-4">Angebotsnummer</th>
                      <th className="p-4">Kunde / Ansprechpartner</th>
                      <th className="p-4">Unterschriftsdatum</th>
                      <th className="p-4">Hash</th>
                      <th className="p-4">IP-Adresse</th>
                      <th className="p-4">Aktion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {contracts.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/50 text-slate-800">
                        <td className="p-4 font-black text-slate-900">{c.contract_number}</td>
                        <td className="p-4 font-bold text-slate-700">{c.quote_number}</td>
                        <td className="p-4">
                          <span className="block font-bold">{c.signer_name}</span>
                          <span className="block text-xs text-slate-400">{c.signer_company || "Privat"}</span>
                        </td>
                        <td className="p-4 text-xs font-semibold text-slate-600">{new Date(c.created_at).toLocaleString()}</td>
                        <td className="p-4"><code className="text-xs bg-slate-100 px-2 py-1 rounded text-red-600">{c.verification_hash}</code></td>
                        <td className="p-4 text-xs font-bold text-slate-500">{c.ip_address}</td>
                        <td className="p-4">
                          <button 
                            onClick={() => window.open(`${API}/quotes/${c.quote_id}/contract-pdf`, "_blank")}
                            className="bg-slate-100 hover:bg-[#C5A880] hover:text-white px-3 py-1.5 rounded transition-all text-xs font-bold uppercase tracking-wider flex items-center space-x-1"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PAGES CMS (PAGE BUILDER) */}
          {activeTab === "pages" && (
            <div className="bg-white border border-slate-200 p-8 rounded shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Inhaltsverwaltung (CMS-Seiten)</h3>
                <button 
                  onClick={() => {
                    setPageForm({
                      id: "", title: "", slug: "", content: "",
                      published: true, on_startpage: false, menu_position: "footer",
                      seo_title: "", seo_description: "", seo_keywords: ""
                    });
                    setEditingPage(true);
                  }}
                  className="bg-slate-900 hover:bg-slate-850 text-white text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Neue Seite erstellen</span>
                </button>
              </div>

              {/* Page Editor Form */}
              {editingPage && (
                <form onSubmit={handlePageSubmit} className="bg-slate-50 border border-slate-200 p-6 rounded space-y-4 animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Seitentitel</label>
                      <input 
                        type="text" value={pageForm.title}
                        onChange={(e) => setPageForm({ ...pageForm, title: e.target.value })}
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded text-sm" required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">URL Slug</label>
                      <input 
                        type="text" value={pageForm.slug}
                        onChange={(e) => setPageForm({ ...pageForm, slug: e.target.value })}
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded text-sm" required
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Seiteninhalt (HTML / Rich Text)</label>
                      <textarea 
                        rows={6} value={pageForm.content}
                        onChange={(e) => setPageForm({ ...pageForm, content: e.target.value })}
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded text-sm font-mono" required
                      />
                    </div>
                    
                    {/* SEO Block */}
                    <div className="sm:col-span-2 border-t pt-4 border-slate-200 mt-2 space-y-4">
                      <h4 className="text-xs font-black uppercase text-[#C5A880] tracking-widest flex items-center space-x-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>SEO- & Meta-Tag-Verwaltung</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400 uppercase">SEO Title</label>
                          <input 
                            type="text" value={pageForm.seo_title}
                            onChange={(e) => setPageForm({ ...pageForm, seo_title: e.target.value })}
                            className="w-full px-4 py-2 bg-white border rounded text-xs font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400 uppercase">SEO Keywords</label>
                          <input 
                            type="text" value={pageForm.seo_keywords}
                            onChange={(e) => setPageForm({ ...pageForm, seo_keywords: e.target.value })}
                            className="w-full px-4 py-2 bg-white border rounded text-xs font-bold"
                          />
                        </div>
                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-xs font-bold text-slate-400 uppercase">Meta Description</label>
                          <input 
                            type="text" value={pageForm.seo_description}
                            onChange={(e) => setPageForm({ ...pageForm, seo_description: e.target.value })}
                            className="w-full px-4 py-2 bg-white border rounded text-xs font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                    <button type="button" onClick={() => setEditingPage(false)} className="px-4 py-2 border rounded text-xs font-bold uppercase">Abbrechen</button>
                    <button type="submit" className="bg-[#C5A880] text-slate-950 px-5 py-2 text-xs font-bold uppercase rounded hover:bg-[#AF8E5E]">Seite Speichern</button>
                  </div>
                </form>
              )}

              {/* Pages CMS List */}
              <div className="divide-y divide-slate-100 font-semibold text-sm text-slate-800">
                {pages.map(p => (
                  <div key={p.id} className="py-4 flex justify-between items-center hover:bg-slate-50/50 px-2 rounded">
                    <div>
                      <span className="bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-black uppercase px-2 py-0.5 rounded mr-3">/{p.slug}</span>
                      <span className="font-bold">{p.title}</span>
                    </div>
                    <div className="space-x-3">
                      <button 
                        onClick={() => {
                          setPageForm(p);
                          setEditingPage(true);
                        }}
                        className="text-xs font-bold text-slate-500 hover:text-[#C5A880] uppercase"
                      >
                        Bearbeiten
                      </button>
                      <button onClick={() => handleDeletePage(p.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PROJEKTE CMS */}
          {activeTab === "projects" && (
            <div className="bg-white border border-slate-200 p-8 rounded shadow-sm space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Projekte</h3>
                  <p className="text-sm text-slate-500 mt-1">Verwalten Sie Ihre Referenzprojekte, Bildmaterial und Kategorie-Details an einem zentralen Ort.</p>
                </div>
                <button
                  onClick={() => {
                    setProjectForm({
                      id: "",
                      title: "",
                      slug: "",
                      category: "commercial",
                      image_url: "",
                      location: "",
                      duration: "",
                      materials: "",
                      works: "",
                      desc: "",
                      active: true,
                      featured: false,
                      order: 0
                    });
                    setEditingProject(true);
                  }}
                  className="bg-[#C5A880] hover:bg-[#AF8E5E] text-slate-950 text-xs font-black uppercase tracking-[0.2em] px-4 py-2.5 rounded inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Neues Projekt
                </button>
              </div>

              {editingProject && (
                <form onSubmit={handleProjectSubmit} className="bg-slate-50 border border-slate-200 p-6 rounded space-y-6 animate-in fade-in">
                  <div className="grid grid-cols-1 xl:grid-cols-[1fr_0.75fr] gap-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Projekttitel</label>
                          <input
                            type="text"
                            value={projectForm.title}
                            onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                            className="w-full rounded border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">URL Slug</label>
                          <input
                            type="text"
                            value={projectForm.slug}
                            onChange={(e) => setProjectForm({ ...projectForm, slug: e.target.value })}
                            className="w-full rounded border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900"
                            placeholder="luxus-badezimmer"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Kategorie</label>
                          <select
                            value={projectForm.category}
                            onChange={(e) => setProjectForm({ ...projectForm, category: e.target.value })}
                            className="w-full rounded border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900"
                          >
                            <option value="bathroom">Badezimmer</option>
                            <option value="outdoor">Terrasse</option>
                            <option value="flooring">Boden</option>
                            <option value="waterproofing">Abdichtung</option>
                            <option value="commercial">Gewerbe</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Ort</label>
                          <input
                            type="text"
                            value={projectForm.location}
                            onChange={(e) => setProjectForm({ ...projectForm, location: e.target.value })}
                            className="w-full rounded border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900"
                            placeholder="Zürich"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Dauer</label>
                          <input
                            type="text"
                            value={projectForm.duration}
                            onChange={(e) => setProjectForm({ ...projectForm, duration: e.target.value })}
                            className="w-full rounded border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900"
                            placeholder="8 Tage"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Status</label>
                          <div className="flex items-center gap-4">
                            <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                              <input type="checkbox" checked={projectForm.active} onChange={(e) => setProjectForm({ ...projectForm, active: e.target.checked })} /> Aktiv
                            </label>
                            <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                              <input type="checkbox" checked={projectForm.featured} onChange={(e) => setProjectForm({ ...projectForm, featured: e.target.checked })} /> Featured
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Bild-URL</label>
                        <input
                          type="text"
                          value={projectForm.image_url}
                          onChange={(e) => setProjectForm({ ...projectForm, image_url: e.target.value })}
                          className="w-full rounded border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900"
                          placeholder="https://..."
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Materialien</label>
                        <input
                          type="text"
                          value={projectForm.materials}
                          onChange={(e) => setProjectForm({ ...projectForm, materials: e.target.value })}
                          className="w-full rounded border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900"
                          placeholder="Feinsteinzeug, Epoxidharz"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Kurzbeschreibung</label>
                        <textarea
                          rows={6}
                          value={projectForm.desc}
                          onChange={(e) => setProjectForm({ ...projectForm, desc: e.target.value })}
                          className="w-full rounded border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900"
                          placeholder="Beschreiben Sie die Projekt-Highlights."
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Arbeiten / Scope</label>
                        <textarea
                          rows={4}
                          value={projectForm.works}
                          onChange={(e) => setProjectForm({ ...projectForm, works: e.target.value })}
                          className="w-full rounded border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900"
                          placeholder="Untergrundvorbereitung, Abdichtung, Verlegung..."
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Sortierreihenfolge</label>
                        <input
                          type="number"
                          value={projectForm.order}
                          onChange={(e) => setProjectForm({ ...projectForm, order: Number(e.target.value) })}
                          className="w-full rounded border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center pt-4 border-t border-slate-200">
                    <button type="button" onClick={() => setEditingProject(false)} className="px-4 py-2 border rounded text-xs font-bold uppercase">Abbrechen</button>
                    <button type="submit" className="bg-[#C5A880] text-slate-950 px-5 py-2 text-xs font-black uppercase rounded hover:bg-[#AF8E5E]">Projekt speichern</button>
                  </div>
                </form>
              )}

              <div className="grid gap-4">
                {projects.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                    Noch keine Projekte vorhanden. Erstellen Sie ein neues Projekt, um Ihre Referenzen zu präsentieren.
                  </div>
                ) : (
                  projects.map((project) => (
                    <div key={project.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm transition hover:shadow-md">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="max-w-3xl">
                          <div className="flex flex-wrap items-center gap-3 mb-3">
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${project.active ? "text-emerald-700" : "text-slate-500"}`}>{project.active ? "AKTIV" : "INAKTIV"}</span>
                            {project.featured && <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C5A880]">FEATURED</span>}
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Kategorie: {project.category}</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Ordnung: {project.order}</span>
                          </div>
                          <h4 className="text-xl font-black text-slate-900 tracking-tight">{project.title}</h4>
                          <p className="text-sm text-slate-500 mt-2">{project.desc}</p>
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                              <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Ort</span>
                              <span className="font-bold text-slate-800">{project.location || "—"}</span>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                              <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Dauer</span>
                              <span className="font-bold text-slate-800">{project.duration || "—"}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-3 sm:items-end">
                          {project.image_url ? (
                            <img src={project.image_url} alt={project.title} className="h-40 w-72 rounded-3xl object-cover border border-slate-200 shadow-sm" />
                          ) : (
                            <div className="h-40 w-72 rounded-3xl bg-slate-900 text-white grid place-items-center text-sm font-black uppercase tracking-[0.2em]">Kein Bild</div>
                          )}
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => handleEditProject(project)} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-slate-700 hover:border-[#C5A880] hover:text-[#C5A880]">Bearbeiten</button>
                            <button onClick={() => handleDeleteProject(project.id)} className="rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-red-600 hover:bg-red-50">Löschen</button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm text-slate-600">
                        <div>
                          <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Materialien</span>
                          <span>{project.materials || "—"}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Leistungen</span>
                          <span>{project.works || "—"}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: HERO SLIDER CMS */}
          {activeTab === "sliders" && (
            <div className="bg-white border border-slate-200 p-8 rounded shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Hero Banner Slider CMS</h3>
                <button 
                  onClick={() => {
                    setSliderForm({
                      id: "", title: "", subtitle: "", desc: "",
                      image_desktop: "", image_mobile: "",
                      btn1_text: "Kostenlose Offerte", btn1_link: "/quote-request",
                      btn2_text: "Unsere Galerie", btn2_link: "/portfolio",
                      active: true, order: 0, overlay_opacity: 0.4, transition_speed: 5000
                    });
                    setEditingSlider(true);
                  }}
                  className="bg-slate-900 hover:bg-slate-850 text-white text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Neuer Slider</span>
                </button>
              </div>

              {editingSlider && (
                <form onSubmit={handleSliderSubmit} className="bg-slate-50 border border-slate-200 p-6 rounded space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Titel</label>
                      <input 
                        type="text" value={sliderForm.title}
                        onChange={(e) => setSliderForm({ ...sliderForm, title: e.target.value })}
                        className="w-full px-4 py-2 bg-white border rounded text-xs font-bold text-slate-800" required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Subtitle</label>
                      <input 
                        type="text" value={sliderForm.subtitle}
                        onChange={(e) => setSliderForm({ ...sliderForm, subtitle: e.target.value })}
                        className="w-full px-4 py-2 bg-white border rounded text-xs font-bold text-slate-800"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Beschreibung</label>
                      <textarea 
                        rows={2} value={sliderForm.desc}
                        onChange={(e) => setSliderForm({ ...sliderForm, desc: e.target.value })}
                        className="w-full px-4 py-2 bg-white border rounded text-xs font-bold text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Desktop Image URL</label>
                      <input 
                        type="text" value={sliderForm.image_desktop}
                        onChange={(e) => setSliderForm({ ...sliderForm, image_desktop: e.target.value })}
                        className="w-full px-4 py-2 bg-white border rounded text-xs font-bold text-slate-800" required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Mobile Image URL</label>
                      <input 
                        type="text" value={sliderForm.image_mobile}
                        onChange={(e) => setSliderForm({ ...sliderForm, image_mobile: e.target.value })}
                        className="w-full px-4 py-2 bg-white border rounded text-xs font-bold text-slate-800"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                    <button type="button" onClick={() => setEditingSlider(false)} className="px-4 py-2 border rounded text-xs font-bold uppercase">Abbrechen</button>
                    <button type="submit" className="bg-[#C5A880] text-slate-950 px-5 py-2 text-xs font-bold uppercase rounded hover:bg-[#AF8E5E]">Slider Speichern</button>
                  </div>
                </form>
              )}

              {/* Sliders list */}
              <div className="grid grid-cols-1 gap-4 font-semibold text-sm">
                {sliders.map((sl) => (
                  <div key={sl.id} className="p-4 border rounded flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 border-slate-200">
                    <div className="flex items-center space-x-4">
                      <img src={sl.image_desktop} alt="Desktop slide" className="w-16 h-10 object-cover rounded border" />
                      <div>
                        <span className="text-[9px] font-black text-[#C5A880] uppercase tracking-widest block">ORDER {sl.order} | STATUS: {sl.active ? "AKTIF" : "PASIF"}</span>
                        <h4 className="font-bold text-slate-900">{sl.title}</h4>
                      </div>
                    </div>
                    <div className="space-x-2">
                      <button 
                        onClick={() => {
                          setSliderForm(sl);
                          setEditingSlider(true);
                        }}
                        className="text-xs font-bold bg-white border border-slate-200 px-3 py-1.5 rounded text-slate-700 hover:text-[#C5A880]"
                      >
                        Bearbeiten
                      </button>
                      <button onClick={() => handleDeleteSlider(sl.id)} className="bg-white border border-slate-200 p-2 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: SERVICE AREAS */}
          {activeTab === "serviceareas" && (
            <div className="bg-white border border-slate-200 p-8 rounded shadow-sm space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Einsatzgebiete verwalten</h3>
                  <p className="text-xs text-slate-400 font-semibold uppercase mt-1">Regionen, Postleitzahlen, Karten und Homepage-Integration</p>
                </div>
                <button onClick={() => { setServiceAreaForm({ id: "", name: "", slug: "", KANTON: "", city: "", postal_codes: "", short_description: "", description: "", image_url: "", mobile_image_url: "", icon: "MapPin", latitude: 47.3769, longitude: 8.5417, radius: 25, is_active: true, is_featured: false, show_on_homepage: true, sort_order: 0, cta_text: "Offerte anfragen", cta_link: "/quote-request", service_ids: "" }); setEditingServiceArea(true); }} className="bg-slate-900 hover:bg-slate-850 text-white text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded flex items-center space-x-1.5">
                  <Plus className="w-4 h-4" />
                  <span>Neue Region</span>
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-600">Homepage-Block</h4>
                    <p className="text-xs text-slate-500">Titel, CTA und Sichtbarkeit für die Einsatzgebiete auf der Startseite</p>
                  </div>
                  <button onClick={async () => { await axios.put(`${API}/admin/homepage-sections/service-areas`, serviceAreaSection || {}); fetchAllData(); alert("Homepage-Block gespeichert."); }} className="rounded-full bg-[#C5A880] px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-950">Block speichern</button>
                </div>
                {serviceAreaSection && (
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <input value={serviceAreaSection.title || ""} onChange={(e) => setServiceAreaSection({ ...serviceAreaSection, title: e.target.value })} className="rounded border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Titel" />
                    <input value={serviceAreaSection.subtitle || ""} onChange={(e) => setServiceAreaSection({ ...serviceAreaSection, subtitle: e.target.value })} className="rounded border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Untertitel" />
                    <textarea rows={3} value={serviceAreaSection.description || ""} onChange={(e) => setServiceAreaSection({ ...serviceAreaSection, description: e.target.value })} className="md:col-span-2 rounded border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Beschreibung" />
                    <input value={serviceAreaSection.cta_text || ""} onChange={(e) => setServiceAreaSection({ ...serviceAreaSection, cta_text: e.target.value })} className="rounded border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="CTA Text" />
                    <input value={serviceAreaSection.cta_link || ""} onChange={(e) => setServiceAreaSection({ ...serviceAreaSection, cta_link: e.target.value })} className="rounded border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="CTA Link" />
                    <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={Boolean(serviceAreaSection.show_on_homepage)} onChange={(e) => setServiceAreaSection({ ...serviceAreaSection, show_on_homepage: e.target.checked })} /> Startseite anzeigen</label>
                    <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={Boolean(serviceAreaSection.show_map)} onChange={(e) => setServiceAreaSection({ ...serviceAreaSection, show_map: e.target.checked })} /> Karte anzeigen</label>
                  </div>
                )}
              </div>

              {editingServiceArea && (
                <form onSubmit={async (e) => { e.preventDefault(); try { const payload = { ...serviceAreaForm, canton: serviceAreaForm.KANTON, postal_codes: serviceAreaForm.postal_codes.split(",").map((item) => item.trim()).filter(Boolean), service_ids: serviceAreaForm.service_ids.split(",").map((item) => item.trim()).filter(Boolean) }; if (serviceAreaForm.id) { await axios.put(`${API}/admin/service-areas/${serviceAreaForm.id}`, payload); } else { await axios.post(`${API}/admin/service-areas`, payload); } setEditingServiceArea(false); setServiceAreaForm({ id: "", name: "", slug: "", KANTON: "", city: "", postal_codes: "", short_description: "", description: "", image_url: "", mobile_image_url: "", icon: "MapPin", latitude: 47.3769, longitude: 8.5417, radius: 25, is_active: true, is_featured: false, show_on_homepage: true, sort_order: 0, cta_text: "Offerte anfragen", cta_link: "/quote-request", service_ids: "" }); fetchAllData(); } catch (err) { alert("Fehler beim Speichern der Region."); } }} className="rounded-2xl border border-slate-200 bg-slate-50 p-6 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <input value={serviceAreaForm.name} onChange={(e) => setServiceAreaForm({ ...serviceAreaForm, name: e.target.value })} className="rounded border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Region / Name" required />
                    <input value={serviceAreaForm.slug} onChange={(e) => setServiceAreaForm({ ...serviceAreaForm, slug: e.target.value })} className="rounded border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Slug" required />
                    <input value={serviceAreaForm.KANTON} onChange={(e) => setServiceAreaForm({ ...serviceAreaForm, KANTON: e.target.value })} className="rounded border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Kanton" />
                    <input value={serviceAreaForm.city} onChange={(e) => setServiceAreaForm({ ...serviceAreaForm, city: e.target.value })} className="rounded border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Stadt" />
                    <input value={serviceAreaForm.postal_codes} onChange={(e) => setServiceAreaForm({ ...serviceAreaForm, postal_codes: e.target.value })} className="rounded border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="PLZs (kommagetrennt)" />
                    <input value={serviceAreaForm.sort_order} onChange={(e) => setServiceAreaForm({ ...serviceAreaForm, sort_order: Number(e.target.value) })} type="number" className="rounded border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Sortierung" />
                    <textarea rows={3} value={serviceAreaForm.short_description} onChange={(e) => setServiceAreaForm({ ...serviceAreaForm, short_description: e.target.value })} className="rounded border border-slate-200 bg-white px-3 py-2 text-sm md:col-span-2" placeholder="Kurzbeschreibung" />
                    <textarea rows={4} value={serviceAreaForm.description} onChange={(e) => setServiceAreaForm({ ...serviceAreaForm, description: e.target.value })} className="rounded border border-slate-200 bg-white px-3 py-2 text-sm md:col-span-2" placeholder="Beschreibung" />
                    <input value={serviceAreaForm.image_url} onChange={(e) => setServiceAreaForm({ ...serviceAreaForm, image_url: e.target.value })} className="rounded border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Bild URL" />
                    <input value={serviceAreaForm.mobile_image_url} onChange={(e) => setServiceAreaForm({ ...serviceAreaForm, mobile_image_url: e.target.value })} className="rounded border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Mobile Bild URL" />
                    <input value={serviceAreaForm.latitude} onChange={(e) => setServiceAreaForm({ ...serviceAreaForm, latitude: Number(e.target.value) })} type="number" step="0.0001" className="rounded border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Latitude" />
                    <input value={serviceAreaForm.longitude} onChange={(e) => setServiceAreaForm({ ...serviceAreaForm, longitude: Number(e.target.value) })} type="number" step="0.0001" className="rounded border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Longitude" />
                    <input value={serviceAreaForm.radius} onChange={(e) => setServiceAreaForm({ ...serviceAreaForm, radius: Number(e.target.value) })} type="number" className="rounded border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Radius" />
                    <input value={serviceAreaForm.service_ids} onChange={(e) => setServiceAreaForm({ ...serviceAreaForm, service_ids: e.target.value })} className="rounded border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Service IDs (kommagetrennt)" />
                    <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={Boolean(serviceAreaForm.is_active)} onChange={(e) => setServiceAreaForm({ ...serviceAreaForm, is_active: e.target.checked })} /> Aktiv</label>
                    <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={Boolean(serviceAreaForm.show_on_homepage)} onChange={(e) => setServiceAreaForm({ ...serviceAreaForm, show_on_homepage: e.target.checked })} /> Auf Startseite anzeigen</label>
                    <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={Boolean(serviceAreaForm.is_featured)} onChange={(e) => setServiceAreaForm({ ...serviceAreaForm, is_featured: e.target.checked })} /> Featured</label>
                  </div>
                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                    <button type="button" onClick={() => setEditingServiceArea(false)} className="px-4 py-2 border rounded text-xs font-bold uppercase">Abbrechen</button>
                    <button type="submit" className="bg-[#C5A880] text-slate-950 px-5 py-2 text-xs font-bold uppercase rounded hover:bg-[#AF8E5E]">Speichern</button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {serviceAreas.map((area) => (
                  <div key={area.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C5A880]">{area.canton || area.KANTON || "Region"}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${area.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{area.is_active ? "Aktiv" : "Inaktiv"}</span>
                      </div>
                      <h4 className="mt-2 text-lg font-black text-slate-900">{area.name}</h4>
                      <p className="text-sm text-slate-600">{area.short_description || area.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => { setServiceAreaForm({ ...serviceAreaForm, id: area.id, name: area.name, slug: area.slug || "", KANTON: area.canton || area.KANTON || "", city: area.city || "", postal_codes: (area.postal_codes || []).join(", "), short_description: area.short_description || "", description: area.description || "", image_url: area.image_url || "", mobile_image_url: area.mobile_image_url || "", icon: area.icon || "MapPin", latitude: area.latitude || 47.3769, longitude: area.longitude || 8.5417, radius: area.radius || 25, is_active: area.is_active !== false, is_featured: Boolean(area.is_featured), show_on_homepage: area.show_on_homepage !== false, sort_order: area.sort_order || 0, cta_text: area.cta_text || "Offerte anfragen", cta_link: area.cta_link || "/quote-request", service_ids: (area.service_ids || []).join(", ") }); setEditingServiceArea(true); }} className="rounded-full border border-slate-200 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">Bearbeiten</button>
                      <button onClick={async () => { if (!window.confirm("Region löschen?")) return; await axios.delete(`${API}/admin/service-areas/${area.id}`); fetchAllData(); }} className="rounded-full border border-red-200 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-red-600">Löschen</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "team" && (
            <div className="bg-white border border-slate-200 p-8 rounded shadow-sm space-y-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Team verwalten</h3>
                  <p className="text-xs text-slate-400 font-semibold uppercase mt-1">Verwalten Sie unser Premium-Team, Inhaber und aktive Mitarbeiter.</p>
                </div>
                <button
                  onClick={() => {
                    setTeamMemberForm({
                      id: "",
                      name: "",
                      role: "",
                      title: "",
                      bio: "",
                      photo_url: "",
                      email: "",
                      phone: "",
                      social_links: "",
                      is_owner: false,
                      is_active: true,
                      is_featured: false,
                      order: 0
                    });
                    setEditingTeamMember(true);
                  }}
                  className="bg-slate-900 hover:bg-slate-850 text-white text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Neues Team-Mitglied</span>
                </button>
              </div>

              {editingTeamMember && (
                <form onSubmit={handleTeamMemberSubmit} className="rounded-2xl border border-slate-200 bg-slate-50 p-6 space-y-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Name</label>
                      <input
                        type="text"
                        value={teamMemberForm.name}
                        onChange={(e) => setTeamMemberForm({ ...teamMemberForm, name: e.target.value })}
                        className="w-full px-4 py-2 bg-white border rounded text-xs font-bold text-slate-800"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Rolle</label>
                      <input
                        type="text"
                        value={teamMemberForm.role}
                        onChange={(e) => setTeamMemberForm({ ...teamMemberForm, role: e.target.value })}
                        className="w-full px-4 py-2 bg-white border rounded text-xs font-bold text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Titel</label>
                      <input
                        type="text"
                        value={teamMemberForm.title}
                        onChange={(e) => setTeamMemberForm({ ...teamMemberForm, title: e.target.value })}
                        className="w-full px-4 py-2 bg-white border rounded text-xs font-bold text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Foto URL</label>
                      <input
                        type="text"
                        value={teamMemberForm.photo_url}
                        onChange={(e) => setTeamMemberForm({ ...teamMemberForm, photo_url: e.target.value })}
                        className="w-full px-4 py-2 bg-white border rounded text-xs font-bold text-slate-800"
                      />
                      <div className="flex items-center gap-3">
                        <label className="cursor-pointer inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-700 hover:bg-slate-50">
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={handleTeamPhotoUpload}
                            className="hidden"
                          />
                          {teamPhotoUploadLoading ? "Lädt..." : "Foto hochladen"}
                        </label>
                        {teamMemberForm.photo_url && (
                          <a
                            href={teamMemberForm.photo_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C5A880]"
                          >
                            Ansicht
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">E-Mail</label>
                      <input
                        type="email"
                        value={teamMemberForm.email}
                        onChange={(e) => setTeamMemberForm({ ...teamMemberForm, email: e.target.value })}
                        className="w-full px-4 py-2 bg-white border rounded text-xs font-bold text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Telefon</label>
                      <input
                        type="text"
                        value={teamMemberForm.phone}
                        onChange={(e) => setTeamMemberForm({ ...teamMemberForm, phone: e.target.value })}
                        className="w-full px-4 py-2 bg-white border rounded text-xs font-bold text-slate-800"
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Kurzbeschreibung</label>
                      <textarea
                        rows={3}
                        value={teamMemberForm.bio}
                        onChange={(e) => setTeamMemberForm({ ...teamMemberForm, bio: e.target.value })}
                        className="w-full px-4 py-2 bg-white border rounded text-xs font-bold text-slate-800"
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Social Links (kommagetrennt)</label>
                      <input
                        type="text"
                        value={teamMemberForm.social_links}
                        onChange={(e) => setTeamMemberForm({ ...teamMemberForm, social_links: e.target.value })}
                        className="w-full px-4 py-2 bg-white border rounded text-xs font-bold text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Reihenfolge</label>
                      <input
                        type="number"
                        value={teamMemberForm.order}
                        onChange={(e) => setTeamMemberForm({ ...teamMemberForm, order: Number(e.target.value) })}
                        className="w-full px-4 py-2 bg-white border rounded text-xs font-bold text-slate-800"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3 items-end">
                      <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={teamMemberForm.is_owner} onChange={(e) => setTeamMemberForm({ ...teamMemberForm, is_owner: e.target.checked })} /> Inhaber</label>
                      <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={teamMemberForm.is_active} onChange={(e) => setTeamMemberForm({ ...teamMemberForm, is_active: e.target.checked })} /> Aktiv</label>
                      <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={teamMemberForm.is_featured} onChange={(e) => setTeamMemberForm({ ...teamMemberForm, is_featured: e.target.checked })} /> Featured</label>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-end sm:items-center pt-3 border-t border-slate-200">
                    <button type="button" onClick={() => { setEditingTeamMember(false); setTeamMemberForm({ id: "", name: "", role: "", title: "", bio: "", photo_url: "", email: "", phone: "", social_links: "", is_owner: false, is_active: true, is_featured: false, order: 0 }); }} className="px-4 py-2 border rounded text-xs font-bold uppercase">Abbrechen</button>
                    <button type="submit" className="bg-[#C5A880] text-slate-950 px-5 py-2 text-xs font-bold uppercase rounded hover:bg-[#AF8E5E]">Team-Mitglied speichern</button>
                  </div>
                </form>
              )}

              <div className="grid gap-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 grid gap-4 sm:grid-cols-[auto_1fr] items-center">
                    <div className="flex items-center gap-4">
                      {member.photo_url ? (
                        <img src={member.photo_url} alt={member.name} className="w-20 h-20 rounded-2xl object-cover border border-slate-200" />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-slate-900 text-white grid place-items-center text-2xl font-black">{member.name ? member.name[0] : "T"}</div>
                      )}
                      <div>
                        <div className="flex flex-wrap gap-2 items-center mb-2">
                          <span className="text-sm font-black text-slate-900">{member.name}</span>
                          {member.is_owner && <span className="text-[10px] uppercase tracking-[0.2em] bg-[#C5A880]/15 text-[#7A5F32] px-2 py-1 rounded-full">Inhaber</span>}
                          {!member.is_active && <span className="text-[10px] uppercase tracking-[0.2em] bg-slate-100 text-slate-500 px-2 py-1 rounded-full">Inaktiv</span>}
                        </div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{member.role || "Teammitglied"}</p>
                        {member.title && <p className="text-sm text-slate-700 mt-1">{member.title}</p>}
                      </div>
                    </div>
                    <div className="space-y-3 text-sm text-slate-700">
                      <p>{member.bio || "Keine Beschreibung verfügbar."}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                        {member.email && <span>E-Mail: {member.email}</span>}
                        {member.phone && <span>Tel: {member.phone}</span>}
                      </div>
                      {member.social_links && (
                        <p className="text-xs text-slate-500">Links: {member.social_links.join ? member.social_links.join(", ") : member.social_links}</p>
                      )}
                      <div className="flex flex-wrap gap-2 pt-2">
                        <button onClick={() => handleEditTeamMember(member)} className="text-xs font-bold uppercase tracking-[0.2em] text-slate-700 border border-slate-200 rounded px-3 py-2 hover:bg-slate-100">Bearbeiten</button>
                        <button onClick={() => handleDeleteTeamMember(member.id)} className="text-xs font-bold uppercase tracking-[0.2em] text-red-600 border border-red-200 rounded px-3 py-2 hover:bg-red-50">Löschen</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: FAQS & REVIEWS */}
          {activeTab === "faqs" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white border border-slate-200 p-8 rounded shadow-sm">
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                  <h3 className="text-md font-bold uppercase tracking-wider text-slate-500">FAQs</h3>
                  <button onClick={() => setEditingFaq(true)} className="text-xs font-bold text-[#C5A880] hover:text-[#AF8E5E] uppercase flex items-center space-x-1">
                    <Plus className="w-4 h-4" />
                    <span>Hinzufügen</span>
                  </button>
                </div>

                {editingFaq && (
                  <form onSubmit={handleFaqSubmit} className="bg-slate-50 p-5 border border-slate-200 rounded space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">Frage (DE)</label>
                      <input 
                        type="text" value={faqForm.question_de}
                        onChange={(e) => setFaqForm({ ...faqForm, question_de: e.target.value })}
                        className="w-full px-3 py-2 border rounded text-xs font-bold text-slate-800" required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">Antwort (DE)</label>
                      <input 
                        type="text" value={faqForm.answer_de}
                        onChange={(e) => setFaqForm({ ...faqForm, answer_de: e.target.value })}
                        className="w-full px-3 py-2 border rounded text-xs font-bold text-slate-800" required
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button type="button" onClick={() => setEditingFaq(false)} className="px-3 py-1 border text-xs uppercase font-bold rounded">Abbrechen</button>
                      <button type="submit" className="bg-slate-900 text-white px-3 py-1 text-xs uppercase font-bold rounded">Speichern</button>
                    </div>
                  </form>
                )}

                <div className="divide-y divide-slate-100 text-sm font-semibold text-slate-800">
                  {faqs.map(f => (
                    <div key={f.id} className="py-3 flex justify-between items-center">
                      <span>{f.question_de}</span>
                      <button onClick={() => handleDeleteFaq(f.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-md font-bold uppercase tracking-wider text-slate-500 pb-3 border-b border-slate-200">Kundenbewertungen</h3>
                <div className="space-y-4">
                  {reviews.map(r => (
                    <div key={r.id} className="p-4 border rounded bg-slate-50 border-slate-200 flex justify-between items-center gap-4">
                      <div>
                        <div className="flex text-amber-400 space-x-0.5 mb-1">
                          {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                        </div>
                        <p className="text-xs font-bold text-slate-800">&ldquo;{r.comment}&rdquo;</p>
                        <span className="block text-[10px] text-slate-400 font-semibold">{r.name} ({r.location})</span>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <button 
                          onClick={() => handleApproveReview(r.id, !r.approved)}
                          className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded border ${
                            r.approved ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {r.approved ? "Sperren" : "Freigeben"}
                        </button>
                        <button onClick={() => handleDeleteReview(r.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: MESSAGES & SYSTEMS (NACHRICHTEN & CALLS) */}
          {activeTab === "contacts" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white border border-slate-200 p-8 rounded shadow-sm">
              <div className="space-y-6">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 pb-2 border-b border-slate-100">Eingehende Kontaktnachrichten (Tickets)</h3>
                
                <div className="space-y-4">
                  {contacts.map(c => (
                    <div key={c.id} className="p-5 border border-slate-200 rounded bg-slate-50 space-y-3 text-sm font-semibold text-slate-800">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900">{c.name} <code className="text-xs text-[#C5A880]">[{c.ticket_number}]</code></span>
                        <span className="text-[10px] bg-slate-200 text-slate-600 px-2.5 py-0.5 rounded font-black uppercase tracking-wider">{c.status}</span>
                      </div>
                      <p className="text-xs text-slate-400 font-bold">{c.email} | {c.phone}</p>
                      <p className="text-sm italic text-slate-700 font-medium bg-white p-3 border border-slate-100 rounded">&ldquo;{c.message}&rdquo;</p>
                      
                      {/* Nested replies list */}
                      {c.replies && c.replies.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <span className="block text-[9px] font-black uppercase text-slate-400">Nachrichtenverlauf</span>
                          {c.replies.map(rep => (
                            <div key={rep.id} className="bg-slate-100 p-3 rounded text-xs space-y-1">
                              <span className="block font-black text-slate-900">{rep.author} (Mitarbeiter)</span>
                              <p className="font-medium text-slate-600">{rep.message}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="pt-2 flex justify-end">
                        <button 
                          onClick={() => setActiveContactTicket(c)}
                          className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm"
                        >
                          Antwort Schreiben
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Callbacks */}
              <div className="space-y-6 border-l border-slate-100 pl-6">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 pb-2 border-b border-slate-100">Rückrufanfragen (Calls)</h3>
                
                <div className="space-y-4">
                  {callbacks.map(cb => (
                    <div key={cb.id} className="p-5 border border-slate-200 rounded bg-slate-50 space-y-2 text-sm font-semibold text-slate-800">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900">{cb.name}</span>
                        <span className="text-[10px] bg-slate-200 text-slate-600 px-2.5 py-0.5 rounded font-black uppercase tracking-wider">{cb.status}</span>
                      </div>
                      <p className="text-xs text-slate-400 font-bold">Tel: {cb.phone} | Bevorzugt: {cb.preferred_time}</p>
                      <p className="text-xs text-[#C5A880]">Gewünschter Service: {cb.service || "Allgemeine Beratung"}</p>
                      <div className="pt-2 flex flex-wrap gap-2 justify-end">
                        {cb.status !== "Erledigt" && (
                          <button
                            onClick={() => handleUpdateCallbackStatus(cb.id, "Erledigt")}
                            className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em]"
                          >
                            Als Erledigt markieren
                          </button>
                        )}
                        {cb.status !== "Neu" && (
                          <button
                            onClick={() => handleUpdateCallbackStatus(cb.id, "Neu")}
                            className="rounded-full border border-amber-200 text-amber-700 hover:bg-amber-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em]"
                          >
                            Wieder Neu
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: BANNERS */}
          {activeTab === "banners" && (
            <div className="bg-white border border-slate-200 p-8 rounded shadow-sm space-y-6 animate-in fade-in">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Banner Manager</h3>
                  <p className="text-xs text-slate-400 font-semibold uppercase mt-1">Header/Seiten Banner erstellen, bearbeiten und aktivieren</p>
                </div>
                <button
                  onClick={() => {
                    setBannerForm({
                      id: "", name: "", type: "image", location: "header_top",
                      title: "", desc: "", btn_text: "", btn_link: "",
                      image_desktop: "", bg_color: "rgb(17, 20, 24)", active: true
                    });
                    setEditingPageBanner(true);
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Neues Banner</span>
                </button>
              </div>

              {editingBanner && (
                <form onSubmit={handleBannerSubmit} className="rounded-2xl border border-slate-200 bg-slate-50 p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Banner Name</label>
                      <input
                        type="text"
                        value={bannerForm.name}
                        onChange={(e) => setBannerForm({ ...bannerForm, name: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm font-semibold text-slate-800"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Position</label>
                      <select
                        value={bannerForm.location}
                        onChange={(e) => setBannerForm({ ...bannerForm, location: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm font-semibold text-slate-800"
                      >
                        <option value="header_top">Header Top</option>
                        <option value="home_hero">Home Hero</option>
                        <option value="services_top">Services Top</option>
                        <option value="global">Global</option>
                      </select>
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Titel</label>
                      <input
                        type="text"
                        value={bannerForm.title}
                        onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm font-semibold text-slate-800"
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Beschreibung</label>
                      <textarea
                        rows={3}
                        value={bannerForm.desc}
                        onChange={(e) => setBannerForm({ ...bannerForm, desc: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm font-semibold text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Button Text</label>
                      <input
                        type="text"
                        value={bannerForm.btn_text}
                        onChange={(e) => setBannerForm({ ...bannerForm, btn_text: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm font-semibold text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Button Link</label>
                      <input
                        type="text"
                        value={bannerForm.btn_link}
                        onChange={(e) => setBannerForm({ ...bannerForm, btn_link: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm font-semibold text-slate-800"
                        placeholder="/quote-request"
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bild URL</label>
                      <input
                        type="text"
                        value={bannerForm.image_desktop}
                        onChange={(e) => setBannerForm({ ...bannerForm, image_desktop: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm font-semibold text-slate-800"
                        placeholder="/uploads/..."
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2 rounded-xl border border-slate-200 bg-white p-3">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Arka Plan Rengi (RGB)</label>
                      {(() => {
                        const rgb = parseRgbColor(bannerForm.bg_color);
                        return (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">R</span>
                                <input
                                  type="range"
                                  min={0}
                                  max={255}
                                  value={rgb.r}
                                  onChange={(e) => setBannerForm({ ...bannerForm, bg_color: buildRgbColor(e.target.value, rgb.g, rgb.b) })}
                                  className="w-full"
                                />
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">G</span>
                                <input
                                  type="range"
                                  min={0}
                                  max={255}
                                  value={rgb.g}
                                  onChange={(e) => setBannerForm({ ...bannerForm, bg_color: buildRgbColor(rgb.r, e.target.value, rgb.b) })}
                                  className="w-full"
                                />
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">B</span>
                                <input
                                  type="range"
                                  min={0}
                                  max={255}
                                  value={rgb.b}
                                  onChange={(e) => setBannerForm({ ...bannerForm, bg_color: buildRgbColor(rgb.r, rgb.g, e.target.value) })}
                                  className="w-full"
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-20 rounded border border-slate-200" style={{ background: bannerForm.bg_color || "rgb(17, 20, 24)" }} />
                              <span className="text-xs font-bold text-slate-600">{bannerForm.bg_color || "rgb(17, 20, 24)"}</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center justify-center px-4 py-2 rounded bg-slate-900 text-white text-[10px] font-black tracking-[0.2em] uppercase cursor-pointer hover:bg-slate-800 transition-colors">
                      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleBannerImageUpload} className="hidden" />
                      {bannerUploadLoading ? "Wird hochgeladen..." : "Bild hochladen"}
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700 font-semibold">
                      <input
                        type="checkbox"
                        checked={Boolean(bannerForm.active)}
                        onChange={(e) => setBannerForm({ ...bannerForm, active: e.target.checked })}
                      />
                      Aktiv
                    </label>
                  </div>

                  {bannerForm.image_desktop && (
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <img
                        src={bannerForm.image_desktop.startsWith("http") ? bannerForm.image_desktop : `${BACKEND_URL}${bannerForm.image_desktop}`}
                        alt="Banner Preview"
                        className="max-h-40 w-full object-cover rounded"
                      />
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setEditingPageBanner(false)}
                      className="px-4 py-2 border rounded text-xs font-bold uppercase"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="submit"
                      className="bg-[#C5A880] text-slate-950 px-5 py-2 text-xs font-bold uppercase rounded hover:bg-[#AF8E5E]"
                    >
                      Banner speichern
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 gap-4">
                {banners.length === 0 && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500 font-semibold">
                      Noch kein Banner. Fügen Sie mit "Neues Banner" Ihr erstes Banner hinzu.
                    </div>
                )}

                {banners.map((banner) => (
                  <div key={banner.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C5A880]">{banner.location || "global"}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${banner.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                            {banner.active ? "Aktiv" : "Inaktiv"}
                          </span>
                        </div>
                        <h4 className="text-lg font-black text-slate-900 truncate">{banner.name || "Banner"}</h4>
                        <p className="text-sm text-slate-600">{banner.title || "-"}</p>
                        <p className="text-xs text-slate-500">{banner.desc || ""}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            setBannerForm({
                              id: banner.id,
                              name: banner.name || "",
                              type: banner.type || "image",
                              location: banner.location || "header_top",
                              title: banner.title || "",
                              desc: banner.desc || "",
                              btn_text: banner.btn_text || "",
                              btn_link: banner.btn_link || "",
                              image_desktop: banner.image_desktop || "",
                              bg_color: banner.bg_color || "rgb(17, 20, 24)",
                              active: banner.active !== false
                            });
                            setEditingPageBanner(true);
                          }}
                          className="rounded-full border border-slate-200 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-700"
                        >
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => handleDeleteBanner(banner.id)}
                          className="rounded-full border border-red-200 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-red-600"
                        >
                          Löschen
                        </button>
                      </div>
                    </div>

                    {banner.image_desktop && (
                      <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-2">
                        <img
                          src={banner.image_desktop.startsWith("http") ? banner.image_desktop : `${BACKEND_URL}${banner.image_desktop}`}
                          alt={banner.name || "Banner"}
                          className="h-28 w-full object-cover rounded"
                        />
                      </div>
                    )}
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">BG</span>
                      <div className="h-4 w-8 rounded border border-slate-200" style={{ background: banner.bg_color || "rgb(17, 20, 24)" }} />
                      <span className="text-xs font-semibold text-slate-500">{banner.bg_color || "rgb(17, 20, 24)"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: SYSTEM SETTINGS EDITOR */}
          {activeTab === "settings" && (
            <div className="bg-white border border-slate-200 p-8 rounded shadow-sm space-y-8 animate-in fade-in">
              <div className="border-b pb-4">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Zentrale System- & SMTP-Einstellungen</h3>
                  <p className="text-xs text-slate-400 font-semibold uppercase mt-1">Kontakt, UID und E-Mail-Koordination</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* General Settings */}
                <div className="space-y-4 bg-slate-50 p-6 rounded border border-slate-150">
                  <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest border-b pb-2">Firma-Informationen</h4>
                  <div className="space-y-3 font-semibold text-xs uppercase tracking-wider text-slate-400">
                    <div className="space-y-1">
                      <label>Firmenname</label>
                      <input 
                        type="text" value={globalSettings.general.company_name}
                        onChange={(e) => setGlobalSettings({
                          ...globalSettings,
                          general: { ...globalSettings.general, company_name: e.target.value }
                        })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-xs font-bold text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label>UID / MWST-Nummer</label>
                      <input 
                        type="text" value={globalSettings.general.uid}
                        onChange={(e) => setGlobalSettings({
                          ...globalSettings,
                          general: { ...globalSettings.general, uid: e.target.value }
                        })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-xs font-bold text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label>Adresse</label>
                      <input 
                        type="text" value={globalSettings.general.address}
                        onChange={(e) => setGlobalSettings({
                          ...globalSettings,
                          general: { ...globalSettings.general, address: e.target.value }
                        })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-xs font-bold text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-[#C5A880]/20 bg-white p-4 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <h5 className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">Logo-Verwaltung</h5>
                        <p className="text-[11px] text-slate-400 font-medium mt-1">Wählen Sie Text- oder Bildlogo; beides wird im Header und Footer angewendet.</p>
                      </div>
                      <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1">
                        <button
                          type="button"
                          onClick={() => setGlobalSettings({
                            ...globalSettings,
                            general: { ...globalSettings.general, logo_mode: "text" }
                          })}
                          className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${globalSettings.general.logo_mode === "text" ? "bg-slate-900 text-white" : "text-slate-500"}`}
                        >
                          Text
                        </button>
                        <button
                          type="button"
                          onClick={() => setGlobalSettings({
                            ...globalSettings,
                            general: { ...globalSettings.general, logo_mode: "image" }
                          })}
                          className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${globalSettings.general.logo_mode === "image" ? "bg-slate-900 text-white" : "text-slate-500"}`}
                        >
                          Bild
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* TEXT LOGO SECTION */}
                      <div className="space-y-3 bg-slate-50 p-4 rounded border border-slate-150">
                        <h6 className="text-[10px] font-black uppercase tracking-widest text-slate-600 border-b pb-2">Text-Logo Einstellungen</h6>
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Logo-Text (Haupttitel)</label>
                            <input
                              type="text"
                              value={globalSettings.general.logo_text}
                              onChange={(e) => setGlobalSettings({
                                ...globalSettings,
                                general: { ...globalSettings.general, logo_text: e.target.value }
                              })}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-xs font-bold text-slate-800"
                              placeholder="z.B. SWISS PLATTEN"
                            />
                            <p className="text-[9px] text-slate-400 font-medium">Der Haupttitel des Logos, der im Header angezeigt wird.</p>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Logo-Untertitel</label>
                            <input
                              type="text"
                              value={globalSettings.general.logo_subtitle || ""}
                              onChange={(e) => setGlobalSettings({
                                ...globalSettings,
                                general: { ...globalSettings.general, logo_subtitle: e.target.value }
                              })}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-xs font-bold text-slate-800"
                              placeholder="z.B. Atelier d'Architecture"
                            />
                            <p className="text-[9px] text-slate-400 font-medium">Optionaler Untertitel unter dem Haupttext.</p>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Logo-Initiale (Box)</label>
                            <input
                              type="text"
                              value={globalSettings.general.logo_initials || ""}
                              onChange={(e) => setGlobalSettings({
                                ...globalSettings,
                                general: { ...globalSettings.general, logo_initials: e.target.value.toUpperCase().slice(0, 4) }
                              })}
                              maxLength="4"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-xs font-bold text-slate-800 text-center"
                              placeholder="z.B. SP"
                            />
                            <p className="text-[9px] text-slate-400 font-medium">Zeichen in der schwarzen Box (max. 4 Zeichen). Beispiel: SP, PLA, etc.</p>
                          </div>
                        </div>
                      </div>

                      {/* IMAGE LOGO SECTION */}
                      <div className="space-y-3 bg-slate-50 p-4 rounded border border-slate-150">
                        <h6 className="text-[10px] font-black uppercase tracking-widest text-slate-600 border-b pb-2">Bild-Logo Einstellungen</h6>
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Logo Bild-URL</label>
                            <input
                              type="text"
                              value={globalSettings.general.logo_image_url}
                              onChange={(e) => setGlobalSettings({
                                ...globalSettings,
                                general: { ...globalSettings.general, logo_image_url: e.target.value, logo_mode: "image" }
                              })}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-xs font-bold text-slate-800"
                              placeholder="/uploads/logo.png"
                            />
                            <p className="text-[9px] text-slate-400 font-medium">Vollständiger Pfad zur Bilddatei.</p>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Alt-Text des Logos</label>
                            <input
                              type="text"
                              value={globalSettings.general.logo_image_alt}
                              onChange={(e) => setGlobalSettings({
                                ...globalSettings,
                                general: { ...globalSettings.general, logo_image_alt: e.target.value }
                              })}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-xs font-bold text-slate-800"
                              placeholder="z.B. Swiss Platten Logo"
                            />
                            <p className="text-[9px] text-slate-400 font-medium">Beschreibung für Accessibility & SEO.</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Höhe (Height)</label>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={globalSettings.general.logo_image_height || "40"}
                                  onChange={(e) => setGlobalSettings({
                                    ...globalSettings,
                                    general: { ...globalSettings.general, logo_image_height: e.target.value }
                                  })}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-xs font-bold text-slate-800"
                                  placeholder="40"
                                  min="10"
                                  max="200"
                                />
                                <span className="text-[10px] font-bold text-slate-500">px</span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Breite (Width)</label>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={globalSettings.general.logo_image_width || "40"}
                                  onChange={(e) => setGlobalSettings({
                                    ...globalSettings,
                                    general: { ...globalSettings.general, logo_image_width: e.target.value }
                                  })}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-xs font-bold text-slate-800"
                                  placeholder="40"
                                  min="10"
                                  max="200"
                                />
                                <span className="text-[10px] font-bold text-slate-500">px</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <label className="inline-flex items-center justify-center px-4 py-2 rounded bg-slate-900 text-white text-[10px] font-black tracking-[0.2em] uppercase cursor-pointer hover:bg-slate-800 transition-colors">
                        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogoUpload} className="hidden" />
                        {logoUploadLoading ? "Wird hochgeladen..." : "Logo hochladen"}
                      </label>
                      <span className="text-[11px] text-slate-400 font-medium">Sie können PNG, JPG oder WEBP hochladen.</span>
                    </div>

                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
                      <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Vorschau</span>
                      <div className="inline-flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm border border-slate-100">
                        {globalSettings.general.logo_mode === "image" && globalSettings.general.logo_image_url ? (
                          <img
                            src={globalSettings.general.logo_image_url.startsWith("http") ? globalSettings.general.logo_image_url : `${BACKEND_URL}${globalSettings.general.logo_image_url}`}
                            alt={globalSettings.general.logo_image_alt || globalSettings.general.company_name}
                            style={{ 
                              height: `${globalSettings.general.logo_image_height || 40}px`, 
                              width: `${globalSettings.general.logo_image_width || 40}px` 
                            }}
                            className="rounded object-cover border border-slate-200"
                          />
                        ) : (
                          <div 
                            style={{ 
                              width: `${globalSettings.general.logo_image_width || 40}px`, 
                              height: `${globalSettings.general.logo_image_height || 40}px` 
                            }}
                            className="bg-slate-900 border border-[#C5A880]/30 flex items-center justify-center font-black text-[#C5A880] text-xs tracking-tighter rounded-sm"
                          >
                            {globalSettings.general.logo_initials || globalSettings.general.logo_text?.slice(0, 2).toUpperCase() || "CH"}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-sm font-black tracking-wide text-slate-900 leading-none">{globalSettings.general.logo_text || globalSettings.general.company_name}</span>
                          <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mt-0.5">{globalSettings.general.logo_subtitle}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cookie Settings */}
                <div className="md:col-span-2 rounded-[28px] border border-[#C5A880]/20 bg-[linear-gradient(135deg,#111418_0%,#1B1F25_45%,#0F172A_100%)] p-6 sm:p-8 text-white shadow-[0_25px_60px_-30px_rgba(197,168,128,0.55)]">
                  <div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 rounded-full border border-[#C5A880]/25 bg-[#C5A880]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-[#E7D6B8]">
                        <Sparkles className="h-3.5 w-3.5" />
                        Cookie Architecture
                      </div>
                      <h4 className="text-2xl font-black tracking-tight sm:text-3xl">Erweiterte Cookie-Einstellungen</h4>
                      <p className="max-w-3xl text-sm leading-relaxed text-slate-300">
                        Legen Sie hier Standardtexte für Banner, Schaltflächen und Kategorien fest. Änderungen werden in den Systemeinstellungen gespeichert und auf der Cookie-Seite angezeigt.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#E7D6B8] sm:max-w-sm sm:grid-cols-3">
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-center">Consent UX</div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-center">Banner Copy</div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-center">Preference UI</div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    <div className="space-y-4 rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.25em] text-[#E7D6B8]">Cookie-Banner Titel</label>
                          <input
                            type="text"
                            value={globalSettings.cookies.banner_title}
                            onChange={(e) => setGlobalSettings({
                              ...globalSettings,
                              cookies: { ...globalSettings.cookies, banner_title: e.target.value }
                            })}
                            className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-slate-500 focus:border-[#C5A880]"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.25em] text-[#E7D6B8]">Banner-Text</label>
                          <textarea
                            rows={4}
                            value={globalSettings.cookies.banner_text}
                            onChange={(e) => setGlobalSettings({
                              ...globalSettings,
                              cookies: { ...globalSettings.cookies, banner_text: e.target.value }
                            })}
                            className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-slate-500 focus:border-[#C5A880]"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.25em] text-[#E7D6B8]">Akzeptieren-Button</label>
                          <input
                            type="text"
                            value={globalSettings.cookies.accept_text}
                            onChange={(e) => setGlobalSettings({
                              ...globalSettings,
                              cookies: { ...globalSettings.cookies, accept_text: e.target.value }
                            })}
                            className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-[#C5A880]"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.25em] text-[#E7D6B8]">Ablehnen-Button</label>
                          <input
                            type="text"
                            value={globalSettings.cookies.reject_text}
                            onChange={(e) => setGlobalSettings({
                              ...globalSettings,
                              cookies: { ...globalSettings.cookies, reject_text: e.target.value }
                            })}
                            className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-[#C5A880]"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.25em] text-[#E7D6B8]">Einstellungen-Button</label>
                          <input
                            type="text"
                            value={globalSettings.cookies.settings_text}
                            onChange={(e) => setGlobalSettings({
                              ...globalSettings,
                              cookies: { ...globalSettings.cookies, settings_text: e.target.value }
                            })}
                            className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-[#C5A880]"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.25em] text-[#E7D6B8]">Speichern-Button</label>
                          <input
                            type="text"
                            value={globalSettings.cookies.save_text}
                            onChange={(e) => setGlobalSettings({
                              ...globalSettings,
                              cookies: { ...globalSettings.cookies, save_text: e.target.value }
                            })}
                            className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-[#C5A880]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 rounded-[24px] border border-[#C5A880]/20 bg-[#FAF9F6] p-5 text-slate-900">
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm font-black uppercase tracking-[0.25em] text-slate-500">Standart Tercihler</h5>
                        <span className="rounded-full bg-[#C5A880]/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#8C6E47]">Consent Matrix</span>
                      </div>

                      <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <input
                          type="checkbox"
                          checked={Boolean(globalSettings.cookies.enabled)}
                          onChange={(e) => setGlobalSettings({
                            ...globalSettings,
                            cookies: { ...globalSettings.cookies, enabled: e.target.checked }
                          })}
                          className="mt-1 h-4 w-4 accent-[#C5A880]"
                        />
                        <div>
                          <p className="text-sm font-black">Cookie-Modul aktiv</p>
                          <p className="mt-1 text-xs text-slate-500">Wenn diese Einstellung deaktiviert ist, sind Banner und Präferenzen deaktiviert.</p>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <input
                          type="checkbox"
                          checked={Boolean(globalSettings.cookies.show_banner_on_load)}
                          onChange={(e) => setGlobalSettings({
                            ...globalSettings,
                            cookies: { ...globalSettings.cookies, show_banner_on_load: e.target.checked }
                          })}
                          className="mt-1 h-4 w-4 accent-[#C5A880]"
                        />
                        <div>
                          <p className="text-sm font-black">Banner beim ersten Besuch anzeigen</p>
                          <p className="mt-1 text-xs text-slate-500">Der Cookie-Banner wird automatisch beim ersten Besuch der Seite angezeigt.</p>
                        </div>
                      </label>

                      <div className="grid gap-3 md:grid-cols-3">
                        <label className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Erforderlich</span>
                            <input
                              type="checkbox"
                              checked={Boolean(globalSettings.cookies.default_necessary)}
                              onChange={(e) => setGlobalSettings({
                                ...globalSettings,
                                cookies: { ...globalSettings.cookies, default_necessary: e.target.checked }
                              })}
                              className="h-4 w-4 accent-[#C5A880]"
                            />
                          </div>
                          <p className="mt-2 text-xs text-slate-500">{globalSettings.cookies.necessary_desc}</p>
                        </label>
                        <label className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Analyse</span>
                            <input
                              type="checkbox"
                              checked={Boolean(globalSettings.cookies.default_analytics)}
                              onChange={(e) => setGlobalSettings({
                                ...globalSettings,
                                cookies: { ...globalSettings.cookies, default_analytics: e.target.checked }
                              })}
                              className="h-4 w-4 accent-[#C5A880]"
                            />
                          </div>
                          <p className="mt-2 text-xs text-slate-500">{globalSettings.cookies.analytics_desc}</p>
                        </label>
                        <label className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Pazarlama</span>
                            <input
                              type="checkbox"
                              checked={Boolean(globalSettings.cookies.default_marketing)}
                              onChange={(e) => setGlobalSettings({
                                ...globalSettings,
                                cookies: { ...globalSettings.cookies, default_marketing: e.target.checked }
                              })}
                              className="h-4 w-4 accent-[#C5A880]"
                            />
                          </div>
                          <p className="mt-2 text-xs text-slate-500">{globalSettings.cookies.marketing_desc}</p>
                        </label>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Richtlinie Link Text</label>
                          <input
                            type="text"
                            value={globalSettings.cookies.policy_link_text}
                            onChange={(e) => setGlobalSettings({
                              ...globalSettings,
                              cookies: { ...globalSettings.cookies, policy_link_text: e.target.value }
                            })}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#C5A880]"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Richtlinie URL</label>
                          <input
                            type="text"
                            value={globalSettings.cookies.policy_link_url}
                            onChange={(e) => setGlobalSettings({
                              ...globalSettings,
                              cookies: { ...globalSettings.cookies, policy_link_url: e.target.value }
                            })}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#C5A880]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Header & Footer Einstellungen */}
                <div className="space-y-4 bg-slate-50 p-6 rounded border border-slate-150">
                  <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest border-b pb-2">Header & Footer Einstellungen</h4>
                  <div className="space-y-4 font-semibold text-xs uppercase tracking-wider text-slate-400">
                    {/* Header Section */}
                    <div className="bg-white p-4 rounded border border-slate-200">
                      <p className="text-[10px] font-black text-slate-600 mb-3 pb-2 border-b">📱 Header</p>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label>Telefonnummer (Header)</label>
                          <input 
                            type="text" value={globalSettings.general.phone}
                            onChange={(e) => setGlobalSettings({
                              ...globalSettings,
                              general: { ...globalSettings.general, phone: e.target.value }
                            })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-xs font-bold text-slate-800"
                            placeholder="+41 79 123 45 67"
                          />
                        </div>
                        <div className="space-y-1">
                          <label>Öffnungszeiten (Header)</label>
                          <input 
                            type="text" value={globalSettings.general.opening_hours || ""}
                            onChange={(e) => setGlobalSettings({
                              ...globalSettings,
                              general: { ...globalSettings.general, opening_hours: e.target.value }
                            })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-xs font-bold text-slate-800"
                            placeholder="z.B. Mo-Fr: 09:00 - 18:00 | Sa: 10:00 - 16:00"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Footer Section */}
                    <div className="bg-white p-4 rounded border border-slate-200">
                      <p className="text-[10px] font-black text-slate-600 mb-3 pb-2 border-b">🔗 Footer</p>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label>Footer-Beschreibung</label>
                          <textarea 
                            value={globalSettings.general.footer_description || ""}
                            onChange={(e) => setGlobalSettings({
                              ...globalSettings,
                              general: { ...globalSettings.general, footer_description: e.target.value }
                            })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-xs font-bold text-slate-800"
                            placeholder="Kurze Unternehmensbeschreibung für den Footer..."
                            rows="2"
                          />
                        </div>
                        <div className="space-y-1">
                          <label>Copyright-Text</label>
                          <input 
                            type="text" value={globalSettings.general.footer_copyright || ""}
                            onChange={(e) => setGlobalSettings({
                              ...globalSettings,
                              general: { ...globalSettings.general, footer_copyright: e.target.value }
                            })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-xs font-bold text-slate-800"
                            placeholder="© 2024 Swiss Platten GmbH. Alle Rechte vorbehalten."
                          />
                        </div>
                        <div className="space-y-1">
                          <label>Telefon (Footer)</label>
                          <input 
                            type="text" value={globalSettings.general.footer_phone || ""}
                            onChange={(e) => setGlobalSettings({
                              ...globalSettings,
                              general: { ...globalSettings.general, footer_phone: e.target.value }
                            })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-xs font-bold text-slate-800"
                            placeholder="+41 79 123 45 67"
                          />
                        </div>
                        <div className="space-y-1">
                          <label>Öffnungszeiten (Footer)</label>
                          <input 
                            type="text" value={globalSettings.general.footer_opening_hours || ""}
                            onChange={(e) => setGlobalSettings({
                              ...globalSettings,
                              general: { ...globalSettings.general, footer_opening_hours: e.target.value }
                            })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-xs font-bold text-slate-800"
                            placeholder="z.B. Mo-Fr: 09:00 - 18:00 | Sa: 10:00 - 16:00"
                          />
                        </div>
                        <div className="space-y-1">
                          <label>Footer Hintergrundfarbe</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={globalSettings.general.footer_bg_color || "#0f172a"}
                              onChange={(e) => setGlobalSettings({
                                ...globalSettings,
                                general: { ...globalSettings.general, footer_bg_color: e.target.value }
                              })}
                              className="h-12 w-12 rounded border border-slate-200 bg-white p-1"
                            />
                            <input
                              type="text"
                              value={globalSettings.general.footer_bg_color || "#0f172a"}
                              onChange={(e) => setGlobalSettings({
                                ...globalSettings,
                                general: { ...globalSettings.general, footer_bg_color: e.target.value }
                              })}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-xs font-bold text-slate-800"
                              placeholder="#0f172a"
                            />
                          </div>
                          <p className="text-[9px] text-slate-400 font-medium">Footer arka plan rengini seçin ya da hex kodunu girin.</p>
                        </div>
                        <div className="space-y-1">
                          <label>Email (Footer)</label>
                          <input 
                            type="email" value={globalSettings.general.footer_email || ""}
                            onChange={(e) => setGlobalSettings({
                              ...globalSettings,
                              general: { ...globalSettings.general, footer_email: e.target.value }
                            })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-xs font-bold text-slate-800"
                            placeholder="info@plattenlegerallerart.ch"
                          />
                        </div>
                        <div className="space-y-1">
                          <label>Adresse (Footer)</label>
                          <input 
                            type="text" value={globalSettings.general.footer_address || ""}
                            onChange={(e) => setGlobalSettings({
                              ...globalSettings,
                              general: { ...globalSettings.general, footer_address: e.target.value }
                            })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-xs font-bold text-slate-800"
                            placeholder="Bahnhofstrasse 30, 5430 Wettingen"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SMTP configuration */}
                <div className="space-y-4 bg-slate-50 p-6 rounded border border-slate-150">
                  <div className="flex justify-between items-center border-b pb-2 border-slate-200">
                        <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest">SMTP E-Mail-Konfiguration</h4>
                    <button 
                      type="button" onClick={handleTestSmtp} disabled={isTestSmtpLoading}
                      className="text-[9px] font-black uppercase text-[#C5A880] hover:text-[#9B8265] tracking-widest"
                    >
                      {isTestSmtpLoading ? "Verbinden..." : "Verbindung testen"}
                    </button>
                  </div>
                  <div className="space-y-3 font-semibold text-xs uppercase tracking-wider text-slate-400">
                    <div className="space-y-1">
                      <label>SMTP Host</label>
                      <input 
                        type="text" value={globalSettings.smtp.host}
                        onChange={(e) => setGlobalSettings({
                          ...globalSettings,
                          smtp: { ...globalSettings.smtp, host: e.target.value }
                        })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-xs font-bold text-slate-800"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label>SMTP Port</label>
                        <input 
                          type="number" value={globalSettings.smtp.port}
                          onChange={(e) => setGlobalSettings({
                            ...globalSettings,
                            smtp: { ...globalSettings.smtp, port: Number(e.target.value) }
                          })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-xs font-bold text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label>SMTP-Benutzername</label>
                        <input 
                          type="text" value={globalSettings.smtp.username}
                          onChange={(e) => setGlobalSettings({
                            ...globalSettings,
                            smtp: { ...globalSettings.smtp, username: e.target.value }
                          })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-xs font-bold text-slate-800"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label>SMTP-Passwort</label>
                      <input 
                        type="password" value={globalSettings.smtp.password}
                        onChange={(e) => setGlobalSettings({
                          ...globalSettings,
                          smtp: { ...globalSettings.smtp, password: e.target.value }
                        })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-xs font-bold text-slate-800"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label>Sender E-Mail</label>
                        <input 
                          type="email" value={globalSettings.smtp.from_email}
                          onChange={(e) => setGlobalSettings({
                            ...globalSettings,
                            smtp: { ...globalSettings.smtp, from_email: e.target.value }
                          })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-xs font-bold text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label>Absendername</label>
                        <input 
                          type="text" value={globalSettings.smtp.from_name}
                          onChange={(e) => setGlobalSettings({
                            ...globalSettings,
                            smtp: { ...globalSettings.smtp, from_name: e.target.value }
                          })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-xs font-bold text-slate-800"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label>Reply-To</label>
                        <input 
                          type="email" value={globalSettings.smtp.reply_to}
                          onChange={(e) => setGlobalSettings({
                            ...globalSettings,
                            smtp: { ...globalSettings.smtp, reply_to: e.target.value }
                          })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-xs font-bold text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label>Testempfänger</label>
                        <input 
                          type="email" value={globalSettings.general?.email || ""}
                          onChange={(e) => setGlobalSettings({
                            ...globalSettings,
                            general: { ...globalSettings.general, email: e.target.value }
                          })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-xs font-bold text-slate-800"
                        />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-slate-600">
                      <input 
                        type="checkbox" checked={globalSettings.smtp.starttls}
                        onChange={(e) => setGlobalSettings({
                          ...globalSettings,
                          smtp: { ...globalSettings.smtp, starttls: e.target.checked }
                        })}
                        className="h-4 w-4 accent-[#C5A880]"
                      />
                      STARTTLS aktivieren
                    </label>
                    <label className="flex items-center gap-2 text-slate-600">
                      <input 
                        type="checkbox" checked={globalSettings.smtp.active}
                        onChange={(e) => setGlobalSettings({
                          ...globalSettings,
                          smtp: { ...globalSettings.smtp, active: e.target.checked }
                        })}
                        className="h-4 w-4 accent-[#C5A880]"
                      />
                      SMTP aktiv
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t gap-4 items-center">
                {saveMessage && (
                  <div className={`text-xs font-bold px-4 py-2 rounded ${saveMessage.includes("Fehler") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                    {saveMessage}
                  </div>
                )}
                <button 
                  onClick={async () => {
                    setIsSavingSettings(true);
                    setSaveMessage("");
                    try {
                      await axios.put(`${API}/admin/settings`, globalSettings);
                      setSaveMessage("✅ Einstellungen erfolgreich gespeichert!");
                      setTimeout(() => setSaveMessage(""), 3000);
                    } catch (error) {
                      setSaveMessage("❌ Fehler beim Speichern. Bitte versuchen Sie es erneut.");
                      setTimeout(() => setSaveMessage(""), 3000);
                    } finally {
                      setIsSavingSettings(false);
                    }
                  }}
                  disabled={isSavingSettings}
                  className={`font-extrabold text-[10px] tracking-widest uppercase px-6 py-4 rounded-sm flex items-center space-x-2 transition-all ${isSavingSettings ? "bg-slate-400 cursor-not-allowed text-white" : "bg-slate-900 hover:bg-slate-850 text-white"}`}
                >
                  <Save className="w-4 h-4 text-[#C5A880]" />
                  <span>Systemeinstellungen speichern</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 7: AUDIT LOG SYSTEM PROTOCOLS */}
          {activeTab === "audit" && (
            <div className="bg-white border border-slate-200 p-8 rounded shadow-sm space-y-6">
              <div className="border-b pb-4">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Audit-Protokolle (Aktivitätsprotokolle)</h3>
                <p className="text-xs text-slate-400 font-semibold uppercase mt-1">Auflistung aller administrativen und kritischen Aktivitäten im System</p>
              </div>

              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50">
                      <th className="p-3">Zeit</th>
                      <th className="p-3">Benutzer (E-Mail)</th>
                      <th className="p-3">Rolle</th>
                      <th className="p-3">Vorgangsdetails</th>
                      <th className="p-3">IP-Adresse</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="p-3 text-slate-400 font-bold">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="p-3 font-bold text-slate-900">{log.user_email}</td>
                        <td className="p-3"><span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold">{log.role}</span></td>
                        <td className="p-3 font-semibold">{log.action}</td>
                        <td className="p-3 font-bold text-slate-500">{log.ip_address}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Email Logs Section */}
              <div className="border-t pt-8 border-slate-200 space-y-4">
                <h4 className="text-sm font-black uppercase text-slate-400 tracking-widest">E-Mail-Protokolle (Zustellungen)</h4>
                <div className="overflow-x-auto max-h-[300px]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50">
                        <th className="p-3">Zeit</th>
                        <th className="p-3">Empfänger</th>
                        <th className="p-3">Betreff (Subject)</th>
                        <th className="p-3">SMTP Message-ID</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {emailLogs.map((elog, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-3 text-slate-400 font-bold">{new Date(elog.created_at).toLocaleString()}</td>
                          <td className="p-3 font-bold text-slate-900">{elog.recipient}</td>
                          <td className="p-3 font-semibold">{elog.subject}</td>
                          <td className="p-3 font-mono text-[10px] text-slate-500">{elog.message_id || "N/A"}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                              elog.status === "Erfolgreich versendet" 
                                ? "bg-green-50 text-green-600 border border-green-100" 
                                : "bg-red-50 text-red-600 border border-red-100"
                            }`}>
                              {elog.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {emailLogs.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-400 italic font-semibold">Keine E-Mail-Protokolle vorhanden.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* --- DETAIL MODAL FOR ESTIMATE CALCULATOR --- */}
      {selectedQuote && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-[#C5A880]/20 w-full max-w-5xl p-8 sm:p-12 rounded shadow-2xl relative max-h-[92vh] overflow-y-auto space-y-8">
            <button onClick={() => setSelectedQuote(null)} className="absolute top-6 right-6 bg-slate-900 text-white p-2 rounded-full hover:bg-[#C5A880]"><XIcon className="w-5 h-5" /></button>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-6 gap-4">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Offerten-Kalkulator</span>
                <h2 className="text-3xl font-black text-slate-900 leading-none">Referenz: {selectedQuote.reference_number}</h2>
              </div>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => window.open(`${API}/quotes/${selectedQuote.id}/pdf`, "_blank")}
                  className="px-4 py-2 bg-slate-900 border border-slate-900 text-white font-bold hover:bg-slate-850 flex items-center space-x-1.5 text-xs uppercase rounded-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>PDF</span>
                </button>
                <button onClick={() => window.print()} className="px-4 py-2 border text-slate-700 font-bold hover:bg-slate-100 flex items-center space-x-1.5 text-xs uppercase rounded-sm"><Printer className="w-4 h-4" /><span>Drucken</span></button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column info */}
              <div className="lg:col-span-6 space-y-6">
                <div className="bg-slate-50 p-6 rounded border border-slate-150 space-y-4">
                  <div className="flex items-center space-x-2 border-b pb-2">
                    <User className="w-4 h-4 text-[#C5A880]" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Muster-Kundendaten</h4>
                  </div>
                  <div className="text-sm font-semibold text-slate-800 space-y-1">
                    <p className="font-bold text-slate-950">{selectedQuote.first_name} {selectedQuote.last_name}</p>
                    {selectedQuote.company && <p className="text-xs text-[#C5A880] uppercase tracking-wider">{selectedQuote.company}</p>}
                    <p className="text-xs">{selectedQuote.email} | {selectedQuote.phone}</p>
                    <p className="text-xs text-slate-500 mt-2">{selectedQuote.street} {selectedQuote.house_number}, {selectedQuote.postal_code} {selectedQuote.city}</p>
                  </div>
                </div>

                {selectedQuote.ai_summary && (
                  <div className="bg-[#C5A880]/5 border border-[#C5A880]/25 p-6 rounded space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-[#C5A880]" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">AI-Schätzung & SIA-Analysen</h4>
                      </div>
                      <button onClick={() => handleRegenerateSummary(selectedQuote.id)} disabled={regeneratingSummary} className="text-[10px] font-black text-[#C5A880] hover:text-[#9B8265] uppercase">
                        {regeneratingSummary ? "Wird geladen..." : "Neu berechnen"}
                      </button>
                    </div>
                    <p className="text-xs text-slate-750 font-semibold leading-relaxed whitespace-pre-line bg-white p-4 rounded border border-[#C5A880]/15">
                      {selectedQuote.ai_summary}
                    </p>
                  </div>
                )}
              </div>

              {/* Cost Calculator Section */}
              <div className="lg:col-span-6 bg-slate-50 p-6 rounded border border-slate-200 space-y-6">
                <div className="border-b pb-2 flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Schweizer Positions-Kalkulator</h4>
                  <span className="text-[10px] font-bold text-[#C5A880]">Währung: CHF</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-6 space-y-1">
                    <label className="text-[10px] font-black text-slate-400">Position / Leistung</label>
                    <input type="text" placeholder="z.B. Plattenmontage Feinsteinzeug" value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} className="w-full px-3 py-2 bg-white border rounded text-xs" />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-black text-slate-400">Menge</label>
                    <input type="number" value={newItem.qty} onChange={(e) => setNewItem({ ...newItem, qty: Number(e.target.value) })} className="w-full px-3 py-2 bg-white border rounded text-xs" />
                  </div>
                  <div className="sm:col-span-3 space-y-1">
                    <label className="text-[10px] font-black text-slate-400">E-Preis</label>
                    <input type="number" value={newItem.unit_price} onChange={(e) => setNewItem({ ...newItem, unit_price: Number(e.target.value) })} className="w-full px-3 py-2 bg-white border rounded text-xs" />
                  </div>
                  <div className="sm:col-span-1">
                    <button type="button" onClick={handleAddRowItem} className="bg-slate-900 text-white w-full h-8 flex items-center justify-center rounded-sm text-lg font-bold">+</button>
                  </div>
                </div>

                <div className="border rounded bg-white overflow-hidden divide-y divide-slate-100">
                  {quoteItems.length > 0 ? (
                    quoteItems.map((item, idx) => (
                      <div key={idx} className="p-3 text-xs flex justify-between items-center font-bold">
                        <div>
                          <p>{item.description}</p>
                          <p className="text-slate-400 text-[10px]">{item.qty} x CHF {item.unit_price?.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span>CHF {item.total_price?.toFixed(2)}</span>
                          <button onClick={() => handleRemoveRowItem(idx)} className="text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="p-4 text-xs text-slate-400 italic text-center">Keine Positionen.</p>
                  )}
                </div>

                <div className="space-y-3 pt-4 border-t text-xs font-bold">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Rabatt (%)</label>
                      <input type="number" value={discountPct} onChange={(e) => setDiscountPct(Number(e.target.value))} className="w-full px-3 py-2 bg-white border rounded text-xs" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-slate-400 uppercase">MWST (%)</label>
                        <label className="flex items-center space-x-1 cursor-pointer">
                          <input type="checkbox" checked={mwstActive} onChange={(e) => setMwstActive(e.target.checked)} className="w-3 h-3 text-[#C5A880]" />
                          <span className="text-[8px] font-bold text-slate-400">Aktiv</span>
                        </label>
                      </div>
                      <select value={mwstRate} onChange={(e) => setMwstRate(Number(e.target.value))} disabled={!mwstActive} className="w-full px-3 py-2 bg-white border rounded text-xs font-bold text-slate-700">
                        <option value="8.1">8.1% (Standard CH)</option>
                        <option value="2.6">2.6% (Reduziert CH)</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-4 bg-white border rounded space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Zwischensumme:</span><span className="text-slate-900 font-bold">CHF {subtotal.toFixed(2)}</span></div>
                    {discountPct > 0 && <div className="flex justify-between text-red-600"><span>Rabatt ({discountPct}%):</span><span>- CHF {discountAmount.toFixed(2)}</span></div>}
                    <div className="flex justify-between"><span className="text-slate-500">MWST ({mwstRate}%):</span><span className="text-slate-900 font-bold">{mwstActive ? `CHF ${mwstAmount.toFixed(2)}` : "Deaktiviert"}</span></div>
                    <div className="flex justify-between text-base border-t pt-2 font-black"><span className="text-slate-950">GESAMTSUMME:</span><span className="text-[#C5A880]">CHF {grandTotal.toFixed(2)}</span></div>
                  </div>

                  <div className="flex gap-4">
                    <button type="button" onClick={handleSaveQuoteCalculation} className="w-1/2 bg-slate-900 text-white font-bold py-3 text-xs uppercase tracking-widest rounded-sm">Speichern</button>
                    <button type="button" onClick={handleSendQuoteToClient} className="w-1/2 bg-[#C5A880] text-slate-950 font-black py-3 text-xs uppercase tracking-widest rounded-sm">An Kunden Senden</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded p-6 space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">Live Angebots-Nachrichten</p>
                  <h3 className="text-lg font-black text-slate-900">Chatverlauf für Offerte {selectedQuote.reference_number}</h3>
                </div>
              </div>

              <div className="space-y-3 max-h-[28rem] overflow-y-auto border border-slate-100 rounded p-3 bg-slate-50">
                {quoteMessages.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Noch keine Nachrichten vorhanden.</p>
                ) : (
                  quoteMessages.map((message) => (
                    <div key={message.id} className="rounded border border-slate-200 bg-white p-3 shadow-sm">
                      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-slate-500 font-black">
                        <span>{message.sender || "Kunde"}</span>
                        <span>{new Date(message.created_at).toLocaleString()}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-700 whitespace-pre-line">{message.message}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSendChatMessage} className="space-y-3">
                <textarea
                  rows={4}
                  value={newChatMessage}
                  onChange={(e) => setNewChatMessage(e.target.value)}
                  className="w-full rounded border border-slate-200 p-3 text-sm bg-white text-slate-900"
                  placeholder="Neue Nachricht an den Kunden eingeben..."
                />
                <button type="submit" className="w-full bg-[#C5A880] text-slate-950 font-black py-3 text-xs uppercase tracking-widest rounded-sm">Nachricht senden</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- DIRECT EMAIL REPLY DRAWER FOR CONTACT TICKETS --- */}
      {activeContactTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#C5A880]/20 w-full max-w-lg p-8 sm:p-12 rounded shadow-2xl relative space-y-6">
            <button onClick={() => setActiveContactTicket(null)} className="absolute top-6 right-6 bg-slate-900 text-white p-2 rounded-full hover:bg-[#C5A880]"><XIcon className="w-5 h-5" /></button>
            
            <div className="border-b pb-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Atelier Ticketing-Zentrale</span>
              <h3 className="text-xl font-black text-slate-900 tracking-tight mt-1">Antwort an {activeContactTicket.name}</h3>
              <p className="text-xs text-slate-500 font-semibold">Ticket: {activeContactTicket.ticket_number} | E-Mail: {activeContactTicket.email}</p>
            </div>

            <form onSubmit={handleTicketReplySubmit} className="space-y-4 font-semibold text-xs uppercase tracking-widest text-slate-500">
              <div className="space-y-1">
                <label>Betreff (Subject)</label>
                <input 
                  type="text" 
                  value={`RE: Swiss Platten Anfrage [${activeContactTicket.ticket_number}]`}
                  className="w-full px-4 py-2 bg-slate-100 border text-slate-600 rounded text-xs"
                  disabled
                />
              </div>
              <div className="space-y-1">
                <label>Ihre Antwort (HTML-E-Mail Body) *</label>
                <textarea 
                  rows={6}
                  value={contactReplyText}
                  onChange={(e) => setContactReplyText(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800"
                  required
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[10px] tracking-widest uppercase py-3.5 border border-[#C5A880]/30 rounded-sm flex items-center justify-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>Antwort per SMTP senden</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Simple Helper XIcon
function XIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
