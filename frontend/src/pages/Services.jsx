import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/components/LanguageContext";
import { Shield, Check, ArrowRight, CornerDownRight, Layers, Paintbrush, Flame, Hammer, Sparkles } from "lucide-react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
const API = `${BACKEND_URL}/api`;

export default function Services() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("bodenplatten");
  const [serviceTopBanners, setServiceTopBanners] = useState([]);

  React.useEffect(() => {
    axios.get(`${API}/banners`)
      .then((res) => {
        const list = res.data || [];
        setServiceTopBanners(list.filter((b) => b.location === "services_top" && b.active));
      })
      .catch((err) => console.error("Services banner load error:", err));
  }, []);

  // All 12 services as specified in the instructions
  const servicesKeys = [
    "plattenspitzen",
    "bodenschleifen",
    "bodengrundierung",
    "bodenplatten",
    "duschen",
    "wandplatten",
    "wandboden",
    "kratzgrundierung",
    "spezialabdichtungen",
    "fassadenarbeiten",
    "fugenarbeiten",
    "renovationen"
  ];

  const getServiceIcon = (key) => {
    switch (key) {
      case "bodenplatten":
      case "wandplatten":
      case "wandboden":
        return <Layers className="w-6 h-6 text-red-600" />;
      case "spezialabdichtungen":
      case "duschen":
        return <Flame className="w-6 h-6 text-red-600" />;
      case "bodenschleifen":
      case "plattenspitzen":
        return <Paintbrush className="w-6 h-6 text-red-600" />;
      default:
        return <Hammer className="w-6 h-6 text-red-600" />;
    }
  };

  const handleRequestQuote = (serviceName) => {
    // Pre-select service in quote system by storing in state or session
    sessionStorage.setItem("preselected_service", serviceName);
    navigate("/quote-request");
  };

  return (
    <div className="py-16 bg-[radial-gradient(circle_at_top,#ffffff_0%,#FAF9F6_36%,#F4F0E8_100%)] animate-in fade-in duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {serviceTopBanners.map((banner) => (
          <div
            key={banner.id}
            className="mb-8 rounded-2xl px-6 py-4 text-white shadow-lg border border-white/10"
            style={{ background: banner.bg_color || "#1f2937" }}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] font-black text-[#E7D6B8]">SERVICES TOP BANNER</p>
                <h3 className="text-lg font-black tracking-tight">{banner.title}</h3>
                {banner.desc && <p className="text-sm text-slate-100/90 mt-1">{banner.desc}</p>}
              </div>
              {banner.btn_text && (
                <button
                  onClick={() => navigate(banner.btn_link || "/quote-request")}
                  className="rounded-full bg-white/15 border border-white/20 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/25"
                >
                  {banner.btn_text}
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Header */}
        <div className="mb-14 overflow-hidden rounded-[32px] border border-[#C5A880]/15 bg-[linear-gradient(135deg,#111418_0%,#1B1F25_48%,#0F172A_100%)] px-6 py-8 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.6)] sm:px-10 sm:py-10">
          <div className="max-w-3xl space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#C5A880]/25 bg-[#C5A880]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.35em] text-[#E7D6B8]">
              <Sparkles className="h-3.5 w-3.5" />
              Expertise & Leidenschaft
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-none font-black text-white">
              {t("services.title")}
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              {t("services.subtitle")}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-200">SIA Standard</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-200">Premium Beratung</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-200">Verbindliche Offerten</span>
            </div>
          </div>
        </div>

        {/* Dynamic Sidebar + Content layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Sidebar for 12 Services selection */}
          <div className="lg:col-span-4 overflow-hidden rounded-[28px] border border-[#C5A880]/15 bg-white/80 shadow-[0_20px_60px_-35px_rgba(0,0,0,0.35)] backdrop-blur-sm divide-y divide-slate-100/80">
            {servicesKeys.map((key) => {
              const service = t(`services.list.${key}`);
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`w-full text-left px-6 py-5 transition-all duration-300 flex items-center justify-between group ${
                    isActive ? "bg-[linear-gradient(135deg,#111418_0%,#1B1F25_100%)] text-white font-bold" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`shrink-0 rounded-2xl p-2 border ${isActive ? "border-[#C5A880]/30 bg-white/5 text-[#C5A880]" : "border-slate-200 bg-slate-50 text-slate-400 group-hover:border-[#C5A880]/20 group-hover:text-[#C5A880]"}`}>
                      {getServiceIcon(key)}
                    </div>
                    <span className="text-sm tracking-wide leading-tight">{service.title}</span>
                  </div>
                  <ChevronRightIcon className={`w-4 h-4 transition-all ${isActive ? "text-[#C5A880] translate-x-1" : "text-slate-400 group-hover:text-[#C5A880]"}`} />
                </button>
              );
            })}
          </div>

          {/* Right Content Pane */}
          <div className="lg:col-span-8 overflow-hidden rounded-[28px] border border-[#C5A880]/15 bg-[linear-gradient(180deg,#ffffff_0%,#fbfaf8_100%)] p-8 sm:p-12 shadow-[0_20px_60px_-35px_rgba(0,0,0,0.32)] space-y-8 min-h-[500px] flex flex-col justify-between animate-in fade-in duration-300" key={activeTab}>
            <div className="space-y-6">
              {/* Header inside pane */}
              <div className="flex items-center space-x-4 pb-6 border-b border-slate-200/80">
                <div className="w-14 h-14 bg-[linear-gradient(135deg,#111418_0%,#1B1F25_100%)] text-[#C5A880] flex items-center justify-center rounded-2xl shadow-lg shadow-black/10">
                  {getServiceIcon(activeTab)}
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">
                    {t(`services.list.${activeTab}.title`)}
                  </h2>
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#C5A880] mt-1 block">
                    SWISS BUILD STANDARDS (SIA)
                  </span>
                </div>
              </div>

              {/* Detail explanations */}
              <div className="space-y-4">
                <p className="text-lg font-bold text-slate-800 leading-relaxed">
                  {t(`services.list.${activeTab}.desc`)}
                </p>
                <p className="text-base text-slate-600 leading-relaxed">
                  {t(`services.list.${activeTab}.detail`)}
                </p>
              </div>

              {/* Benefits */}
              <div className="space-y-4 pt-6">
                <h4 className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                  Ihre exklusiven Vorteile bei uns
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {t(`services.list.${activeTab}.benefits`, []).map((benefit, idx) => (
                    <div key={idx} className="flex items-start space-x-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_25px_-20px_rgba(0,0,0,0.35)]">
                      <Check className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <span className="text-sm font-semibold text-slate-700">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="pt-8 border-t border-slate-200 mt-8 flex flex-col sm:flex-row justify-between items-center gap-6 bg-[linear-gradient(135deg,rgba(197,168,128,0.08),rgba(255,255,255,0.8))] p-6 rounded-[24px] border border-[#C5A880]/15">
              <div className="text-center sm:text-left">
                <span className="block text-[10px] font-black text-[#C5A880] uppercase tracking-[0.3em]">Schnell & kostenlos</span>
                <span className="text-sm font-bold text-slate-800">Erhalten Sie ein verbindliches Festpreisangebot</span>
              </div>
              <button
                onClick={() => handleRequestQuote(t(`services.list.${activeTab}.title`))}
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-full border border-[#C5A880]/25 bg-[linear-gradient(135deg,#111418_0%,#1C222A_55%,#0F172A_100%)] px-6 py-4 text-white shadow-[0_18px_45px_-22px_rgba(0,0,0,0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#C5A880]/45 hover:shadow-[0_24px_55px_-24px_rgba(197,168,128,0.45)] active:scale-[0.98]"
              >
                <span className="text-[10px] font-black tracking-[0.22em] uppercase">{t("services.requestCta")}</span>
                <ArrowRight className="w-4 h-4 text-[#C5A880] transition-transform duration-300 group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple Helper Icon component
function ChevronRightIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}
