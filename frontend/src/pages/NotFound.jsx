import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] bg-[#FAF9F6] px-6 py-24">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A880]">404</span>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Seite nicht gefunden</h1>
        <p className="mt-4 text-slate-600">
          Die angeforderte Route existiert nicht oder wurde verschoben.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
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
