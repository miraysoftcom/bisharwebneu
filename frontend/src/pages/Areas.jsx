import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { useLanguage } from "@/components/LanguageContext";
import { MapPin, Search, CheckCircle2, AlertTriangle, ArrowRight, HelpCircle } from "lucide-react";

const API = "/api";

export default function Areas() {
  const { t } = useLanguage();
  const router = useRouter();
  const [areas, setAreas] = useState([]);
  const [postalCode, setPostalCode] = useState("");
  const [postcodeCheck, setPostcodeCheck] = useState({ checked: false, allowed: false, message: "" });

  useEffect(() => {
    // Fetch active service areas from backend
    axios.get(`${API}/service-areas`)
      .then(res => setAreas(res.data))
      .catch(err => console.error("Error loading service areas:", err));
  }, []);

  const handlePostcodeCheck = async (e) => {
    e.preventDefault();
    if (!postalCode || postalCode.trim().length < 4) {
      setPostcodeCheck({ checked: true, allowed: false, message: "Bitte geben Sie eine gültige 4-stellige Postleitzahl ein." });
      return;
    }
    try {
      const res = await axios.get(`${API}/postcode/check/${postalCode}`);
      if (res.data.allowed) {
        setPostcodeCheck({
          checked: true,
          allowed: true,
          message: `Gute Nachrichten – wir sind in Ihrer Region (${res.data.region}) im Einsatz. Sie können direkt eine Offerte anfragen!`
        });
      } else {
        setPostcodeCheck({
          checked: true,
          allowed: false,
          message: "Ihre Region ist derzeit nicht eindeutig hinterlegt. Senden Sie uns trotzdem Ihre Anfrage – wir prüfen Ihren Standort gerne persönlich."
        });
      }
    } catch (err) {
      setPostcodeCheck({ checked: true, allowed: false, message: "Fehler bei der Überprüfung." });
    }
  };

  const handleRequestQuoteForArea = (area) => {
    // Pre-fill postal code / city for the wizard
    let pc = "8000";
    if (area.name === "Aarau") pc = "5000";
    if (area.name === "Olten") pc = "4600";
    
    sessionStorage.setItem("preselected_zip", pc);
    sessionStorage.setItem("preselected_city", area.city);
    sessionStorage.setItem("preselected_region", area.name);
    router.push("/quote-request");
  };

  return (
    <div className="py-16 bg-[#FAF9F6] min-h-[85vh] animate-in fade-in duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Header */}
        <div className="text-left max-w-3xl space-y-4 border-l-2 border-[#C5A880] pl-6">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C5A880]">
            EINSATZGEBIETE
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tighter text-slate-900 leading-none">
            Wir sind in Ihrer Region vor Ort
          </h1>
          <p className="text-sm font-semibold text-slate-500 max-w-2xl leading-relaxed">
            Als lokaler Fachbetrieb sind wir ausschließlich in ausgewählten Schweizer Regionen tätig, um Ihnen höchste Pünktlichkeit, reibungslose Logistik und schnelle Reaktionszeiten garantieren zu können.
          </p>
        </div>

        {/* Postcode checker widget */}
        <div className="max-w-xl bg-white border border-[#C5A880]/15 p-8 rounded shadow-sm space-y-6">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-[#C5A880]" />
            <h3 className="text-lg font-bold text-slate-900">Postleitzahl prüfen</h3>
          </div>
          <p className="text-xs text-slate-500 font-semibold">Geben Sie Ihre Postleitzahl ein, um sofort zu prüfen, ob Ihr Projekt in unserem Einzugsgebiet liegt:</p>
          
          <form onSubmit={handlePostcodeCheck} className="flex gap-2">
            <input 
              type="text"
              maxLength={4}
              placeholder="z.B. 8000"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-[#C5A880] focus:outline-none w-full sm:max-w-xs font-semibold text-slate-800"
            />
            <button 
              type="submit"
              className="bg-slate-900 hover:bg-slate-850 text-white text-xs font-bold uppercase tracking-widest px-6 py-2.5 rounded-sm border border-[#C5A880]/20"
            >
              Prüfen
            </button>
          </form>

          {postcodeCheck.checked && (
            <div className={`p-4 border rounded flex items-start space-x-3 text-sm animate-in fade-in duration-200 ${
              postcodeCheck.allowed 
                ? "bg-green-50 border-green-200 text-green-800" 
                : "bg-amber-50 border-amber-200 text-amber-800"
            }`}>
              {postcodeCheck.allowed ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="block font-bold">{postcodeCheck.allowed ? "Gute Nachrichten!" : "Wichtiger Hinweis"}</span>
                <p className="text-xs leading-relaxed mt-1 font-semibold">{postcodeCheck.message}</p>
                {postcodeCheck.allowed && (
                  <button 
                    onClick={() => {
                      sessionStorage.setItem("preselected_zip", postalCode);
                      router.push("/quote-request");
                    }}
                    className="mt-3 text-xs font-bold text-green-700 hover:text-green-800 underline block"
                  >
                    Jetzt direkt Offerte anfordern &rarr;
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Region Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {areas.map((area) => (
            <div 
              key={area.id}
              className="bg-white border border-[#C5A880]/10 rounded-sm overflow-hidden group shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              {/* Card visual header */}
              <div className="h-48 bg-slate-900 relative flex items-center justify-center overflow-hidden">
                <div 
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 transform group-hover:scale-105 transition-transform duration-500"
                  style={{ backgroundImage: `url('https://images.pexels.com/photos/901941/pexels-photo-901941.jpeg')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                <div className="relative z-10 text-center space-y-1">
                  <MapPin className="w-8 h-8 text-[#C5A880] mx-auto" />
                  <h3 className="text-2xl font-black text-white tracking-tight">{area.name}</h3>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#C5A880] bg-[#C5A880]/15 border border-[#C5A880]/20 px-2 py-0.5 rounded-sm inline-block">KANTON {area.canton || area.KANTON}</span>
                </div>
              </div>

              {/* Card info */}
              <div className="p-6 flex-grow flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                    {area.short_description}
                  </p>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    {area.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                  <button 
                    onClick={() => handleRequestQuoteForArea(area)}
                    className="w-full bg-slate-900 hover:bg-slate-850 text-white font-extrabold text-[10px] tracking-widest uppercase py-3 rounded-sm border border-[#C5A880]/20 transition-all flex items-center justify-center space-x-1"
                  >
                    <span>Offerte Anfordern</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#C5A880]" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dynamic Switzerland Area Map Placeholder */}
        <div className="border border-slate-200 rounded-lg overflow-hidden relative shadow-sm">
          <div className="h-[380px] bg-slate-950 relative flex items-center justify-center p-6 text-center">
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15"
              style={{ backgroundImage: `url('https://images.pexels.com/photos/901941/pexels-photo-901941.jpeg')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent" />
            <div className="relative z-10 space-y-4 max-w-lg text-white">
              <MapPin className="w-12 h-12 text-[#C5A880] mx-auto animate-bounce" />
              <h4 className="text-2xl font-black text-white tracking-tight">Atelier Verlege-Netzwerk</h4>
              <p className="text-xs text-slate-300 font-semibold leading-relaxed">
                Unsere Handwerker koordinieren alle Logistik- und Bauphasen mit eigener Ausrüstung direkt aus unseren Stützpunkten in Zürich, Aarau, und Olten. Lückenloser Service.
              </p>
              <div className="text-[10px] font-black uppercase tracking-widest text-[#C5A880] bg-[#C5A880]/10 inline-block px-4.5 py-2.5 border border-[#C5A880]/30 rounded-sm">
                SIA REGIONAL PROTECTION CONFORM
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
