import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { ArrowRight, MapPin, CheckCircle2, AlertTriangle } from "lucide-react";

const API = "/api";

export default function ServiceAreasSection() {
  const router = useRouter();
  const [areas, setAreas] = useState([]);
  const [section, setSection] = useState(null);
  const [postcode, setPostcode] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/service-areas`),
      axios.get(`${API}/homepage-sections/service-areas`)
    ])
      .then(([areasRes, sectionRes]) => {
        setAreas(areasRes.data || []);
        setSection(sectionRes.data || null);
      })
      .catch((err) => console.error("Error loading service areas section:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!postcode || postcode.trim().length < 4) {
      setResult({ allowed: false, message: "Bitte geben Sie eine gültige Postleitzahl ein." });
      return;
    }
    try {
      const res = await axios.get(`${API}/postcode/check/${postcode.trim()}`);
      setResult({ allowed: res.data.allowed, message: res.data.message, region: res.data.region });
    } catch (err) {
      setResult({ allowed: false, message: "Prüfung konnte nicht abgeschlossen werden." });
    }
  };

  const visibleAreas = useMemo(() => (areas || []).slice(0, 6), [areas]);

  if (loading) {
    return null;
  }

  if (!section?.show_on_homepage) {
    return null;
  }

  return (
    <section className="py-24 bg-[#FAF9F6]" style={{ backgroundColor: section?.background_color || "#FAF9F6" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-start">
          <div className="space-y-6">
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: section?.accent_color || "#C5A880" }}>
                {section?.subtitle || "EINSATZGEBIETE"}
              </span>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight leading-none" style={{ color: section?.text_color || "#0F172A" }}>
                {section?.title || "Unsere Einsatzgebiete"}
              </h2>
              <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
                {section?.description || "Wir sind für unsere Kunden in Zürich, Aarau, Aargau und Olten im Einsatz."}
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {visibleAreas.map((area) => (
                <article key={area.id} className="group rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">{area.canton || area.KANTON || "Region"}</p>
                      <h3 className="mt-2 text-xl font-black text-slate-900">{area.name}</h3>
                      <p className="mt-3 text-sm text-slate-600 leading-relaxed">{area.short_description || area.description}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 p-3" style={{ color: section?.accent_color || "#C5A880" }}>
                      <MapPin className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {area.service_ids?.slice(0, 3).map((serviceId) => (
                      <span key={serviceId} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                        {serviceId}
                      </span>
                    ))}
                  </div>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button onClick={() => router.push(`/einsatzgebiete/${area.slug}`)} className="rounded-full border border-slate-200 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                      Mehr erfahren
                    </button>
                    <button onClick={() => { sessionStorage.setItem("preselected_region", area.name); router.push("/quote-request"); }} className="rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white transition" style={{ backgroundColor: section?.accent_color || "#C5A880" }}>
                      Offerte anfragen
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button onClick={() => router.push("/areas")} className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 transition hover:bg-slate-100">
                <span>Alle Einsatzgebiete</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button onClick={() => router.push("/quote-request")} className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white transition" style={{ backgroundColor: section?.accent_color || "#C5A880" }}>
                <span>{section?.cta_text || "Offerte anfragen"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5" style={{ color: section?.accent_color || "#C5A880" }} />
              <h3 className="text-xl font-black text-slate-900">Prüfen Sie Ihr Einsatzgebiet</h3>
            </div>
            <p className="mt-4 text-sm text-slate-600">Geben Sie Ihre Postleitzahl ein, um schnell zu prüfen, ob Ihr Standort in unserem Einsatzgebiet liegt.</p>
            <form onSubmit={handleCheck} className="mt-6 flex flex-col gap-3 sm:flex-row">
              <input value={postcode} onChange={(e) => setPostcode(e.target.value)} className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-slate-300" placeholder="z. B. 8000" />
              <button type="submit" className="rounded-full px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white" style={{ backgroundColor: section?.accent_color || "#C5A880" }}>
                Prüfen
              </button>
            </form>
            {result && (
              <div className={`mt-6 rounded-2xl border p-4 ${result.allowed ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
                <div className="flex items-start gap-3">
                  {result.allowed ? <CheckCircle2 className="mt-0.5 h-5 w-5" /> : <AlertTriangle className="mt-0.5 h-5 w-5" />}
                  <div>
                    <p className="font-semibold">{result.region ? `Ihr Standort: ${result.region}` : "Hinweis"}</p>
                    <p className="mt-1 text-sm">{result.message}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
