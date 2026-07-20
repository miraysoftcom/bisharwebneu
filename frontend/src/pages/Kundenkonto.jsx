import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@/components/AuthContext";
import { useLanguage } from "@/components/LanguageContext";
import { 
  User, Lock, FileText, Download, Check, X, Send, MessageCircle, 
  FileSignature, CheckCircle2, ShieldCheck, AlertTriangle
} from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const API = `${BACKEND_URL}/api`;

export default function Kundenkonto() {
  const { t, lang } = useLanguage();
  
  // --- CUSTOMER LOGIN STATES ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [kundenUser, setKundenUser] = useState(null); // Customer local state
  
  // --- MY QUOTES & CONTRACTS ---
  const [myQuotes, setMyQuotes] = useState([]);
  const [selectedQuote, setSelectedQuote] = useState(null);
  
  // Signature Modal / Accepting Offerte
  const [isSigning, setIsSigning] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [signerCompany, setSignerCompany] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [submittingSign, setSubmittingSign] = useState(false);

  // Chat/Messaging
  const [quoteMessages, setQuoteMessages] = useState([]);
  const [newChatMessage, setNewChatMessage] = useState("");

  const handleKundenLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setLoginError("Bitte alle Felder ausfüllen.");
      return;
    }
    setLoginLoading(true);
    setLoginError("");
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      if (response.data.user) {
        setKundenUser(response.data.user);
        fetchMyQuotes(response.data.user.email);
      }
    } catch (err) {
      setLoginError(err.response?.data?.detail || "Giriş başarısız. Lütfen şifrenizi kontrol edin.");
    } finally {
      setLoginLoading(false);
    }
  };

  const fetchMyQuotes = async (clientEmail) => {
    try {
      // Admin route usually lists all, but let's query quotes matching this email
      const res = await axios.get(`${API}/admin/quotes`); // Falls admin access token available, or public filter
      // Filter locally for customer safety
      const filtered = res.data.filter(q => q.email?.toLowerCase() === clientEmail?.toLowerCase());
      setMyQuotes(filtered);
    } catch (err) {
      console.error("Quotes fetch error:", err);
    }
  };

  const handleLogout = () => {
    setKundenUser(null);
    setMyQuotes([]);
    setSelectedQuote(null);
  };

  // Chat message fetch
  const fetchQuoteMessages = async (quoteId) => {
    try {
      const res = await axios.get(`${API}/quotes/${quoteId}/messages`);
      setQuoteMessages(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (selectedQuote) {
      fetchQuoteMessages(selectedQuote.id);
    }
  }, [selectedQuote]);

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!newChatMessage.trim() || !selectedQuote) return;
    try {
      await axios.post(`${API}/quotes/${selectedQuote.id}/messages`, {
        sender: "Client",
        message: newChatMessage
      });
      setNewChatMessage("");
      fetchQuoteMessages(selectedQuote.id);
    } catch (e) {
      alert("Fehler beim Senden.");
    }
  };

  const handleSignSubmit = async (e) => {
    e.preventDefault();
    if (!signerName || !agreedTerms) {
      alert("Bitte füllen Sie den Namen aus und stimmen Sie den AGB zu.");
      return;
    }
    setSubmittingSign(true);
    try {
      const payload = {
        signer_name: signerName,
        signer_company: signerCompany,
        ip_address: "127.0.0.1",
        user_agent: navigator.userAgent,
        signature_svg: "[SCREEN DRAWN DIGITAL SIGNATURE]" // Simulated canvas path
      };
      
      const res = await axios.post(`${API}/quotes/token/${selectedQuote.secure_token}/accept`, payload);
      if (res.data.success) {
        alert(`Sözleşme başarıyla imzalandı! Protokol numarası: ${res.data.contract_number}`);
        setIsSigning(false);
        // Reload details
        const updated = await axios.get(`${API}/quotes/token/${selectedQuote.secure_token}`);
        setSelectedQuote(updated.data);
        fetchMyQuotes(kundenUser.email);
      }
    } catch (err) {
      alert("Hata oluştu.");
    } finally {
      setSubmittingSign(false);
    }
  };

  const safeNum = (val) => {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  // Calculate totals safely
  const subtotal = selectedQuote ? (selectedQuote.items || []).reduce((acc, item) => acc + (safeNum(item.qty) * safeNum(item.unit_price)), 0) : 0;
  const discountAmount = subtotal * (safeNum(selectedQuote?.discount_pct || 0) / 100);
  const subtotalWithDiscount = subtotal - discountAmount;
  const mwstAmount = selectedQuote?.mwst_active ? (subtotalWithDiscount * (safeNum(selectedQuote.mwst_rate) / 100)) : 0;
  const grandTotal = subtotalWithDiscount + mwstAmount;

  // --- SECT 1: CLIENT SIGN IN SCREEN ---
  if (!kundenUser) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-[#FAF9F6] py-16 px-4">
        <div className="max-w-md w-full bg-white border border-[#C5A880]/20 p-8 sm:p-12 rounded shadow-xl space-y-6">
          <div className="text-center space-y-3">
            <User className="w-12 h-12 text-[#C5A880] mx-auto" />
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Kundenportal Anmeldung</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Giriş yapın ve tekliflerinizi yönetin.</p>
          </div>

          <form onSubmit={handleKundenLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">E-Mail-Adresse</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-[#C5A880] focus:outline-none"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Passwort</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-[#C5A880] focus:outline-none"
                required
              />
            </div>

            {loginError && (
              <div className="bg-red-50 border border-red-200 p-3 rounded flex items-center space-x-2 text-xs text-red-700">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-slate-900 text-white hover:bg-slate-800 py-3.5 rounded text-xs font-bold uppercase tracking-widest transition-colors disabled:bg-slate-700"
            >
              {loginLoading ? "Wird geladen..." : "Eintreten"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- SECT 2: CLIENT PORTAL HOME (MEINE OFFERTEN) ---
  return (
    <div className="py-16 bg-[#FAF9F6] min-h-[80vh] animate-in fade-in duration-350">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#C5A880]/15 pb-6">
          <div>
            <span className="text-xs font-bold text-[#C5A880] uppercase tracking-widest">Willkommen</span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mt-1">
              Kundenkonto: {kundenUser.name}
            </h1>
          </div>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 border border-slate-300 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-100 bg-white rounded-sm"
          >
            Sitzung beenden (Abmelden)
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Quotes List Panel */}
          <div className="lg:col-span-4 bg-white border border-slate-200 p-6 rounded shadow-sm space-y-6">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Meine Offerten und Verträge</h3>
            
            <div className="space-y-3">
              {myQuotes.map(q => (
                <button
                  key={q.id}
                  onClick={() => setSelectedQuote(q)}
                  className={`w-full text-left p-4 border rounded transition-all flex flex-col justify-between h-28 ${
                    selectedQuote && selectedQuote.id === q.id 
                      ? "border-[#C5A880] bg-[#C5A880]/5" 
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100/50"
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="font-bold text-slate-900">{q.reference_number}</span>
                    <span className="text-[9px] font-black uppercase bg-slate-900 text-[#C5A880] px-2 py-0.5 rounded-sm">
                      {q.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-semibold">
                    <p>{q.services.join(", ")}</p>
                    <p className="text-[10px] mt-1">{new Date(q.created_at).toLocaleDateString()}</p>
                  </div>
                </button>
              ))}

              {myQuotes.length === 0 && (
                <p className="text-xs text-slate-400 italic">Keine Offertenanfragen unter Ihrer E-Mail gefunden.</p>
              )}
            </div>
          </div>

          {/* Active Offer Details & Signature Pane */}
          <div className="lg:col-span-8">
            {selectedQuote ? (
              <div className="bg-white border border-slate-200 p-8 rounded shadow-sm space-y-8 animate-in fade-in" key={selectedQuote.id}>
                
                {/* Proposal Header */}
                <div className="flex justify-between items-center border-b pb-4 border-slate-150">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Detailansicht</span>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                      Offerte {selectedQuote.reference_number}
                    </h2>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => window.open(`${API}/quotes/${selectedQuote.id}/pdf`, "_blank")}
                      className="bg-slate-100 hover:bg-[#C5A880] hover:text-slate-950 px-3 py-1.5 rounded transition-all text-xs font-bold uppercase tracking-wider flex items-center space-x-1 border border-slate-200"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Offerte PDF</span>
                    </button>
                    {selectedQuote.status === "Akzeptiert" && (
                      <button 
                        onClick={() => window.open(`${API}/quotes/${selectedQuote.id}/contract-pdf`, "_blank")}
                        className="bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded transition-all text-xs font-bold uppercase tracking-wider flex items-center space-x-1 border border-green-200 text-green-700"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Vertrag PDF</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Items and prices table */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-[#C5A880] tracking-widest">Kalkulierte Positionen</h4>
                  <div className="border border-slate-100 rounded overflow-hidden divide-y divide-slate-100">
                    {selectedQuote.items && selectedQuote.items.length > 0 ? (
                      selectedQuote.items.map((it, i) => (
                        <div key={i} className="p-4 text-xs font-bold flex justify-between bg-slate-50/50">
                          <div>
                            <p className="text-slate-900">{it.description}</p>
                            <p className="text-slate-400 text-[10px] mt-0.5">{it.qty} {it.unit || "m²"} x CHF {it.unit_price?.toFixed(2)}</p>
                          </div>
                          <span className="text-slate-900">CHF {it.total_price?.toFixed(2)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="p-4 text-xs text-slate-400 italic font-semibold text-center bg-slate-50">Dieser Entwurf befindet sich aktuell in der Preisvorbereitung.</p>
                    )}
                  </div>

                  {/* Calculations Details */}
                  {selectedQuote.items && selectedQuote.items.length > 0 && (
                    <div className="p-5 border bg-[#FAF9F6] border-[#C5A880]/10 rounded max-w-md ml-auto text-xs font-bold space-y-2">
                      <div className="flex justify-between text-slate-500">
                        <span>Zwischensumme:</span>
                        <span>CHF {subtotal.toFixed(2)}</span>
                      </div>
                      {selectedQuote.discount_pct > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Zusatz-Rabatt ({selectedQuote.discount_pct}%):</span>
                          <span>- CHF {discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-500">
                        <span>MWST ({selectedQuote.mwst_rate}%):</span>
                        <span>{selectedQuote.mwst_active ? `CHF ${mwstAmount.toFixed(2)}` : "Deaktiviert"}</span>
                      </div>
                      <div className="flex justify-between text-sm border-t pt-2 font-black">
                        <span>GESAMTSUMME:</span>
                        <span className="text-[#C5A880]">CHF {grandTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Secure Messaging chat with administrator */}
                <div className="bg-slate-50 border border-slate-200 p-6 rounded space-y-4">
                  <div className="flex items-center space-x-2 border-b pb-2 border-slate-200">
                    <MessageCircle className="w-4 h-4 text-[#C5A880]" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">İletişim ve Destek Odası</h4>
                  </div>
                  
                  <div className="space-y-3 max-h-40 overflow-y-auto border-b border-slate-200 pb-3">
                    {quoteMessages.map((m, i) => (
                      <div key={i} className={`p-3 rounded text-xs max-w-[85%] ${
                        m.sender === "Client" ? "bg-slate-900 text-white ml-auto" : "bg-white text-slate-800 border"
                      }`}>
                        <span className="block text-[9px] font-black opacity-60 mb-1 uppercase tracking-widest">
                          {m.sender === "Client" ? "İşveren (Siz)" : "Swiss Platten Temsilcisi"}
                        </span>
                        <p className="font-semibold">{m.message}</p>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSendChatMessage} className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Bir soru yazın veya detayları konuşun..."
                      value={newChatMessage}
                      onChange={(e) => setNewChatMessage(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-xs"
                    />
                    <button type="submit" className="bg-slate-900 text-white hover:bg-slate-850 px-4 py-2 text-xs font-bold uppercase rounded-sm">Gönder</button>
                  </form>
                </div>

                {/* Signature Panel */}
                {selectedQuote.status !== "Akzeptiert" && selectedQuote.items && selectedQuote.items.length > 0 && (
                  <div className="pt-6 border-t border-slate-100 flex flex-col items-center">
                    {!isSigning ? (
                      <button 
                        onClick={() => setIsSigning(true)}
                        className="bg-slate-900 text-[#C5A880] border border-[#C5A880] hover:bg-slate-850 font-black text-xs tracking-widest uppercase px-8 py-4 rounded-sm flex items-center space-x-2 shadow-xl"
                      >
                        <FileSignature className="w-4 h-4" />
                        <span>Ich akzeptiere die Offerte (Teklifi İmzala)</span>
                      </button>
                    ) : (
                      <form onSubmit={handleSignSubmit} className="w-full max-w-lg bg-slate-50 border border-[#C5A880]/15 p-6 rounded space-y-4 font-semibold text-xs uppercase tracking-widest text-slate-500 animate-in zoom-in-95 duration-200">
                        <div className="space-y-1">
                          <label>İmzalayan Adı & Soyadı *</label>
                          <input 
                            type="text" 
                            value={signerName}
                            placeholder="z.B. Max Muster"
                            onChange={(e) => setSignerName(e.target.value)}
                            className="w-full px-3 py-2 bg-white border rounded text-xs text-slate-800"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label>Firma / Şirket Adı (Opsiyonel)</label>
                          <input 
                            type="text" 
                            value={signerCompany}
                            placeholder="z.B. Muster AG"
                            onChange={(e) => setSignerCompany(e.target.value)}
                            className="w-full px-3 py-2 bg-white border rounded text-xs text-slate-800"
                          />
                        </div>

                        {/* Signature screen canvas placeholder */}
                        <div className="space-y-1.5 pt-2">
                          <label>Ekran Üzerinde Dijital İmzanız</label>
                          <div className="border border-dashed border-slate-300 bg-white h-24 rounded flex items-center justify-center text-[10px] text-slate-400">
                            İmzanızı fareniz veya parmağınızla buraya çizin [Simüle Edildi]
                          </div>
                        </div>

                        <div className="pt-3">
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={agreedTerms}
                              onChange={(e) => setAgreedTerms(e.target.checked)}
                              className="w-4 h-4 text-red-600 rounded" required
                            />
                            <span className="text-[10px] text-slate-650 leading-relaxed font-bold">Tüm İsviçre SIA handwerker ve AGB şartlarını kabul ediyorum. *</span>
                          </label>
                        </div>

                        <div className="flex gap-4 pt-2">
                          <button type="button" onClick={() => setIsSigning(false)} className="w-1/2 py-2.5 border text-slate-700 font-bold rounded-sm">İptal</button>
                          <button type="submit" disabled={submittingSign} className="w-1/2 bg-slate-900 text-[#C5A880] border border-[#C5A880] font-black rounded-sm">{submittingSign ? "İmzalanıyor..." : "Sözleşmeyi İmzala"}</button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

              </div>
            ) : (
              <div className="bg-white border border-dashed border-slate-300 p-16 rounded-lg text-center font-bold text-slate-400">
                Lütfen detayları incelemek için sol listeden bir teklif seçin.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
