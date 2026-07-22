import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { Download, FileSignature, ShieldCheck, AlertTriangle, CheckCircle2 } from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const API = `${BACKEND_URL}/api`;

export default function QuoteTokenPage() {
  const router = useRouter();
  const { token } = router.query;

  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [signerName, setSignerName] = useState("");
  const [signerCompany, setSignerCompany] = useState("");
  const [signatureText, setSignatureText] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const fetchQuote = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API}/quotes/token/${token}`);
      setQuote(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Offerte konnte nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuote();
  }, [token]);

  const handleAccept = async (event) => {
    event.preventDefault();
    if (!signerName) {
      setError("Bitte geben Sie Ihren Namen ein.");
      return;
    }
    if (!signatureText.trim()) {
      setError("Bitte geben Sie Ihre digitale Unterschrift ein.");
      return;
    }
    if (!agreedTerms) {
      setError("Bitte stimmen Sie den AGB und Konditionen zu.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        signer_name: signerName,
        signer_company: signerCompany,
        ip_address: "0.0.0.0",
        user_agent: navigator.userAgent,
        signature_svg: `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="80"><text x="10" y="40" font-size="24">${signatureText}</text></svg>`
      };
      const res = await axios.post(`${API}/quotes/token/${token}/accept`, payload);
      if (res.data.success) {
        setSuccessMessage(`Offerte erfolgreich akzeptiert. Vertragsnummer: ${res.data.contract_number}`);
        fetchQuote();
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || "Akzeptieren fehlgeschlagen.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderItems = () => {
    if (!quote?.items || quote.items.length === 0) {
      return <p className="text-sm text-slate-500">Keine Positionen verfügbar.</p>;
    }

    return (
      <div className="space-y-2">
        {quote.items.map((item, index) => (
          <div key={index} className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded">
            <div className="col-span-2">
              <p className="font-semibold text-slate-900">{item.description}</p>
              <p className="text-[11px] text-slate-500 mt-1">{item.qty} {item.unit || "Stück"} × CHF {Number(item.unit_price || 0).toFixed(2)}</p>
            </div>
            <div className="text-right font-black text-slate-900">CHF {Number(item.total_price || item.qty * item.unit_price || 0).toFixed(2)}</div>
          </div>
        ))}
      </div>
    );
  };

  const accepted = quote?.status === "Akzeptiert";
  const hasQuote = !!quote;
  const createdDate = quote?.created_at ? new Date(quote.created_at).toLocaleDateString() : "-";

  return (
    <div className="min-h-screen bg-[#FAF9F6] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#C5A880] font-bold">Offerte</p>
              <h1 className="mt-3 text-3xl font-black text-slate-900">Ihr persönlicher Offerten-Link</h1>
              <p className="mt-2 text-sm text-slate-500 max-w-2xl">Hier können Sie Ihre Offerte prüfen, downloaden und online akzeptieren. Ihre Eingaben erzeugen eine rechtsverbindliche Unterschrift.</p>
            </div>
            <div className="space-y-2 text-right">
              <p className="text-sm font-semibold text-slate-700">Referenznummer</p>
              <p className="text-2xl font-black text-[#C5A880]">{quote?.reference_number || "-"}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Status</h2>
              <p className={`mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold ${accepted ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}`}>
                {accepted ? <CheckCircle2 className="w-4 h-4" /> : <FileSignature className="w-4 h-4" />} {quote?.status || "Lädt..."}
              </p>
              <div className="mt-6 text-sm space-y-3 text-slate-600">
                <div>
                  <p className="font-semibold text-slate-900">Kunde</p>
                  <p>{quote?.first_name} {quote?.last_name}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">E-Mail</p>
                  <p>{quote?.email || "-"}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Datum</p>
                  <p>{createdDate}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Aktionen</h2>
              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  onClick={() => quote && window.open(`${API}/quotes/${quote.id}/pdf`, "_blank")}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <Download className="w-4 h-4" /> Offerte herunterladen
                </button>
                {accepted && (
                  <button
                    type="button"
                    onClick={() => quote && window.open(`${API}/quotes/${quote.id}/contract-pdf`, "_blank")}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                  >
                    <ShieldCheck className="w-4 h-4" /> Vertrag herunterladen
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold">Offerte Zusammenfassung</p>
                  <h2 className="mt-3 text-xl font-black text-slate-900">Positionen & Preise</h2>
                </div>
                {quote?.items && quote.items.length > 0 && (
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{quote.items.length} Positionen</p>
                )}
              </div>

              {renderItems()}

              {quote?.items && quote.items.length > 0 && (
                <div className="mt-6 rounded-xl bg-[#FAF9F6] p-5 text-sm font-semibold text-slate-700">
                  <div className="flex justify-between mb-3"><span>Zwischensumme</span><span>CHF {Number(quote.items.reduce((sum, item) => sum + ((Number(item.qty) || 0) * (Number(item.unit_price) || 0)), 0)).toFixed(2)}</span></div>
                  {quote?.discount_pct > 0 && (
                    <div className="flex justify-between mb-3 text-red-700"><span>Rabatt ({quote.discount_pct}%)</span><span>- CHF {(Number(quote.items.reduce((sum, item) => sum + ((Number(item.qty) || 0) * (Number(item.unit_price) || 0)), 0)) * Number(quote.discount_pct || 0) / 100).toFixed(2)}</span></div>
                  )}
                  <div className="flex justify-between mb-3"><span>MWST ({quote?.mwst_rate || 0}%)</span><span>CHF {((Number(quote.items.reduce((sum, item) => sum + ((Number(item.qty) || 0) * (Number(item.unit_price) || 0)), 0)) - (Number(quote.discount_pct || 0) / 100 * Number(quote.items.reduce((sum, item) => sum + ((Number(item.qty) || 0) * (Number(item.unit_price) || 0)), 0)))) * (Number(quote.mwst_rate || 0) / 100)).toFixed(2)}</span></div>
                  <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-black text-slate-900"><span>Gesamtsumme</span><span>CHF {Number((Number(quote.items.reduce((sum, item) => sum + ((Number(item.qty) || 0) * (Number(item.unit_price) || 0)), 0)) - (Number(quote.discount_pct || 0) / 100 * Number(quote.items.reduce((sum, item) => sum + ((Number(item.qty) || 0) * (Number(item.unit_price) || 0)), 0)))) + ((Number(quote.items.reduce((sum, item) => sum + ((Number(item.qty) || 0) * (Number(item.unit_price) || 0)), 0)) - (Number(quote.discount_pct || 0) / 100 * Number(quote.items.reduce((sum, item) => sum + ((Number(item.qty) || 0) * (Number(item.unit_price) || 0)), 0)))) * (Number(quote.mwst_rate || 0) / 100))).toFixed(2)}</span></div>
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold">Online Akzeptieren</p>
                  <h2 className="mt-2 text-xl font-black text-slate-900">Digital unterschreiben</h2>
                </div>
                <FileSignature className="w-6 h-6 text-[#C5A880]" />
              </div>

              {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 inline-flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> {error}
                </div>
              )}
              {successMessage && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 inline-flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> {successMessage}
                </div>
              )}

              {loading ? (
                <p className="text-sm text-slate-500">Lädt...</p>
              ) : !hasQuote ? (
                <p className="text-sm text-slate-500">Offerte nicht gefunden.</p>
              ) : accepted ? (
                <div className="space-y-4 text-sm text-slate-600">
                  <p>Diese Offerte wurde bereits akzeptiert. Vielen Dank für Ihr Vertrauen.</p>
                  <p>Vertragsnummer: <span className="font-semibold text-slate-900">{quote.contract_number}</span></p>
                  <p>Falls Sie Fragen haben, kontaktieren Sie uns bitte.</p>
                </div>
              ) : (
                <form onSubmit={handleAccept} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                      Vollständiger Name
                      <input
                        type="text"
                        value={signerName}
                        onChange={(e) => setSignerName(e.target.value)}
                        className="mt-2 w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                        placeholder="Max Muster"
                        required
                      />
                    </label>
                    <label className="block text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                      Firma (optional)
                      <input
                        type="text"
                        value={signerCompany}
                        onChange={(e) => setSignerCompany(e.target.value)}
                        className="mt-2 w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                        placeholder="Muster AG"
                      />
                    </label>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Digitale Signatur</label>
                    <div className="h-36 rounded-lg border border-dashed border-slate-300 bg-white text-sm text-slate-400 flex items-stretch">
                      <div className="flex-1 flex items-center justify-center text-center px-4">
                        <div>
                          <div className="text-sm text-slate-400">Simulierte Signaturfläche</div>
                          <div className="mt-2 text-xs text-slate-500">Ihre Unterschrift wird beim Klick und Eingeben rechts als rechtsverbindlich registriert.</div>
                        </div>
                      </div>
                      <div className="w-1/3 border-l border-slate-200 p-3 bg-slate-50">
                        <label className="block text-xs font-semibold text-slate-600">Unterschrift (Type)</label>
                        <input
                          type="text"
                          value={signatureText}
                          onChange={(e) => setSignatureText(e.target.value)}
                          placeholder="Hier klicken und unterschreiben"
                          className="mt-2 w-full rounded border border-slate-200 bg-white px-2 py-2 text-sm"
                        />
                        <p className="mt-2 text-xs text-slate-400">Geben Sie Ihren Namen ein; beim Absenden wird dies als Signatur gespeichert.</p>
                      </div>
                    </div>
                  </div>

                  <label className="inline-flex items-start gap-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={agreedTerms}
                      onChange={(e) => setAgreedTerms(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border border-slate-300 text-[#C5A880]"
                    />
                    <span>
                      Ich stimme den <a href="/agb" className="underline text-[#C5A880]">AGB</a> und der <a href="/datenschutz" className="underline text-[#C5A880]">Datenschutzerklärung</a> zu und erkläre mich mit der rechtsverbindlichen Annahme dieser Offerte einverstanden.
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-3 text-sm font-black uppercase tracking-[0.15em] text-[#C5A880] hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {submitting ? "Akzeptieren..." : "Offerte akzeptieren und unterschreiben"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
