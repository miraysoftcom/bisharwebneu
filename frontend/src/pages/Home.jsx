import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useLanguage } from "@/components/LanguageContext";
import { Star, Shield, Award, ClipboardCheck, ArrowRight, CheckCircle2, ChevronRight, Split, Sparkles, ChevronLeft, Send, Loader2 } from "lucide-react";
import { PORTFOLIO } from "@/constants/testIds";
import ServiceAreasSection from "@/components/ServiceAreasSection";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
const API = `${BACKEND_URL}/api`;

export default function Home() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  
  // Dynamic Slider states
  const [sliders, setSliders] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [sliderPos, setSliderPos] = useState(50); // For before/after comparison
  const [banners, setBanners] = useState([]);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewForm] = useState(() => ({
    submittedAt: new Date().toISOString(),
  }));
  const [reviewDraft, setReviewDraft] = useState({
    name: "",
    location: "",
    service: "",
    rating: 5,
    comment: "",
    website: "",
  });

  // Fetch sliders, reviews, and inline banners
  useEffect(() => {
    // 1. Sliders
    axios.get(`${API}/sliders`)
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setSliders(res.data);
        }
      })
      .catch((err) => console.error("Error loading sliders:", err));

    // 2. Reviews
    axios.get(`${API}/reviews`)
      .then((res) => setReviews(res.data))
      .catch((err) => console.error("Error loading reviews:", err));

    // 3. Banners
    axios.get(`${API}/banners`)
      .then((res) => setBanners(res.data))
      .catch((err) => console.error("Error loading banners:", err));
  }, []);

  // Automatic slide rotation (every 5 seconds)
  useEffect(() => {
    if (sliders.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % sliders.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [sliders]);

  const featuredServices = [
    { key: "bodenplatten", bg: "bg-[#111418] text-white border border-[#C5A880]/15" },
    { key: "duschen", bg: "bg-white text-slate-900 border border-[#C5A880]/10" },
    { key: "spezialabdichtungen", bg: "bg-white text-slate-900 border border-[#C5A880]/10" },
    { key: "bodenschleifen", bg: "bg-[#1A1F24] text-white border border-[#C5A880]/15" }
  ];

  const handleMove = (clientX) => {
    const container = document.getElementById("slider-container");
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percentage);
  };

  const handleTouchMove = (e) => {
    if (e.touches && e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError("");
    setReviewSuccess("");

    if (!reviewDraft.comment.trim() || reviewDraft.comment.trim().length < 20) {
      setReviewError("Bitte mindestens 20 Zeichen schreiben.");
      return;
    }

    try {
      setReviewSubmitting(true);
      await axios.post(`${API}/reviews`, {
        name: reviewDraft.name.trim() || "Anonym",
        location: reviewDraft.location.trim(),
        service: reviewDraft.service.trim(),
        rating: reviewDraft.rating,
        comment: reviewDraft.comment.trim(),
        website: reviewDraft.website,
        submitted_at: reviewForm.submittedAt,
      });

      setReviewSuccess("Vielen Dank. Ihre Bewertung wurde empfangen und nach Admin-Prüfung freigeschaltet.");
      setReviewDraft({
        name: "",
        location: "",
        service: "",
        rating: 5,
        comment: "",
        website: "",
      });
    } catch (err) {
      setReviewError(err?.response?.data?.detail || "Bewertung konnte nicht gesendet werden.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Location-based banners
  const homeHeroBanners = banners.filter((b) => b.location === "home_hero" && b.active);
  const inlineBanners = banners.filter(
    (b) => b.active && (b.location === "home_inline" || b.type === "inline")
  );

  return (
    <div className="animate-in fade-in duration-500 bg-[#FAF9F6]">

      {homeHeroBanners.map((banner) => (
        <div
          key={banner.id}
          className="mx-auto max-w-7xl mt-6 rounded-2xl px-6 py-4 text-white shadow-lg border border-white/10"
          style={{ background: banner.bg_color || "#1f2937" }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] font-black text-[#E7D6B8]">HOME HERO BANNER</p>
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
      
      {/* 1. Dynamic Ultra-Luxurious Hero Slider */}
      <section className="relative h-[90vh] bg-[#0B0F12] text-white overflow-hidden border-b border-[#C5A880]/10">
        
        {/* If we have database sliders, map them */}
        {sliders.length > 0 ? (
          sliders.map((slide, idx) => {
            const active = idx === currentSlide;
            return (
              <div 
                key={slide.id || idx}
                className={`absolute inset-0 transition-opacity duration-[1000ms] ease-in-out ${
                  active ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                }`}
              >
                {/* Parallax zooming background image */}
                <div 
                  className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[15000ms] ${
                    active ? "scale-105" : "scale-100"
                  }`}
                  style={{ 
                    backgroundImage: `url('${slide.image_desktop || slide.image_mobile}')`,
                    opacity: slide.overlay_opacity || 0.4
                  }}
                />
                {/* Deep obsidian gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F12] via-[#0B0F12]/90 to-transparent" />
                
                {/* Content Container */}
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center z-20">
                  <div className="space-y-8 max-w-4xl text-left">
                    <div className="inline-flex items-center space-x-2 bg-[#C5A880]/10 border border-[#C5A880]/20 px-4 py-1.5 rounded-sm">
                      <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                      <span className="text-[10px] font-bold tracking-[0.3em] text-[#C5A880] uppercase">
                          {slide.subtitle || t("hero.quality")}
                        </span>
                    </div>
                    
                    <h1 className="text-5xl sm:text-6xl lg:text-7xl tracking-tighter leading-none font-black text-white">
                      {slide.title}
                    </h1>
                    <p className="text-base sm:text-lg font-medium text-slate-300 leading-relaxed max-w-2xl">
                      {slide.desc || t("hero.desc")}
                    </p>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      {slide.btn1_text && (
                        <button
                          onClick={() => navigate(slide.btn1_link || "/quote-request")}
                          className="gold-btn font-extrabold text-[10px] tracking-widest uppercase px-8 py-4.5 rounded-sm"
                        >
                          {slide.btn1_text}
                        </button>
                      )}
                      {slide.btn2_text && (
                        <button
                          onClick={() => navigate(slide.btn2_link || "/portfolio")}
                          className="bg-transparent hover:bg-white/5 font-extrabold text-[10px] tracking-widest uppercase px-8 py-4.5 rounded-sm border border-[#C5A880]/30 text-white transition-all flex items-center justify-center space-x-2"
                        >
                          <span>{slide.btn2_text}</span>
                          <ArrowRight className="w-4 h-4 text-[#C5A880]" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          /* Robust Fallback Slide if Slider Collection is Empty */
          <div className="absolute inset-0 opacity-100 z-10">
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-overlay scale-105"
              style={{ backgroundImage: `url('https://images.pexels.com/photos/10298352/pexels-photo-10298352.jpeg')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F12] via-[#0B0F12]/95 to-transparent" />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center z-20">
              <div className="space-y-8 max-w-4xl text-left">
                <div className="inline-flex items-center space-x-2 bg-[#C5A880]/10 border border-[#C5A880]/20 px-4 py-1.5 rounded-sm">
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span className="text-[10px] font-bold tracking-[0.3em] text-[#C5A880] uppercase">
                    {t("hero.quality")}
                  </span>
                </div>
                
                <h1 className="text-5xl sm:text-6xl lg:text-7xl tracking-tighter leading-none font-black text-white">
                  Exklusive Platten- und <span className="gold-text">Natursteinkunst</span> für Premium-Projekte
                </h1>
                <p className="text-base sm:text-lg font-medium text-slate-300 leading-relaxed max-w-2xl">
                  Als Schweizer Meisterbetrieb realisieren wir anspruchsvolle Plattenarbeiten, fugenlose Badkonzepte und zertifizierte Bauwerksabdichtungen nach höchsten SIA-Normen für Luxusvillen, Penthouses und repräsentative Objekte.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    onClick={() => navigate("/quote-request")}
                    className="gold-btn font-extrabold text-[10px] tracking-widest uppercase px-8 py-4.5 rounded-sm shadow-2xl"
                  >
                    {t("hero.ctaQuote")}
                  </button>
                  <button
                    onClick={() => navigate("/services")}
                    className="bg-transparent hover:bg-white/5 font-extrabold text-[10px] tracking-widest uppercase px-8 py-4.5 rounded-sm border border-[#C5A880]/30 text-white transition-all flex items-center justify-center space-x-2"
                  >
                    <span>{t("hero.ctaServices")}</span>
                    <ArrowRight className="w-4 h-4 text-[#C5A880]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Carousel controls - render only if we have more than 1 slider */}
        {sliders.length > 1 && (
          <>
            <button 
              onClick={() => setCurrentSlide(prev => (prev - 1 + sliders.length) % sliders.length)}
              className="absolute left-6 top-1/2 -translate-y-1/2 bg-slate-950/40 border border-[#C5A880]/30 text-[#C5A880] p-3 rounded-full hover:bg-slate-900 transition-all z-30"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setCurrentSlide(prev => (prev + 1) % sliders.length)}
              className="absolute right-6 top-1/2 -translate-y-1/2 bg-slate-950/40 border border-[#C5A880]/30 text-[#C5A880] p-3 rounded-full hover:bg-slate-900 transition-all z-30"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Slider dot indicator progress */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-2 z-30">
              {sliders.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`w-2.5 h-2.5 rounded-full border border-[#C5A880]/50 transition-all ${
                    i === currentSlide ? "bg-[#C5A880] w-6" : "bg-transparent"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Inline dynamic banner list injected right under Hero slider */}
      {inlineBanners.map(b => (
        <div key={b.id} className="bg-slate-900 text-white py-10 px-8 border-y border-[#C5A880]/15 flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto my-6 rounded-sm">
          <div className="space-y-2 text-center md:text-left mb-6 md:mb-0">
                    <span className="text-[10px] bg-[#C5A880]/15 border border-[#C5A880]/20 text-[#C5A880] px-2.5 py-1 uppercase rounded-sm font-black">{b.type.toUpperCase()} KAMPAGNE</span>
            <h4 className="text-2xl font-black tracking-tight">{b.title}</h4>
            <p className="text-sm text-slate-400 font-semibold">{b.desc}</p>
          </div>
          {b.btn_text && (
            <button 
              onClick={() => navigate(b.btn_link || "/quote-request")}
              className="gold-btn font-extrabold text-[10px] tracking-widest uppercase px-6 py-3.5 rounded-sm"
            >
              {b.btn_text}
            </button>
          )}
        </div>
      ))}

      {/* 2. Bento Grid of Featured Services */}
      <section className="py-24 bg-[#FAF9F6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-left max-w-3xl space-y-4 mb-20 border-l-2 border-[#C5A880] pl-6">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C5A880]">
              DIE KOLLEKTION
            </span>
            <h2 className="text-4xl sm:text-5xl tracking-tight leading-none font-black text-slate-900">
              Unsere meisterhaften Disziplinen
            </h2>
            <p className="text-sm font-semibold text-slate-500">
              Perfektion bis ins kleinste Detail. Wir verarbeiten hochwertige Keramik, Natursteine und Mosaike nach Schweizer Richtlinien.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredServices.map((fs) => {
              const serviceDetails = t(`services.list.${fs.key}`);
              return (
                <div 
                  key={fs.key}
                  className={`p-10 rounded-sm flex flex-col justify-between transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl group ${fs.bg}`}
                >
                  <div className="space-y-6">
                    <div className="w-12 h-12 border border-[#C5A880]/20 text-[#C5A880] flex items-center justify-center rounded-sm bg-slate-50/5">
                      <Award className="w-5 h-5" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-black tracking-tight leading-tight">{serviceDetails.title}</h3>
                      <p className="text-xs opacity-75 leading-relaxed font-medium">{serviceDetails.desc}</p>
                    </div>
                  </div>
                  <div className="pt-8 border-t border-[#C5A880]/15 mt-8 flex justify-between items-center">
                    <button 
                      onClick={() => navigate("/services")}
                      className="text-[10px] font-bold tracking-widest uppercase flex items-center space-x-1 hover:text-[#C5A880] transition-colors"
                    >
                      <span>ATELIER DETAILS</span>
                      <ChevronRight className="w-4 h-4 text-[#C5A880]" />
                    </button>
                  </div>
                </div>
              );
            })}
            
            <div className="bg-[#111418] text-white p-10 rounded-sm flex flex-col justify-between border border-[#C5A880]/30 hover:shadow-2xl transition-all duration-300">
              <div className="space-y-4">
                <span className="text-[9px] font-bold tracking-widest uppercase bg-[#C5A880]/15 border border-[#C5A880]/20 text-[#C5A880] px-3 py-1.5 rounded-sm inline-block">
                  ONLINE-WIZARD
                </span>
                <h3 className="text-3xl font-black tracking-tight leading-tight">
                  Kostenlose Planungsanfrage
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                  Nutzen Sie unser intelligentes Offertensystem mit lokaler Schweizer Postleitzahlprüfung für ein unverbindliches Festpreisangebot.
                </p>
              </div>
              <button
                onClick={() => navigate("/quote-request")}
                className="w-full mt-8 bg-gradient-to-r from-[#C5A880] to-[#9B8265] text-[#111418] font-black text-[10px] tracking-widest uppercase py-4 rounded-sm hover:shadow-lg transition-all"
              >
                OFFERTE ANFORDERN
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Before/After Interactive Comparison (Luxury theme) */}
      <section className="py-28 bg-[#111418] border-y border-[#C5A880]/10 text-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-5 space-y-6">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C5A880]">
                HANDWERKLICHE EXZELLENZ
              </span>
              <h2 className="text-4xl sm:text-5xl tracking-tight leading-tight font-black text-white">
                {t("portfolio.beforeAfter")}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                Unser Qualitätsanspruch dichtet und verschönert langanhaltend. Vergleichen Sie ein renoviertes Badezimmer vor und nach der Schweizer Plattenverlegung.
              </p>
              
              <div className="space-y-4 pt-6 border-t border-[#C5A880]/10">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-[#C5A880] shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">SIA 252 & 271 Richtlinien</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-[#C5A880] shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Dichtbänder & Flüssigmembrane</span>
                </div>
              </div>

              <button 
                onClick={() => navigate("/portfolio")}
                className="inline-flex items-center space-x-2 text-xs font-bold text-[#C5A880] hover:text-white transition-colors pt-4 uppercase tracking-widest"
              >
                <span>PORTFOLIO BESUCHEN</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="lg:col-span-7 flex justify-center">
              <div 
                id="slider-container"
                data-testid={PORTFOLIO.projectCard}
                className="relative w-full max-w-[620px] h-[440px] rounded-sm overflow-hidden border border-[#C5A880]/20 shadow-2xl cursor-ew-resize select-none"
                onMouseMove={(e) => { e.buttons === 1 && handleMove(e.clientX) }}
                onTouchMove={handleTouchMove}
                onMouseDown={(e) => handleMove(e.clientX)}
              >
                <img 
                  src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80" 
                  alt="Before"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                
                <div 
                  className="absolute inset-0 w-full h-full"
                  style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}
                >
                  <img 
                    src="https://images.pexels.com/photos/7018379/pexels-photo-7018379.jpeg" 
                    alt="After"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>

                <div 
                  className="absolute top-0 bottom-0 w-1.5 bg-[#C5A880] cursor-ew-resize z-20 shadow-lg"
                  style={{ left: `${sliderPos}%` }}
                >
                  <button 
                    data-testid={PORTFOLIO.sliderBtn}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 bg-[#111418] border border-[#C5A880] text-white rounded-full flex items-center justify-center shadow-2xl pointer-events-none"
                  >
                    <Split className="w-4 h-4 text-[#C5A880]" />
                  </button>
                </div>

                <div className="absolute left-6 top-6 bg-slate-950/80 border border-[#C5A880]/20 text-[#C5A880] text-[9px] font-extrabold tracking-[0.2em] px-3 py-1.5 uppercase rounded-sm z-30 pointer-events-none">
                  VOR REFORMIERUNG
                </div>
                <div className="absolute right-6 top-6 bg-[#C5A880] text-[#111418] text-[9px] font-extrabold tracking-[0.2em] px-3 py-1.5 uppercase rounded-sm z-30 pointer-events-none">
                  SWISS PLATTEN MEISTERWERK
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ServiceAreasSection />

      {/* 4. Luxury Trust values */}
      <section className="py-28 bg-[#FAF9F6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-24">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C5A880]">
              UNSER MANIFEST
            </span>
            <h2 className="text-4xl sm:text-5xl tracking-tight leading-none font-black text-slate-900">
              {t("trust.title")}
            </h2>
            <p className="text-sm font-semibold text-slate-500">
              Erfahrung trifft auf moderne Ästhetik und kompromisslose Zuverlässigkeit.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-8 border border-[#C5A880]/10 bg-white rounded-sm hover:shadow-xl transition-all duration-300">
              <Award className="w-10 h-10 text-[#C5A880] mb-6" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">{t("trust.item1_title")}</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">{t("trust.item1_desc")}</p>
            </div>
            <div className="p-8 border border-[#C5A880]/10 bg-white rounded-sm hover:shadow-xl transition-all duration-300">
              <Shield className="w-10 h-10 text-[#C5A880] mb-6" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">{t("trust.item2_title")}</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">{t("trust.item2_desc")}</p>
            </div>
            <div className="p-8 border border-[#C5A880]/10 bg-white rounded-sm hover:shadow-xl transition-all duration-300">
              <CheckCircle2 className="w-10 h-10 text-[#C5A880] mb-6" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">{t("trust.item3_title")}</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">{t("trust.item3_desc")}</p>
            </div>
            <div className="p-8 border border-[#C5A880]/10 bg-white rounded-sm hover:shadow-xl transition-all duration-300">
              <ClipboardCheck className="w-10 h-10 text-[#C5A880] mb-6" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">{t("trust.item4_title")}</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">{t("trust.item4_desc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Testimonials */}
      {reviews.length > 0 && (
        <section className="py-28 bg-white border-t border-[#C5A880]/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-24">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C5A880]">
                KUNDENSTIMMEN
              </span>
              <h2 className="text-4xl sm:text-5xl tracking-tight leading-none font-black text-slate-900">
                Unsere Referenzen im Detail
              </h2>
              <p className="text-sm font-semibold text-slate-500">
                Was private Hauseigentümer, Planer und Premium-Verwaltungen in Zürich, Aarau und Olten über uns berichten.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {reviews.map((r, idx) => (
                <div key={idx} className="bg-[#FAF9F6] p-10 border border-[#C5A880]/10 rounded-sm hover:shadow-lg transition-shadow flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="flex text-[#C5A880] space-x-1">
                      {Array.from({ length: r.rating || 5 }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-sm text-slate-700 italic font-semibold leading-relaxed">
                      &ldquo;{r.comment}&rdquo;
                    </p>
                  </div>
                  <div className="mt-8 pt-6 border-t border-[#C5A880]/15 flex justify-between items-center">
                    <div>
                      <span className="block font-black text-slate-900 text-sm uppercase tracking-wide">{r.name}</span>
                      <span className="block text-slate-400 text-xs font-semibold">{r.location}</span>
                    </div>
                    <span className="text-[9px] font-black bg-slate-950 text-[#C5A880] border border-[#C5A880]/10 px-2.5 py-1 rounded-sm uppercase tracking-widest">
                      {r.service}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. Premium Review Submission */}
      <section className="py-24 bg-[radial-gradient(circle_at_top,_#1b222a_0%,_#0f1419_42%,_#090c10_100%)] text-white border-t border-[#C5A880]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div className="space-y-6">
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-[#E4CCA0] border border-[#C5A880]/30 bg-[#C5A880]/10 px-3 py-1 rounded-full">
                PREMIUM FEEDBACK
              </span>
              <h2 className="text-4xl sm:text-5xl leading-none tracking-tight font-black text-[#F5EFE5]">
                Schreiben Sie eine Bewertung
              </h2>
              <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed max-w-xl">
                Ihre Bewertung hilft anderen Eigentümern bei der Auswahl. Jede Einsendung wird manuell vom Admin-Team geprüft und erst danach veröffentlicht.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-[#C5A880]/25 bg-white/5 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#E4CCA0] font-black">Manuelle Prüfung</p>
                  <p className="text-xs text-slate-300 mt-1">Keine ungeprüfte Live-Schaltung</p>
                </div>
                <div className="rounded-xl border border-[#C5A880]/25 bg-white/5 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#E4CCA0] font-black">Spam Shield</p>
                  <p className="text-xs text-slate-300 mt-1">Mehrstufiger Bot- und Missbrauchsschutz</p>
                </div>
                <div className="rounded-xl border border-[#C5A880]/25 bg-white/5 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#E4CCA0] font-black">Datenschutz</p>
                  <p className="text-xs text-slate-300 mt-1">Nur relevante Bewertungsdaten sichtbar</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleReviewSubmit} className="rounded-2xl border border-[#C5A880]/25 bg-white/[0.04] backdrop-blur-sm p-6 sm:p-8 space-y-5 shadow-2xl shadow-black/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E4CCA0]">Name</label>
                  <input
                    type="text"
                    value={reviewDraft.name}
                    onChange={(e) => setReviewDraft({ ...reviewDraft, name: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
                    placeholder="Max Mustermann"
                    maxLength={80}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E4CCA0]">Ort</label>
                  <input
                    type="text"
                    value={reviewDraft.location}
                    onChange={(e) => setReviewDraft({ ...reviewDraft, location: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
                    placeholder="Zürich"
                    maxLength={80}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E4CCA0]">Leistung</label>
                  <input
                    type="text"
                    value={reviewDraft.service}
                    onChange={(e) => setReviewDraft({ ...reviewDraft, service: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
                    placeholder="Bodenplatten"
                    maxLength={80}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E4CCA0]">Bewertung</label>
                  <div className="mt-2 flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setReviewDraft({ ...reviewDraft, rating: v })}
                        className="group"
                      >
                        <Star className={`w-5 h-5 transition-colors ${reviewDraft.rating >= v ? "text-[#E4CCA0] fill-[#E4CCA0]" : "text-slate-500"}`} />
                      </button>
                    ))}
                    <span className="text-xs text-slate-300 font-semibold ml-2">{reviewDraft.rating}/5</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E4CCA0]">Ihre Erfahrung</label>
                <textarea
                  rows={5}
                  value={reviewDraft.comment}
                  onChange={(e) => setReviewDraft({ ...reviewDraft, comment: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
                  placeholder="Beschreiben Sie kurz Qualität, Ablauf und Ergebnis Ihres Projekts..."
                  minLength={20}
                  maxLength={1200}
                  required
                />
              </div>

              {/* Honeypot field */}
              <input
                type="text"
                value={reviewDraft.website}
                onChange={(e) => setReviewDraft({ ...reviewDraft, website: e.target.value })}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />

              {reviewSuccess && (
                <div className="rounded-lg border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200 font-semibold">
                  {reviewSuccess}
                </div>
              )}
              {reviewError && (
                <div className="rounded-lg border border-red-300/30 bg-red-400/10 px-3 py-2 text-sm text-red-200 font-semibold">
                  {reviewError}
                </div>
              )}

              <button
                type="submit"
                disabled={reviewSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#C5A880] hover:bg-[#B79664] disabled:opacity-70 disabled:cursor-not-allowed px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-slate-950"
              >
                {reviewSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Bewertung einreichen
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
