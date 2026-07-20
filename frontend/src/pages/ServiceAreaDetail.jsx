import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { ArrowRight, MapPin, CheckCircle2, Home } from "lucide-react";

const API = "/api";

export default function ServiceAreaDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [area, setArea] = useState(null);

  useEffect(() => {
    axios.get(`${API}/service-areas/slug/${slug}`)
      .then((res) => setArea(res.data))
      .catch(() => setArea(null));
  }, [slug]);

  if (!area) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] px-6 py-24"> 
        <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h1 className="text-3xl font-black text-slate-900">Einsatzgebiet nicht gefunden</h1>
          <p className="mt-4 text-sm text-slate-600">Die angeforderte Region ist derzeit nicht verfügbar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <nav className="mb-8 flex items-center gap-2 text-sm text-slate-500">
          <button onClick={() => navigate("/")} className="inline-flex items-center gap-2 font-semibold hover:text-slate-800">
            <Home className="h-4 w-4" /> Startseite
          </button>
          <span>/</span>
          <button onClick={() => navigate("/areas")} className="font-semibold hover:text-slate-800">Einsatzgebiete</button>
          <span>/</span>
          <span className="font-semibold text-slate-800">{area.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#C5A880]">{area.canton || area.KANTON}</span>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900">{area.name}</h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-600">{area.description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => navigate("/quote-request")} className="rounded-full bg-slate-900 px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-slate-800">
                Offerte anfragen
              </button>
              <button onClick={() => navigate("/areas")} className="rounded-full border border-slate-300 px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 transition hover:bg-slate-100">
                Alle Regionen
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-[#C5A880]" />
              <h2 className="text-xl font-black text-slate-900">Region im Überblick</h2>
            </div>
            <div className="mt-6 space-y-4 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">Stadt</p>
                <p className="mt-1">{area.city}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">Postleitzahlen</p>
                <p className="mt-1">{(area.postal_codes || []).join(", ")}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">Service-Radius</p>
                <p className="mt-1">{area.radius || 25} km</p>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <CheckCircle2 className="h-5 w-5" />
              <span>Aktiv und direkt für Projektanfragen verfügbar.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
