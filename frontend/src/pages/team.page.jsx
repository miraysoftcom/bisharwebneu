import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLanguage } from "@/components/LanguageContext";
import { ArrowRight, Shield, Sparkles } from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const API = `${BACKEND_URL}/api`;

export default function TeamPage() {
  const { t } = useLanguage();
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTeam = async () => {
      try {
        const res = await axios.get(`${API}/team`);
        setTeam(res.data || []);
      } catch (err) {
        setError("Team konnte nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    };

    loadTeam();
  }, []);

  const resolveAssetUrl = (url) => {
    if (!url) return url;
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `${BACKEND_URL}${url}`;
  };

  return (
    <div className="bg-[#FAF9F6] animate-in fade-in duration-500">
      <section className="relative overflow-hidden bg-white border-b border-[#C5A880]/10">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#C5A880]/10 to-transparent pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.35em] text-[#C5A880] mb-4">
              <Sparkles className="w-4 h-4" /> {t("nav.team")}
            </span>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 mb-6">Unser Team</h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Erfahrene Fachkräfte für Plattenverlegungen, Spezialabdichtungen und hochwertige Innenausbauten.
              Lernen Sie das Plattenleger Aller Art Team kennen, das Ihre Projektvision zuverlässig umsetzt.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500">Lädt...</div>
          ) : error ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-12 text-center text-red-700">{error}</div>
          ) : team.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500">
              Keine Team-Mitglieder verfügbar.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {team.map((member) => (
                <div key={member.id} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                  <div className="flex items-start gap-5">
                    {member.photo_url ? (
                      <img
                        src={resolveAssetUrl(member.photo_url)}
                        alt={member.name}
                        className="w-24 h-24 rounded-3xl object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-3xl bg-slate-900 text-white grid place-items-center text-3xl font-black">
                        {member.name ? member.name[0] : "T"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h2 className="text-xl font-black text-slate-900 leading-tight">{member.name}</h2>
                      <p className="text-xs uppercase tracking-[0.24em] text-[#C5A880] font-black mt-2">{member.role || "Teammitglied"}</p>
                      {member.title && <p className="text-sm text-slate-600 mt-2">{member.title}</p>}
                    </div>
                  </div>
                  {member.bio && <p className="mt-6 text-sm leading-relaxed text-slate-700">{member.bio}</p>}
                  <div className="mt-6 space-y-2 text-sm text-slate-500">
                    {member.email && <p>E-Mail: <span className="text-slate-700">{member.email}</span></p>}
                    {member.phone && <p>Tel: <span className="text-slate-700">{member.phone}</span></p>}
                    {member.social_links && member.social_links.length > 0 && (
                      <p>Social: <span className="text-slate-700">{Array.isArray(member.social_links) ? member.social_links.join(", ") : member.social_links}</span></p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
