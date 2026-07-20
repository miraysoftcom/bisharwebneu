import React, { useState } from "react";
import { useLanguage } from "@/components/LanguageContext";
import { MapPin, Clock, Calendar, CheckSquare, Layers, Eye, X } from "lucide-react";
import { PORTFOLIO } from "@/constants/testIds";

export default function Portfolio() {
  const { t } = useLanguage();
  const [activeCategory, setActiveTab] = useState("all");
  const [lightboxImage, setLightboxImage] = useState(null);

  const projects = [
    {
      id: "p1",
      title: "Luxuriöse Badezimmer-Oase",
      category: "bathroom",
      image: "https://images.pexels.com/photos/7018379/pexels-photo-7018379.jpeg",
      location: "Zürich",
      duration: "8 Tage",
      materials: "Grossformat-Feinsteinzeug (120x120 cm), Marmor-Optik",
      works: "Untergrundschleifen, Wand- und Bodenabdichtung nach SIA, Plattenverlegung, Fugenarbeiten",
      desc: "Komplette Sanierung eines Master-Badezimmers mit bodengleicher Walk-In Dusche und millimetergenauen Gehrungsschnitten (Jollyschnitte)."
    },
    {
      id: "p2",
      title: "Exklusive Terrassen-Plattenverlegung",
      category: "outdoor",
      image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a",
      location: "Aarau",
      duration: "5 Tage",
      materials: "Naturstein-Keramikplatten (2cm Dicke), Stelzlager-System",
      works: "Flüssigabdichtung, Spezialentwässerung, Plattenverlegung auf Stelzlager, elastische Fugen",
      desc: "Wasserdichte Abdichtung und Posa von strapazierfähigen Feinsteinzeugplatten auf einer modernen Penthouse-Dachterrasse."
    },
    {
      id: "p3",
      title: "Modernes Wohnzimmer mit XXL-Feinsteinzeug",
      category: "flooring",
      image: "https://images.pexels.com/photos/1388944/floor-flooring-hand-man-1388944.jpeg",
      location: "Olten",
      duration: "6 Tage",
      materials: "Feinsteinzeugplatten (160x80 cm), hochfester Zementmörtel",
      works: "Kratzgrundierung, Heizestrich-Ausgleich, Verlegung im Buttering-Floating-Verfahren",
      desc: "Großflächiges Verlegen von modernen Grossformatplatten im gesamten Wohnbereich mit optimaler Wärmeleitfähigkeit für Fussbodenheizung."
    },
    {
      id: "p4",
      title: "Gewerbliche Wellnessanlage 'Thermal-Pool'",
      category: "commercial",
      image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f",
      location: "Kanton Aargau (Baden)",
      duration: "14 Tage",
      materials: "Mosaikfliesen, Epoxidharz-Fugenmörtel, Spezial-Haftbrücke",
      works: "Flüssig-Druckwasserabdichtung, Mosaik-Präzisionsverlegung, chemikalienbeständige Verfugung",
      desc: "Hochkomplexe Spezialabdichtung und Verfliesung einer Hotel-Wellnesslandschaft unter ständiger Chlor- und Wasserbelastung."
    }
  ];

  const categories = [
    { code: "all", label: t("portfolio.filterAll") },
    { code: "bathroom", label: t("portfolio.categories.bathroom") },
    { code: "flooring", label: t("portfolio.categories.flooring") },
    { code: "waterproofing", label: t("portfolio.categories.waterproofing") },
    { code: "outdoor", label: t("portfolio.categories.outdoor") },
    { code: "commercial", label: t("portfolio.categories.commercial") }
  ];

  const filteredProjects = activeCategory === "all" 
    ? projects 
    : projects.filter(p => p.category === activeCategory);

  const categoryLabels = {
    bathroom: "BADEZIMMER",
    outdoor: "TERRASSE",
    flooring: "BODEN",
    waterproofing: "ABDICHTUNG",
    commercial: "GEWERBE"
  };

  return (
    <div className="py-16 bg-white animate-in fade-in duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-left max-w-3xl space-y-4 mb-16">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">
            REFERENZEN
          </span>
          <h1 className="text-4xl sm:text-5xl tracking-tighter leading-none font-extrabold text-slate-900">
            {t("portfolio.title")}
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl">
            {t("portfolio.subtitle")}
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap gap-3 mb-12">
          {categories.map((cat) => (
            <button
              key={cat.code}
              data-testid={PORTFOLIO.filterBtn}
              onClick={() => setActiveTab(cat.code)}
              className={`px-5 py-2.5 text-xs font-bold tracking-wider uppercase transition-colors duration-200 border rounded-sm ${
                activeCategory === cat.code
                  ? "bg-slate-900 border-slate-900 text-white"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-red-600"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Projects Tetris Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {filteredProjects.map((p) => (
            <div 
              key={p.id}
              data-testid={PORTFOLIO.projectCard}
              className="bg-white border border-slate-200 rounded-lg overflow-hidden group shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              {/* Image box with quick lightbox view icon */}
              <div className="relative h-[300px] overflow-hidden bg-slate-900">
                <img 
                  src={p.image} 
                  alt={p.title} 
                  className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                />
                <button 
                  onClick={() => setLightboxImage(p.image)}
                  className="absolute bottom-4 right-4 bg-slate-900/80 hover:bg-red-600 text-white p-2.5 rounded-full transition-colors z-20"
                >
                  <Eye className="w-5 h-5" />
                </button>
                <div className="absolute left-4 top-4 bg-red-600 text-white text-[10px] font-extrabold tracking-widest px-2.5 py-1 uppercase rounded-sm">
                  {categoryLabels[p.category] || p.category.toUpperCase()}
                </div>
              </div>

              {/* Info panel */}
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none group-hover:text-red-600 transition-colors">
                    {p.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {p.desc}
                  </p>
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-slate-100 text-xs">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="block font-bold text-slate-400 uppercase tracking-widest text-[9px]">{t("portfolio.location")}</span>
                      <span className="font-bold text-slate-800">{p.location}</span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Clock className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="block font-bold text-slate-400 uppercase tracking-widest text-[9px]">{t("portfolio.duration")}</span>
                      <span className="font-bold text-slate-800">{p.duration}</span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2 sm:col-span-2">
                    <Layers className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="block font-bold text-slate-400 uppercase tracking-widest text-[9px]">{t("portfolio.materials")}</span>
                      <span className="font-semibold text-slate-700">{p.materials}</span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2 sm:col-span-2">
                    <CheckSquare className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="block font-bold text-slate-400 uppercase tracking-widest text-[9px]">{t("portfolio.works")}</span>
                      <span className="font-medium text-slate-600 leading-relaxed">{p.works}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox Modal */}
        {lightboxImage && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <button 
              onClick={() => setLightboxImage(null)}
              className="absolute top-6 right-6 bg-slate-900 text-white p-3 rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="max-w-5xl max-h-[85vh] overflow-hidden rounded-lg">
              <img 
                src={lightboxImage} 
                alt="Vergrößerte Projektansicht" 
                className="w-full h-auto object-contain max-h-[80vh] shadow-2xl border-4 border-slate-900"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
