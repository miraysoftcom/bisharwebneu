import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageContext";
import { Phone, Mail, Clock, MapPin, Shield, Sparkles } from "lucide-react";
import axios from "axios";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const API = `${BACKEND_URL}/api`;

export default function CustomFooter() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    axios.get(`${API}/settings`)
      .then(res => {
        if (res.data && res.data.general) {
          setSettings(res.data.general);
        }
      })
      .catch(err => console.error("Error loading settings for footer:", err));
  }, []);

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getCompanyName = () => settings?.company_name || "Swiss Platten GmbH";
  const getAddress = () => settings?.footer_address || settings?.address || "Bahnhofstrasse 30, 5430 Wettingen";
  const getPhone = () => settings?.footer_phone || settings?.phone || "+41 79 123 45 67";
  const getEmail = () => settings?.footer_email || settings?.email || "info@plattenlegerallerart.ch";
  const getUid = () => settings?.uid || "CHE-123.456.789 MWST";
  const getDescription = () => settings?.footer_description || "Ihr zertifizierter Schweizer Meisterbetrieb für exklusive Plattenlegearbeiten, präzise Bodenschleiftechnik und langlebige Spezialabdichtungen. Handwerk auf höchstem Niveau.";
  const getCopyright = () => settings?.footer_copyright || `© 2024 ${settings?.company_name || "Swiss Platten GmbH"}. Alle Rechte vorbehalten.`;
  const getOpeningHours = () => settings?.footer_opening_hours || settings?.opening_hours || "Mo-Fr: 09:00 - 18:00 | Sa: 10:00 - 16:00";
  const getFooterBgColor = () => settings?.footer_bg_color || "#0f172a";
  const getLogoMode = () => settings?.logo_mode || "text";
  const getLogoText = () => settings?.logo_text || settings?.site_name || settings?.company_name || "Swiss Platten";
  const getLogoSubtitle = () => settings?.logo_subtitle || "Boden & Abdichtung";
  const getLogoImage = () => {
    if (!settings?.logo_image_url) return "";
    return settings.logo_image_url.startsWith("http") ? settings.logo_image_url : `${BACKEND_URL}${settings.logo_image_url}`;
  };

  return (
    <footer className="text-slate-300 border-t border-[#C5A880]/15 transition-all duration-300" style={{ backgroundColor: getFooterBgColor() }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Col */}
          <div className="space-y-6">
            <Link href="/" onClick={handleScrollTop} className="flex items-center space-x-3 group">
              {getLogoMode() === "image" && getLogoImage() ? (
                <>
                  <img
                    src={getLogoImage()}
                    alt={settings?.logo_image_alt || getLogoText()}
                    className="h-10 w-10 rounded-lg object-cover border border-[#C5A880]/30 bg-slate-950"
                  />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-lg font-black tracking-tight text-white leading-none group-hover:text-[#C5A880] transition-colors">
                      {getLogoText()}
                    </span>
                    <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase truncate">
                      {getLogoSubtitle()}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 bg-slate-850 border border-[#C5A880]/30 flex items-center justify-center font-black text-[#C5A880] text-[10px] tracking-tighter rounded-sm">
                    {String(getLogoText()).slice(0, 2).toUpperCase() || "CH"}
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-lg font-black tracking-tight text-white leading-none group-hover:text-[#C5A880] transition-colors">
                      {getLogoText()}
                    </span>
                    <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase truncate">
                      {getLogoSubtitle()}
                    </span>
                  </div>
                </>
              )}
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed font-semibold">
              {getDescription()}
            </p>
            <div className="flex space-x-3">
              <span className="text-[10px] font-bold tracking-wider bg-slate-950 text-[#C5A880] border border-[#C5A880]/20 px-3 py-1.5 uppercase rounded-sm">
                SIA CERTIFIED
              </span>
              <span className="text-[10px] font-bold tracking-wider bg-slate-950 text-slate-300 border border-slate-800 px-3 py-1.5 uppercase rounded-sm">
                100% GARANTIE
              </span>
            </div>
          </div>

          {/* Quick Services Links */}
          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white border-l-2 border-[#C5A880] pl-3">
              {t("nav.services")}
            </h4>
            <ul className="space-y-3 text-sm font-bold">
              <li>
                <Link href="/services" onClick={handleScrollTop} className="hover:text-[#C5A880] transition-colors">
                  Bodenplatten montieren
                </Link>
              </li>
              <li>
                <Link href="/services" onClick={handleScrollTop} className="hover:text-[#C5A880] transition-colors">
                  Duschen & Nassbereiche
                </Link>
              </li>
              <li>
                <Link href="/services" onClick={handleScrollTop} className="hover:text-[#C5A880] transition-colors">
                  Bodenschleifen & Spachteln
                </Link>
              </li>
              <li>
                <Link href="/services" onClick={handleScrollTop} className="hover:text-[#C5A880] transition-colors">
                  Spezialabdichtungen
                </Link>
              </li>
              <li>
                <Link href="/services" onClick={handleScrollTop} className="hover:text-[#C5A880] transition-colors">
                  Fugenarbeiten aller Art
                </Link>
              </li>
            </ul>
          </div>

          {/* Service Areas */}
          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white border-l-2 border-[#C5A880] pl-3">
              {t("contact.serviceAreas")}
            </h4>
            <p className="text-xs text-slate-400 font-semibold">
              Wir sind ausschließlich in folgenden Schweizer Regionen tätig:
            </p>
            <ul className="space-y-3 text-sm font-bold text-slate-300">
              <li className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-[#C5A880]" />
                <span>Zürich & Agglomeration</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-[#C5A880]" />
                <span>Aarau Stadt</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-[#C5A880]" />
                <span>Kanton Aargau</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-[#C5A880]" />
                <span>Olten & Gösgen</span>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white border-l-2 border-[#C5A880] pl-3">
              {t("nav.contact")}
            </h4>
            <ul className="space-y-4 text-sm font-bold">
              <li className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-[#C5A880] mt-0.5 shrink-0" />
                <div>
                  <span className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">TELEFON</span>
                  <a href={`tel:${getPhone()}`} className="text-white hover:text-[#C5A880] transition-colors">
                    {getPhone()}
                  </a>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-[#C5A880] mt-0.5 shrink-0" />
                <div>
                  <span className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">E-MAIL</span>
                  <a href={`mailto:${getEmail()}`} className="text-white hover:text-[#C5A880] transition-colors">
                    {getEmail()}
                  </a>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-[#C5A880] mt-0.5 shrink-0" />
                <div>
                  <span className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">ADRESSE</span>
                  <span className="text-slate-400 font-semibold">{getAddress()}</span>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-[#C5A880] mt-0.5 shrink-0" />
                <div>
                  <span className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">ÖFFNUNGSZEITEN</span>
                  <span className="text-slate-400 font-semibold">{getOpeningHours()}</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>{getCopyright()} UID: {getUid()}</p>
          <div className="flex space-x-6">
            <Link href="/impressum" onClick={handleScrollTop} className="hover:text-[#C5A880] transition-colors">
              Impressum
            </Link>
            <Link href="/datenschutz" onClick={handleScrollTop} className="hover:text-[#C5A880] transition-colors">
              Datenschutz
            </Link>
            <Link href="/agb" onClick={handleScrollTop} className="hover:text-[#C5A880] transition-colors">
              AGB
            </Link>
            <Link href="/cookie-einstellungen" onClick={handleScrollTop} className="hover:text-[#C5A880] transition-colors">
              Cookie-Einstellungen
            </Link>
            <Link href="/admin" onClick={handleScrollTop} className="hover:text-[#C5A880] transition-colors font-semibold text-slate-400 flex items-center space-x-1">
              <Shield className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Admin</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
