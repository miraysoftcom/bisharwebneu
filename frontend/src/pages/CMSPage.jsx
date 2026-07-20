import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
const API = `${BACKEND_URL}/api`;

const FALLBACK_META = {
  agb: {
    title: "AGB - Swiss Platten GmbH",
    description: "Allgemeine Geschäftsbedingungen der Swiss Platten GmbH."
  },
  datenschutz: {
    title: "Datenschutzerklärung - Swiss Platten GmbH",
    description: "Datenschutzerklärung der Swiss Platten GmbH."
  },
  impressum: {
    title: "Impressum - Swiss Platten GmbH",
    description: "Impressum der Swiss Platten GmbH."
  },
  "cookie-einstellungen": {
    title: "Cookie-Einstellungen - Swiss Platten GmbH",
    description: "Cookie-Einstellungen der Swiss Platten GmbH."
  },
  "ueber-uns": {
    title: "Über uns - Swiss Platten GmbH",
    description: "Erfahren Sie mehr über Swiss Platten und unsere Arbeitsweise."
  }
};

export default function CMSPage({ pageSlug }) {
  const { slug } = useParams();
  const cmsSlug = pageSlug || slug || "";
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cookieSettings, setCookieSettings] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    if (!cmsSlug) {
      setPage(null);
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    axios.get(`${API}/pages/slug/${cmsSlug}`)
      .then((res) => {
        if (!mounted) return;
        setPage(res.data);
        document.title = res.data?.seo_title || FALLBACK_META[cmsSlug]?.title || res.data?.title || "Swiss Platten";
      })
      .catch(() => {
        if (!mounted) return;
        setPage(null);
        const fallback = FALLBACK_META[cmsSlug];
        document.title = fallback?.title || "Seite nicht gefunden - Swiss Platten";
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    if (cmsSlug === "cookie-einstellungen") {
      axios.get(`${API}/settings`)
        .then((res) => {
          if (!mounted) return;
          setCookieSettings(res.data?.cookies || null);
        })
        .catch(() => {
          if (mounted) setCookieSettings(null);
        });
    } else {
      setCookieSettings(null);
    }

    return () => {
      mounted = false;
    };
  }, [cmsSlug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] bg-[#FAF9F6] px-6 py-24">
        <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
          <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
          <div className="mt-5 h-10 w-3/4 animate-pulse rounded bg-slate-200" />
          <div className="mt-6 space-y-3">
            <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-11/12 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-10/12 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-[60vh] bg-[#FAF9F6] px-6 py-24">
        <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A880]">404</span>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Seite nicht gefunden</h1>
          <p className="mt-4 text-slate-600">
            Die angeforderte Seite ist nicht verfügbar oder wurde noch nicht veröffentlicht.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/" className="rounded-full bg-slate-900 px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-slate-800">
              Zur Startseite
            </Link>
            <Link to="/contact" className="rounded-full border border-slate-300 px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 transition hover:bg-slate-100">
              Kontakt
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] bg-[#FAF9F6] px-6 py-20">
      <article className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
        <div className="max-w-3xl">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A880]">CMS</span>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900">{page.title}</h1>
          {(page.seo_description || FALLBACK_META[cmsSlug]?.description) && (
            <p className="mt-5 text-lg leading-relaxed text-slate-600">
              {page.seo_description || FALLBACK_META[cmsSlug]?.description}
            </p>
          )}
        </div>

        {cmsSlug === "cookie-einstellungen" && cookieSettings && (
          <div className="mt-10 rounded-[28px] border border-[#C5A880]/20 bg-[linear-gradient(135deg,#111418_0%,#1B1F25_45%,#0F172A_100%)] p-6 text-white shadow-[0_25px_60px_-30px_rgba(197,168,128,0.55)] sm:p-8">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <span className="inline-flex items-center rounded-full border border-[#C5A880]/25 bg-[#C5A880]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-[#E7D6B8]">Cookie Control Panel</span>
                <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Ihre Cookie-Präferenzen in Echtzeit</h2>
                <p className="max-w-3xl text-sm leading-relaxed text-slate-300">
                  Diese Übersicht zeigt die im Admin gesetzten Standardwerte für Einwilligung und Banner-Kommunikation.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#E7D6B8] sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-center">Banner aktiv</div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-center">Consent UX</div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-center">Luxus Layout</div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#E7D6B8]">Standard</p>
                <p className="mt-2 text-sm font-semibold">{cookieSettings.banner_title || "Cookie Banner"}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">{cookieSettings.banner_text}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#E7D6B8]">Aktionen</p>
                <p className="mt-2 text-sm font-semibold">{cookieSettings.accept_text} / {cookieSettings.reject_text}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">{cookieSettings.settings_text} und {cookieSettings.save_text} sind aktiv konfigurierbar.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#E7D6B8]">Standard-Profile</p>
                <p className="mt-2 text-sm font-semibold">Notwendig: {cookieSettings.default_necessary ? "An" : "Aus"}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">Analyse: {cookieSettings.default_analytics ? "An" : "Aus"} · Marketing: {cookieSettings.default_marketing ? "An" : "Aus"}</p>
              </div>
            </div>
          </div>
        )}

        <div
          className="prose prose-slate mt-10 max-w-none prose-headings:font-black prose-a:text-[#C5A880]"
          dangerouslySetInnerHTML={{ __html: page.content || "" }}
        />
      </article>
    </div>
  );
}
