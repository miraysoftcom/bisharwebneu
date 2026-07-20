import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLanguage } from "@/components/LanguageContext";
import { Phone, Mail, Clock, MessageSquare, PhoneCall, CheckCircle2, AlertCircle, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { CONTACT } from "@/constants/testIds";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
const API = `${BACKEND_URL}/api`;

export default function Contact() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState(null);
  
  // Contact Message form state
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactMsg, setContactMsg] = useState("");
  const [contactStatus, setContactStatus] = useState(null); // success, error, loading

  // Callback form state
  const [callbackName, setCallbackName] = useState("");
  const [callbackPhone, setCallbackPhone] = useState("");
  const [callbackTime, setCallbackTime] = useState("");
  const [callbackService, setCallbackService] = useState("");
  const [callbackStatus, setCallbackStatus] = useState(null); // success, error, loading

  useEffect(() => {
    axios.get(`${API}/settings`)
      .then((res) => setSettings(res.data?.general || null))
      .catch(() => setSettings(null));
  }, []);

  const contactPhoneDisplay = settings?.phone || "+41 79 123 45 67";
  const contactEmailDisplay = settings?.email || "info@plattenlegerallerart.ch";
  const contactAddressDisplay = settings?.address || "Bahnhofstrasse 30, 5430 Wettingen";
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(contactAddressDisplay)}&output=embed`;

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMsg) {
      setContactStatus({ type: "error", message: "Bitte füllen Sie alle Pflichtfelder aus." });
      return;
    }
    setContactStatus({ type: "loading" });
    try {
      await axios.post(`${API}/contact`, {
        name: contactName,
        email: contactEmail,
        phone: contactPhone,
        message: contactMsg
      });
      setContactStatus({ type: "success", message: t("contact.msgSuccess") });
      setContactName("");
      setContactEmail("");
      setContactPhone("");
      setContactMsg("");
    } catch (err) {
      setContactStatus({ type: "error", message: "Übermittlung fehlgeschlagen. Bitte versuchen Sie es später erneut." });
    }
  };

  const handleCallbackSubmit = async (e) => {
    e.preventDefault();
    if (!callbackName || !callbackPhone) {
      setCallbackStatus({ type: "error", message: "Name und Telefonnummer sind erforderlich." });
      return;
    }
    setCallbackStatus({ type: "loading" });
    try {
      await axios.post(`${API}/callback`, {
        name: callbackName,
        phone: callbackPhone,
        preferred_time: callbackTime,
        service: callbackService
      });
      setCallbackStatus({ type: "success", message: t("contact.callbackSuccess") });
      setCallbackName("");
      setCallbackPhone("");
      setCallbackTime("");
      setCallbackService("");
    } catch (err) {
      setCallbackStatus({ type: "error", message: "Rückrufanfrage fehlgeschlagen. Bitte versuchen Sie es später erneut." });
    }
  };

  return (
    <div className="animate-in fade-in duration-500 bg-[radial-gradient(circle_at_top_left,_#223042_0%,_#111418_45%,_#0A0D10_100%)] py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <section className="rounded-[30px] border border-[#C5A880]/25 bg-white/[0.03] p-6 sm:p-10 backdrop-blur-sm shadow-[0_30px_90px_-45px_rgba(197,168,128,0.5)]">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5 space-y-7">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#C5A880]/30 bg-[#C5A880]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-[#E7D6B8]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Kontakt Concierge
                </span>
                <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#F7F2E7] leading-none">{t("contact.title")}</h1>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">{t("contact.subtitle")}</p>
              </div>

              <div className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 mt-0.5 text-[#C5A880]" />
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black">Telefon</p>
                    <a href={`tel:${contactPhoneDisplay.replace(/\s+/g, "")}`} className="text-base font-bold text-white hover:text-[#E7D6B8] transition-colors">{contactPhoneDisplay}</a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 mt-0.5 text-[#C5A880]" />
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black">E-Mail</p>
                    <a href={`mailto:${contactEmailDisplay}`} className="text-base font-bold text-white hover:text-[#E7D6B8] transition-colors break-all">{contactEmailDisplay}</a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 mt-0.5 text-[#C5A880]" />
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black">Adresse</p>
                    <p className="text-base font-semibold text-slate-100">{contactAddressDisplay}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 mt-0.5 text-[#C5A880]" />
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black">Öffnungszeiten</p>
                    <p className="text-base font-semibold text-slate-100">{t("common.hours_val")}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4">
                <p className="flex items-center gap-2 text-emerald-100 text-xs font-bold uppercase tracking-[0.18em]">
                  <ShieldCheck className="h-4 w-4" />
                  Live Admin Benachrichtigung
                </p>
                <p className="mt-2 text-sm text-emerald-50/90">
                  Rückrufanfragen werden sofort im Admin-Panel angezeigt und automatisch per E-Mail an das Admin-Team gemeldet.
                </p>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <form onSubmit={handleCallbackSubmit} className="rounded-2xl border border-[#C5A880]/25 bg-white/[0.06] p-5 sm:p-6 space-y-4 shadow-xl shadow-black/20">
                  <div className="flex items-center gap-2">
                    <PhoneCall className="h-5 w-5 text-[#E7D6B8]" />
                    <h3 className="text-lg font-black text-[#F7F2E7]">Rückruf anfordern</h3>
                  </div>
                  <p className="text-xs text-slate-300">{t("contact.callbackDesc")}</p>

                  <input
                    type="text"
                    placeholder={t("contact.name")}
                    value={callbackName}
                    onChange={(e) => setCallbackName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-[#C5A880]"
                  />
                  <input
                    type="tel"
                    placeholder={t("contact.phone")}
                    value={callbackPhone}
                    onChange={(e) => setCallbackPhone(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-[#C5A880]"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder={t("contact.prefTime")}
                      value={callbackTime}
                      onChange={(e) => setCallbackTime(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-[#C5A880]"
                    />
                    <input
                      type="text"
                      placeholder="Service (z. B. Bodenplatten)"
                      value={callbackService}
                      onChange={(e) => setCallbackService(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-[#C5A880]"
                    />
                  </div>

                  {callbackStatus?.type === "success" && (
                    <div className="rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-3 text-xs text-emerald-100 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{callbackStatus.message}</span>
                    </div>
                  )}
                  {callbackStatus?.type === "error" && (
                    <div className="rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-xs text-red-100 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      <span>{callbackStatus.message}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    data-testid={CONTACT.callbackSubmit}
                    disabled={callbackStatus?.type === "loading"}
                    className="w-full rounded-xl bg-[#C5A880] px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-slate-950 transition-colors hover:bg-[#B79664] disabled:opacity-70"
                  >
                    {callbackStatus?.type === "loading" ? t("common.loading") : t("contact.requestCallback")}
                  </button>
                </form>

                <form onSubmit={handleContactSubmit} className="rounded-2xl border border-white/10 bg-black/20 p-5 sm:p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-[#E7D6B8]" />
                    <h3 className="text-lg font-black text-[#F7F2E7]">{t("contact.formTitle")}</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder={`${t("contact.name")} *`}
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-[#C5A880]"
                      required
                    />
                    <input
                      type="email"
                      placeholder={`${t("contact.email")} *`}
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-[#C5A880]"
                      required
                    />
                  </div>

                  <input
                    type="tel"
                    placeholder={t("contact.phone")}
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-[#C5A880]"
                  />

                  <textarea
                    rows={6}
                    placeholder={`${t("contact.message")} *`}
                    value={contactMsg}
                    onChange={(e) => setContactMsg(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-[#C5A880]"
                    required
                  />

                  {contactStatus?.type === "success" && (
                    <div className="rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-3 text-xs text-emerald-100 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{contactStatus.message}</span>
                    </div>
                  )}
                  {contactStatus?.type === "error" && (
                    <div className="rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-xs text-red-100 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      <span>{contactStatus.message}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    data-testid={CONTACT.formSubmit}
                    disabled={contactStatus?.type === "loading"}
                    className="w-full rounded-xl border border-[#C5A880]/30 bg-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-[#F7F2E7] transition-colors hover:bg-white/20 disabled:opacity-70"
                  >
                    {contactStatus?.type === "loading" ? t("common.loading") : t("contact.sendMsg")}
                  </button>
                </form>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                <div className="h-[320px] sm:h-[360px] bg-slate-900">
                  <iframe
                    title="Plattenleger aller Art Standort"
                    src={mapSrc}
                    className="h-full w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <div className="border-t border-white/10 px-4 py-3 text-xs font-semibold text-slate-300">
                  Standort: {contactAddressDisplay}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
