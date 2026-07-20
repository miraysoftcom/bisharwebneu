import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { ShieldCheck, Cookie, Settings2, Sparkles, X } from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const API = `${BACKEND_URL}/api`;
const STORAGE_KEY = "swiss_platten_cookie_consent";

const DEFAULT_COOKIE_SETTINGS = {
  enabled: true,
  banner_title: "Wir verwenden Cookies mit Stil",
  banner_text:
    "Für ein schnelleres, sichereres und besseres Nutzererlebnis verwenden wir notwendige Cookies sowie optionale Analyse-Cookies nach Ihrer Zustimmung.",
  accept_text: "Alle akzeptieren",
  reject_text: "Nur notwendige",
  settings_text: "Einstellungen",
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
  default_marketing: false,
};

function readStoredConsent() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistConsent(consent) {
  if (typeof window === "undefined") return;
  const serialized = JSON.stringify(consent);
  window.localStorage.setItem(STORAGE_KEY, serialized);
  window.localStorage.setItem(`${STORAGE_KEY}:updated_at`, new Date().toISOString());
  document.cookie = `sp_cookie_consent=${encodeURIComponent(serialized)}; max-age=${60 * 60 * 24 * 365}; path=/; samesite=lax`;
  window.dispatchEvent(new CustomEvent("cookie-consent-changed", { detail: consent }));
}

export default function CookieConsentBanner({ hidden = false }) {
  const [settings, setSettings] = useState(DEFAULT_COOKIE_SETTINGS);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    let mounted = true;

    Promise.all([axios.get(`${API}/settings`).catch(() => null), Promise.resolve(readStoredConsent())])
      .then(([settingsRes, storedConsent]) => {
        if (!mounted) return;

        const cookieSettings = settingsRes?.data?.cookies || {};
        const mergedSettings = { ...DEFAULT_COOKIE_SETTINGS, ...cookieSettings };
        setSettings(mergedSettings);

        const fallbackPreferences = {
          necessary: true,
          analytics: Boolean(mergedSettings.default_analytics),
          marketing: Boolean(mergedSettings.default_marketing),
        };

        if (storedConsent?.preferences) {
          setPreferences({
            necessary: true,
            analytics: Boolean(storedConsent.preferences.analytics),
            marketing: Boolean(storedConsent.preferences.marketing),
          });
        } else {
          setPreferences(fallbackPreferences);
        }

        const shouldOpen =
          mergedSettings.enabled !== false &&
          mergedSettings.show_banner_on_load !== false &&
          !storedConsent;

        setOpen(Boolean(shouldOpen));
        setReady(true);
      })
      .catch(() => {
        if (!mounted) return;
        setReady(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleAcceptAll = () => {
    const consent = {
      status: "accepted",
      accepted_at: new Date().toISOString(),
      preferences: {
        necessary: true,
        analytics: true,
        marketing: true,
      },
    };
    persistConsent(consent);
    setPreferences(consent.preferences);
    setOpen(false);
  };

  const handleAcceptNecessary = () => {
    const consent = {
      status: "necessary_only",
      accepted_at: new Date().toISOString(),
      preferences: {
        necessary: true,
        analytics: false,
        marketing: false,
      },
    };
    persistConsent(consent);
    setPreferences(consent.preferences);
    setOpen(false);
  };

  const handleSavePreferences = () => {
    const consent = {
      status: "custom",
      accepted_at: new Date().toISOString(),
      preferences: {
        necessary: true,
        analytics: Boolean(preferences.analytics),
        marketing: Boolean(preferences.marketing),
      },
    };
    persistConsent(consent);
    setOpen(false);
  };

  if (hidden || !ready || !open) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[80] px-3 pb-3 sm:px-6 sm:pb-6 pointer-events-none">
      <div className="mx-auto max-w-7xl rounded-[28px] border border-[#C5A880]/20 bg-[linear-gradient(135deg,rgba(17,20,24,0.98)_0%,rgba(28,34,42,0.97)_45%,rgba(15,23,42,0.98)_100%)] p-4 shadow-[0_30px_80px_-35px_rgba(0,0,0,0.75)] backdrop-blur-xl text-white pointer-events-auto">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4 flex-1 min-w-0">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#C5A880]/25 bg-white/5 text-[#C5A880] shadow-inner">
                <Cookie className="h-6 w-6" />
              </div>
              <div className="min-w-0 space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#C5A880]/25 bg-[#C5A880]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-[#E7D6B8]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Consent Center
                </div>
                <h2 className="text-xl font-black tracking-tight sm:text-2xl">{settings.banner_title}</h2>
                <p className="max-w-3xl text-sm leading-relaxed text-slate-300">{settings.banner_text}</p>
              </div>
            </div>

            {expanded && (
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 text-[#C5A880]">
                    <ShieldCheck className="h-4 w-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.25em]">{settings.necessary_label}</p>
                  </div>
                  <p className="mt-2 text-xs text-slate-300">{settings.necessary_desc}</p>
                  <div className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white">
                    Immer aktiv
                  </div>
                </div>

                <label className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#E7D6B8]">{settings.analytics_label}</p>
                      <p className="mt-2 text-xs text-slate-300">{settings.analytics_desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(preferences.analytics)}
                      onChange={(e) => setPreferences((prev) => ({ ...prev, analytics: e.target.checked }))}
                      className="h-5 w-5 rounded border-white/20 bg-transparent accent-[#C5A880]"
                    />
                  </div>
                </label>

                <label className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#E7D6B8]">{settings.marketing_label}</p>
                      <p className="mt-2 text-xs text-slate-300">{settings.marketing_desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(preferences.marketing)}
                      onChange={(e) => setPreferences((prev) => ({ ...prev, marketing: e.target.checked }))}
                      className="h-5 w-5 rounded border-white/20 bg-transparent accent-[#C5A880]"
                    />
                  </div>
                </label>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
              {settings.show_preferences_link !== false && (
                <Link href={settings.policy_link_url || "/cookie-einstellungen"} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 transition hover:border-[#C5A880]/35 hover:text-white">
                  <Settings2 className="h-4 w-4 text-[#C5A880]" />
                  {settings.policy_link_text || "Cookie-Einstellungen"}
                </Link>
              )}
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 transition hover:border-[#C5A880]/35 hover:text-white"
              >
                <Settings2 className="h-4 w-4 text-[#C5A880]" />
                {settings.settings_text}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:w-[22rem] lg:shrink-0">
            <button
              type="button"
              onClick={handleAcceptAll}
              className="rounded-full bg-[linear-gradient(135deg,#C5A880_0%,#AF8E5E_100%)] px-5 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-slate-950 shadow-lg transition hover:-translate-y-0.5"
            >
              {settings.accept_text}
            </button>
            <button
              type="button"
              onClick={handleAcceptNecessary}
              className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-white transition hover:border-[#C5A880]/35 hover:bg-white/10"
            >
              {settings.reject_text}
            </button>
            <button
              type="button"
              onClick={handleSavePreferences}
              className="rounded-full border border-[#C5A880]/20 bg-slate-950/35 px-5 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-white transition hover:border-[#C5A880]/45 hover:bg-slate-950/60"
            >
              {settings.save_text}
            </button>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="self-end inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 transition hover:text-white"
              aria-label="Cookie banner schliessen"
            >
              <X className="h-4 w-4" />
              Schliessen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}