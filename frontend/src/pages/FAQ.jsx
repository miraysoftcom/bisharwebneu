import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLanguage } from "@/components/LanguageContext";
import { Search, ChevronDown, ChevronUp, MessageCircle, HelpCircle, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
const API = `${BACKEND_URL}/api`;

export default function FAQ() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [faqs, setFaqs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    axios.get(`${API}/faqs`)
      .then((res) => setFaqs(res.data))
      .catch((err) => console.error("Error fetching FAQs:", err));
  }, []);

  const categories = [
    { code: "all", label: "Alle Kategorien (100+)" },
    { code: "Allgemeine Fragen", label: "Allgemeine Fragen" },
    { code: "Offerten und Preise", label: "Offerten & Preise" },
    { code: "Plattenarbeiten", label: "Plattenarbeiten" },
    { code: "Bodenarbeiten", label: "Bodenarbeiten" },
    { code: "Abdichtung", label: "Bauwerks-Abdichtung" },
    { code: "Fugen und Silikon", label: "Fugen & Silikon" },
    { code: "Fassadenarbeiten", label: "Fassadenarbeiten" },
    { code: "Ablauf und Ausführung", label: "Projekt-Ablauf" },
    { code: "Material und Qualität", label: "Material & Qualität" },
    { code: "Zahlung, Garantie und Abnahme", label: "Zahlung & Gewährleistung" }
  ];

  const getFaqContent = (faq) => {
    switch (lang) {
      case "en":
        return {
          question: faq.question_en || faq.question_de,
          answer: faq.answer_en || faq.answer_de
        };
      case "it":
        return {
          question: faq.question_it || faq.question_de,
          answer: faq.answer_it || faq.answer_de
        };
      case "fr":
        return {
          question: faq.question_fr || faq.question_de,
          answer: faq.answer_fr || faq.answer_de
        };
      default:
        return {
          question: faq.question_de,
          answer: faq.answer_de
        };
    }
  };

  const filteredFaqs = faqs.filter(faq => {
    const content = getFaqContent(faq);
    const matchesSearch = content.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          content.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleOpen = (id) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="py-16 bg-[#FAF9F6] min-h-[85vh] animate-in fade-in duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-left space-y-4 mb-16 border-l-2 border-[#C5A880] pl-6">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C5A880]">
            KUNDEN-BILDUNG & TRANSPARENZ
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tighter text-slate-900 leading-none">
            FAQ & Wissenswertes (100 Positionen)
          </h1>
          <p className="text-sm font-semibold text-slate-500 max-w-2xl leading-relaxed">
            Haben Sie Fragen zur Plattenmontage, Bauwerksabdichtung nach SIA oder zur Kalkulation? Finden Sie detaillierte, ehrliche Antworten zu all unseren Arbeitsabläufen.
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8">
          {/* Search Box */}
          <div className="md:col-span-7 relative">
            <input 
              type="text"
              placeholder="Wonach suchen Sie? (z.B. SIA, Grossformate, Trocknungszeit...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-sm text-sm font-medium focus:ring-1 focus:ring-[#C5A880] focus:outline-none transition-shadow"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
          </div>

          {/* Category Filter */}
          <div className="md:col-span-5">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-sm text-xs font-black uppercase tracking-widest text-slate-700 focus:ring-1 focus:ring-[#C5A880] focus:outline-none"
            >
              {categories.map(cat => (
                <option key={cat.code} value={cat.code}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* FAQ Accordions */}
        <div className="space-y-4 bg-white border border-slate-200 p-6 sm:p-10 rounded shadow-sm">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => {
              const content = getFaqContent(faq);
              const isOpen = openId === faq.id;
              return (
                <div key={faq.id} className="border-b border-slate-100 last:border-none pb-4 last:pb-0">
                  <button
                    onClick={() => toggleOpen(faq.id)}
                    className="w-full flex items-center justify-between text-left py-4 hover:text-[#C5A880] transition-colors"
                  >
                    <div className="flex items-start space-x-3 pr-4">
                      <HelpCircle className="w-5 h-5 text-[#C5A880] mt-0.5 shrink-0" />
                      <span className="font-bold text-slate-900 tracking-tight text-sm sm:text-base">
                        {content.question}
                      </span>
                    </div>
                    {isOpen ? <ChevronUp className="w-5 h-5 shrink-0 text-slate-400" /> : <ChevronDown className="w-5 h-5 shrink-0 text-slate-400" />}
                  </button>
                  {isOpen && (
                    <div className="pl-8 pb-4 animate-in slide-in-from-top duration-250">
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
                        {content.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 space-y-3">
              <MessageCircle className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-500">Keine FAQs zu Ihrer Suche gefunden.</p>
            </div>
          )}
        </div>

        {/* Dynamic CTA at the bottom */}
        <div className="mt-12 bg-slate-900 text-white p-8 rounded border border-[#C5A880]/30 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="text-center sm:text-left space-y-1">
            <span className="text-[9px] font-bold text-[#C5A880] uppercase tracking-widest block">HABEN SIE EINE SPEZIELLE FRAGE?</span>
            <span className="text-sm font-bold text-slate-200">Wir beraten Sie gerne unverbindlich auch telefonisch oder vor Ort.</span>
          </div>
          <button 
            onClick={() => navigate("/contact")}
            className="gold-btn font-extrabold text-[10px] tracking-widest uppercase px-6 py-3.5 rounded-sm"
          >
            Kontakt Aufnehmen
          </button>
        </div>
      </div>
    </div>
  );
}
