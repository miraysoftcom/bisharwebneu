import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useLanguage } from "@/components/LanguageContext";
import { useAuth } from "@/components/AuthContext";
import { Menu, X, Phone, Shield, Sparkles, ArrowRight } from "lucide-react";
import { NAV } from "@/constants/testIds";
import axios from "axios";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const API = `${BACKEND_URL}/api`;

export default function GlassHeader() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [headerBanners, setHeaderBanners] = useState([]);
  const [globalBanners, setGlobalBanners] = useState([]);
  const [siteSettings, setSiteSettings] = useState(null);
  const router = useRouter();
  const location = router.asPath.split("?")[0];

  useEffect(() => {
    // Fetch active banners
    axios.get(`${API}/banners`)
      .then(res => {
        const list = res.data || [];
        setHeaderBanners(list.filter((b) => b.location === "header_top" && b.active));
        setGlobalBanners(list.filter((b) => b.location === "global" && b.active));
      })
      .catch(err => console.error("Banners load error:", err));

    axios.get(`${API}/settings`)
      .then(res => setSiteSettings(res.data?.general || null))
      .catch(err => console.error("Settings load error:", err));
  }, []);

  const renderLogo = (compact = false) => {
    const logoMode = siteSettings?.logo_mode || "text";
    const logoUrl = siteSettings?.logo_image_url;
    const logoSrc = logoUrl?.startsWith("http") ? logoUrl : logoUrl ? `${BACKEND_URL}${logoUrl}` : "";
    const logoText = siteSettings?.logo_text || siteSettings?.site_name || siteSettings?.company_name || "SWISS PLATTEN";
    const subtitle = siteSettings?.logo_subtitle || "Atelier d'Architecture";
    const logoInitials = siteSettings?.logo_initials || logoText.slice(0, 2).toUpperCase();
    const logoHeight = siteSettings?.logo_image_height || (compact ? "10" : "11");
    const logoWidth = siteSettings?.logo_image_width || (compact ? "10" : "11");
    const logoMaxWidth = compact ? "max-w-[16rem]" : "max-w-[20rem]";

    if (logoMode === "image" && logoSrc) {
      return (
        <div className={`flex items-center gap-3 flex-shrink-0 ${logoMaxWidth}`}>
          <img
            src={logoSrc}
            alt={siteSettings?.logo_image_alt || logoText}
            style={{ height: `${logoHeight}px`, width: `${logoWidth}px` }}
            className="rounded-lg object-cover border border-[#C5A880]/25 bg-white shadow-sm shrink-0"
          />
          <div className="flex min-w-0 flex-col">
            <span className={`truncate whitespace-nowrap font-black tracking-widest text-[#111418] leading-none ${compact ? "text-sm" : "text-base"}`}>
              {logoText}
            </span>
            <span className="truncate whitespace-nowrap text-[9px] font-extrabold tracking-[0.25em] text-[#C5A880] uppercase mt-0.5">
              {subtitle}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className={`flex items-center gap-3 flex-shrink-0 ${logoMaxWidth}`}>
        <div 
          style={{ height: `${logoHeight}px`, width: `${logoWidth}px` }}
          className="bg-gradient-to-br from-[#1E2328] to-[#111418] border border-[#C5A880]/30 flex items-center justify-center font-black text-[#C5A880] tracking-tighter shadow-xl rounded-sm shrink-0"
        >
          <span style={{ fontSize: `${Math.max(10, Math.min(logoHeight, logoWidth) / 2)}px` }}>
            {logoInitials || "CH"}
          </span>
        </div>
        <div className="flex min-w-0 flex-col">
          <span className={`truncate whitespace-nowrap font-black tracking-widest text-[#111418] leading-none group-hover:text-[#C5A880] transition-colors ${compact ? "text-sm" : "text-base"}`}>
            {logoText}
          </span>
          <span className="truncate whitespace-nowrap text-[9px] font-extrabold tracking-[0.25em] text-[#C5A880] uppercase mt-0.5">
            {subtitle}
          </span>
        </div>
      </div>
    );
  };

  const navItems = [
    { name: t("nav.home"), path: "/" },
    { name: t("nav.services"), path: "/services" },
    { name: t("nav.portfolio"), path: "/portfolio" },
    { name: t("nav.team"), path: "/team" },
    { name: t("nav.areas"), path: "/areas" },
    { name: t("nav.faq"), path: "/faq" },
    { name: t("nav.contact"), path: "/contact" },
  ];

  return (
    <div className="w-full">
      {/* Global banners */}
      {globalBanners.map((banner) => (
        <div
          key={banner.id}
          className="text-white text-[11px] font-black tracking-widest uppercase py-3.5 px-6 text-center border-b border-white/10 flex items-center justify-center space-x-3"
          style={{ background: banner.bg_color || "#0f172a" }}
        >
          <Sparkles className="w-4 h-4 text-[#C5A880] animate-pulse" />
          <span>{banner.title} {banner.desc ? `- ${banner.desc}` : ""}</span>
          {banner.btn_text && (
            <a
              href={banner.btn_link || "/quote-request"}
              className="bg-[#C5A880] text-slate-950 px-3 py-1 font-black text-[9px] rounded-sm hover:bg-[#AF8E5E] transition-colors ml-4 uppercase"
            >
              {banner.btn_text}
            </a>
          )}
        </div>
      ))}

      {/* Dynamic Header Top Banner */}
      {headerBanners.map((banner) => (
        <div
          key={banner.id}
          className="text-[#C5A880] text-[11px] font-black tracking-widest uppercase py-3.5 px-6 text-center border-b border-[#C5A880]/20 flex items-center justify-center space-x-3"
          style={{ background: banner.bg_color || "#0f172a" }}
        >
          <Sparkles className="w-4 h-4 text-[#C5A880] animate-pulse" />
          <span>{banner.title} {banner.desc ? `- ${banner.desc}` : ""}</span>
          {banner.btn_text && (
            <a
              href={banner.btn_link || "/quote-request"}
              className="bg-[#C5A880] text-slate-950 px-3 py-1 font-black text-[9px] rounded-sm hover:bg-[#AF8E5E] transition-colors ml-4 uppercase"
            >
              {banner.btn_text}
            </a>
          )}
        </div>
      ))}

      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/80 border-b border-[#C5A880]/15 transition-all duration-300">
        {/* Upper bar with thin design */}
        <div className="hidden sm:flex bg-[#111418] text-slate-300 text-xs py-2 px-6 justify-between items-center border-b border-[#C5A880]/10">
          <div className="flex items-center space-x-6 font-medium">
            <a href={`tel:${siteSettings?.phone || '+41791234567'}`} className="flex items-center space-x-1.5 hover:text-[#C5A880] transition-colors">
              <Phone className="w-3.5 h-3.5 text-[#C5A880]" />
              <span className="tracking-wide">{siteSettings?.phone || '+41 79 123 45 67'}</span>
            </a>
            <span className="text-[#C5A880]/20">|</span>
            <span className="tracking-wide text-slate-400">{siteSettings?.opening_hours || t("common.hours_val")}</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="border border-[#C5A880]/30 text-[#C5A880] px-2.5 py-0.5 text-[9px] font-bold tracking-widest uppercase rounded-sm">
              SIA CERTIFIED CHAMPION
            </span>
            {user && (
              <Link href="/admin" data-testid={NAV.adminDashboard} className="flex items-center space-x-1 hover:text-[#C5A880] transition-colors font-bold tracking-wider text-[10px] uppercase">
                <Shield className="w-3 h-3 text-[#C5A880]" />
                <span>Admin</span>
              </Link>
            )}
          </div>
        </div>

        {/* Main Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-22 py-4 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="group min-w-0 flex-shrink-0">
            {renderLogo(true)}
          </Link>

          {/* Desktop Links */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                data-testid={item.path === "/" ? NAV.home : `nav-${item.path.slice(1)}-link`}
                className={`text-[11px] font-black uppercase tracking-widest transition-colors hover:text-[#C5A880] py-2 whitespace-nowrap ${
                  location === item.path ? "text-[#C5A880] border-b border-[#C5A880]" : "text-slate-800"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden lg:flex items-center space-x-6">
            <button
              onClick={() => router.push("/quote-request")}
              data-testid={NAV.quoteCta}
              className="group inline-flex items-center gap-3 rounded-full border border-[#C5A880]/30 bg-[linear-gradient(135deg,#111418_0%,#1C222A_55%,#0F172A_100%)] px-5 py-3 text-left text-white shadow-[0_12px_30px_-15px_rgba(0,0,0,0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#C5A880]/50 hover:shadow-[0_18px_45px_-18px_rgba(197,168,128,0.45)] active:scale-[0.98]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#C5A880]/25 bg-white/5 text-[#C5A880] transition-transform duration-300 group-hover:scale-105">
                <ArrowRight className="h-4 w-4" />
              </span>
              <span className="flex flex-col items-start leading-tight">
                <span className="text-[9px] font-black uppercase tracking-[0.35em] text-[#C5A880]/80">Schnell & diskret</span>
                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-white">{t("nav.requestQuote")}</span>
              </span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center space-x-4">
            <Link href="/quote-request" className="hidden sm:inline-flex items-center gap-2 rounded-full border border-[#C5A880]/25 bg-[linear-gradient(135deg,#111418_0%,#1C222A_55%,#0F172A_100%)] px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-white shadow-[0_12px_30px_-15px_rgba(0,0,0,0.55)]">
              <ArrowRight className="h-4 w-4 text-[#C5A880]" />
              <span>{t("nav.requestQuote")}</span>
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-slate-800 hover:text-[#C5A880] focus:outline-none"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Navigation */}
        {mobileOpen && (
          <div className="lg:hidden bg-[#FAF9F6] border-b border-[#C5A880]/15 py-6 px-6 animate-in slide-in-from-top duration-300">
            <nav className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`text-xs font-black tracking-widest uppercase transition-colors ${
                    location === item.path ? "text-[#C5A880]" : "text-slate-800"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              {user && (
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="text-xs font-black tracking-widest uppercase text-slate-800 flex items-center space-x-1"
                >
                  <Shield className="w-4 h-4 text-[#C5A880]" />
                  <span>Admin</span>
                </Link>
              )}
              <button
                onClick={() => {
                  setMobileOpen(false);
                  router.push("/quote-request");
                }}
                className="w-full text-center bg-slate-900 text-white font-extrabold text-[10px] tracking-widest uppercase py-3.5 border border-[#C5A880]/30 rounded-full"
              >
                {t("nav.requestQuote")}
              </button>
            </nav>
          </div>
        )}
      </header>
    </div>
  );
}
