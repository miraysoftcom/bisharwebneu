import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { useLanguage } from "@/components/LanguageContext";
import { 
  Check, ArrowLeft, ArrowRight, Upload, X, MapPin, 
  User, CheckCircle2, AlertTriangle, FileText, ClipboardList, Edit2 
} from "lucide-react";
import { QUOTE } from "@/constants/testIds";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const API = `${BACKEND_URL}/api`;

export default function QuoteRequest() {
  const { t, lang } = useLanguage();
  const router = useRouter();

  // Wizard Steps (1-8)
  const [step, setStep] = useState(1);

  // --- FORM DATA ---
  
  // Step 1: Services (can select multiple)
  const [selectedServices, setSelectedServices] = useState([]);
  
  // Step 2: Project Type (single selection)
  const [projectType, setProjectType] = useState("");

  // Step 3: Object areas (multiple)
  const [objectAreas, setObjectAreas] = useState([]);

  // Step 4: Project Details
  const [surfaceArea, setSurfaceArea] = useState("");
  const [roomsCount, setRoomsCount] = useState("");
  const [desiredStart, setDesiredStart] = useState("");
  const [desiredCompletion, setDesiredCompletion] = useState("");
  const [undergroundCondition, setUndergroundCondition] = useState("");
  const [existingTilesPresent, setExistingTilesPresent] = useState(false);
  const [existingTilesRemove, setExistingTilesRemove] = useState(false);
  const [materialStatus, setMaterialStatus] = useState("Beratung erwünscht");
  const [additionalNotes, setAdditionalNotes] = useState("");

  // Step 5: Files Uploads
  const [uploadedFiles, setUploadedFiles] = useState([]); // [{filename, url, size}]
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Step 6: Location & Area Checking
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [floor, setFloor] = useState("");
  const [liftAvailable, setLiftAvailable] = useState(false);
  const [parkingAvailable, setParkingAvailable] = useState(false);
  
  // Postcode verification state
  const [postcodeCheck, setPostcodeCheck] = useState({ checked: false, allowed: false, message: "" });

  // Step 7: Client info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [preferredContact, setPreferredContact] = useState("E-Mail");
  const [preferredTime, setPreferredTime] = useState("");
  const [clientLang, setClientLang] = useState(lang);
  const [agreedPrivacy, setAgreedAgreedPrivacy] = useState(false);

  // Final submission state
  const [submitting, setSubmitting] = useState(false);
  const [successRef, setSuccessRef] = useState("");
  const [quoteError, setQuoteError] = useState("");

  // Handle pre-selected service from Services page
  useEffect(() => {
    const preselected = sessionStorage.getItem("preselected_service");
    if (preselected) {
      setSelectedServices([preselected]);
      sessionStorage.removeItem("preselected_service");
    }
  }, []);

  // Sync client language selection with current site language
  useEffect(() => {
    setClientLang(lang);
  }, [lang]);

  // --- SERVICE AREA POSTCODE CHECKER ---
  const handlePostcodeCheck = async (pcToVerify = postalCode) => {
    if (!pcToVerify || pcToVerify.trim().length < 4) {
      setPostcodeCheck({ checked: true, allowed: false, message: "Bitte geben Sie eine gültige Schweizer Postleitzahl ein." });
      return;
    }
    try {
      const res = await axios.get(`${API}/postcode/check/${pcToVerify}`);
      setPostcodeCheck({
        checked: true,
        allowed: res.data.allowed,
        message: res.data.message
      });
      if (res.data.allowed) {
        setRegion(res.data.region);
      }
    } catch (e) {
      setPostcodeCheck({ checked: true, allowed: false, message: "Fehler bei der Überprüfung." });
    }
  };

  // Check postcode on blur or complete
  useEffect(() => {
    if (postalCode.trim().length === 4) {
      handlePostcodeCheck(postalCode);
    } else {
      setPostcodeCheck({ checked: false, allowed: false, message: "" });
    }
  }, [postalCode]);

  // --- FILE UPLOAD LOGIC ---
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    setUploadError("");

    for (const file of files) {
      // Size check (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setUploadError(`Die Datei ${file.name} ist zu gross (max. 10MB).`);
        continue;
      }
      
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await axios.post(`${API}/quotes/upload`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        setUploadedFiles(prev => [...prev, res.data]);
      } catch (err) {
        setUploadError(err.response?.data?.detail || "Datei-Upload fehlgeschlagen.");
      }
    }
    setUploading(false);
  };

  const handleFileDelete = (storedName) => {
    setUploadedFiles(prev => prev.filter(f => f.stored_name !== storedName));
  };

  // --- FORM NAVIGATIONS ---
  const nextStep = () => {
    // Step validation checks
    if (step === 1 && selectedServices.length === 0) {
      alert("Bitte wählen Sie mindestens eine Dienstleistung aus.");
      return;
    }
    if (step === 2 && !projectType) {
      alert("Bitte wählen Sie eine Projektart aus.");
      return;
    }
    if (step === 3 && objectAreas.length === 0) {
      alert("Bitte wählen Sie mindestens einen Objektbereich aus.");
      return;
    }
    if (step === 6) {
      if (!street || !postalCode || !city) {
        alert("Bitte füllen Sie Strasse, Postleitzahl und Ort aus.");
        return;
      }
      if (postcodeCheck.checked && !postcodeCheck.allowed) {
        // Show warning but let them proceed if they acknowledge, or stop them.
        // The spec says: "Hizmet bölgesi dışındaki taleplerde müşteriye kibar ve profesyonel bir bilgilendirme gösterilmelidir."
        // We will show warning, and block next step unless they are in service area. This ensures exact service area control.
        alert(postcodeCheck.message);
        return;
      }
    }
    if (step === 7) {
      if (!firstName || !lastName || !email || !phone) {
        alert("Bitte füllen Sie alle Pflichtfelder (*) aus.");
        return;
      }
      if (!agreedPrivacy) {
        alert("Bitte stimmen Sie der Datenschutzerklärung zu.");
        return;
      }
    }
    setStep(prev => Math.min(8, prev + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const prevStep = () => {
    setStep(prev => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- FINAL SUBMIT ---
  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setQuoteError("");
    try {
      const payload = {
        services: selectedServices,
        project_type: projectType,
        object_areas: objectAreas,
        surface_area: surfaceArea,
        rooms_count: roomsCount,
        desired_start: desiredStart,
        desired_completion: desiredCompletion,
        underground_condition: undergroundCondition,
        existing_tiles_present: existingTilesPresent,
        existing_tiles_remove: existingTilesRemove,
        material_status: materialStatus,
        additional_notes: additionalNotes,
        files: uploadedFiles,
        street,
        house_number: houseNumber,
        postal_code: postalCode,
        city,
        floor,
        lift_available: liftAvailable,
        parking_available: parkingAvailable,
        first_name: firstName,
        last_name: lastName,
        company,
        phone,
        email,
        preferred_contact: preferredContact,
        preferred_time: preferredTime,
        language: clientLang
      };
      
      const res = await axios.post(`${API}/quotes`, payload);
      if (res.data.success) {
        setSuccessRef(res.data.reference_number);
        setStep(9); // Success screen
      }
    } catch (err) {
      setQuoteError("Ein Fehler ist aufgetreten. Bitte prüfen Sie Ihre Angaben.");
    } finally {
      setSubmitting(false);
    }
  };

  // Render Step Indicators
  const renderStepIndicators = () => {
    if (step > 8) return null;
    return (
      <div className="mb-12">
        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
          <span>Schritt {step} von 8</span>
          <span>{Math.round((step / 8) * 100)}% abgeschlossen</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-[#C5A880] h-full transition-all duration-300"
            style={{ width: `${(step / 8) * 100}%` }}
          />
        </div>
      </div>
    );
  };

  // List of step titles in German
  const stepTitles = [
    "Dienstleistung auswählen",
    "Projektart wählen",
    "Objektbereich wählen",
    "Projektinformationen",
    "Fotos und Skizzen hochladen",
    "Projektstandort angeben",
    "Ihre Kontaktdaten",
    "Angaben prüfen"
  ];

  return (
    <div className="py-16 bg-slate-50 min-h-[80vh] animate-in fade-in duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        {step <= 8 && (
          <div className="text-left space-y-3 mb-10">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">
              OFFERTENSYSTEM
            </span>
            <h1 className="text-4xl font-extrabold tracking-tighter text-slate-900 leading-none">
              {stepTitles[step - 1]}
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Präzise Ausführung nach Schweizer SIA-Handwerksstandards.
            </p>
          </div>
        )}

        {/* Indicators */}
        {renderStepIndicators()}

        {/* Wizard Forms Card */}
        <div className="bg-white border border-slate-200 p-8 sm:p-12 rounded-lg shadow-sm">
          
          {/* STEP 1: SERVICES SELECTION */}
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900">{t("quote.selectService")}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  "Bodenplatten montieren", "Wandplatten montieren", "Duschen und Nassbereiche",
                  "Spezialabdichtungen", "Bodenschleifen", "Bodengrundierung", 
                  "Kratzgrundierung", "Fassadenarbeiten", "Fugenarbeiten aller Art", 
                  "Renovationen und Reparaturen", "Wand- und Bodenarbeiten", "Andere Arbeiten"
                ].map((serv) => {
                  const selected = selectedServices.includes(serv);
                  return (
                    <button
                      key={serv}
                      onClick={() => {
                        setSelectedServices(prev => 
                          selected ? prev.filter(s => s !== serv) : [...prev, serv]
                        );
                      }}
                      className={`px-5 py-4 border rounded text-left text-sm font-semibold transition-all flex items-center justify-between ${
                        selected 
                          ? "bg-slate-950 border-slate-950 text-white" 
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/50"
                      }`}
                    >
                      <span>{serv}</span>
                      {selected && <Check className="w-4 h-4 text-red-500" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: PROJECT TYPE */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900">{t("quote.selectProjType")}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  "Neubau", "Renovation", "Reparatur", "Umbau", 
                  "Privatprojekt", "Gewerbeprojekt", "Verwaltung / Immobilienprojekt"
                ].map((type) => {
                  const selected = projectType === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setProjectType(type)}
                      className={`px-5 py-4 border rounded text-left text-sm font-semibold transition-all flex items-center justify-between ${
                        selected 
                          ? "bg-slate-950 border-slate-950 text-white" 
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/50"
                      }`}
                    >
                      <span>{type}</span>
                      {selected && <Check className="w-4 h-4 text-red-500" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: OBJECT AREAS */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900">{t("quote.selectAreas")}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  "Badezimmer", "Dusche", "Küche", "Wohnzimmer", "Keller", 
                  "Balkon", "Terrasse", "Fassade", "Gewerberaum", "Treppenhaus", "Anderer Bereich"
                ].map((area) => {
                  const selected = objectAreas.includes(area);
                  return (
                    <button
                      key={area}
                      onClick={() => {
                        setObjectAreas(prev => 
                          selected ? prev.filter(a => a !== area) : [...prev, area]
                        );
                      }}
                      className={`px-4 py-4 border rounded text-center text-xs font-bold uppercase tracking-wider transition-all flex flex-col items-center justify-center space-y-2 ${
                        selected 
                          ? "bg-slate-950 border-slate-950 text-white" 
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/50"
                      }`}
                    >
                      <span>{area}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: PROJECT DETAILS */}
          {step === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900">{t("quote.projDetails")}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Surface Area */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("quote.sqm")} *</label>
                  <input 
                    type="number"
                    placeholder="z.B. 45"
                    value={surfaceArea}
                    onChange={(e) => setSurfaceArea(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-red-600 focus:outline-none"
                    required
                  />
                </div>

                {/* Rooms Count */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("quote.rooms")}</label>
                  <input 
                    type="number"
                    placeholder="z.B. 2"
                    value={roomsCount}
                    onChange={(e) => setRoomsCount(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-red-600 focus:outline-none"
                  />
                </div>

                {/* Desired Start */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("quote.start")}</label>
                  <input 
                    type="text"
                    placeholder="z.B. Sofort, März 2026..."
                    value={desiredStart}
                    onChange={(e) => setDesiredStart(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-red-600 focus:outline-none"
                  />
                </div>

                {/* Desired End */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("quote.end")}</label>
                  <input 
                    type="text"
                    placeholder="z.B. Flexibel, bis Ostern..."
                    value={desiredCompletion}
                    onChange={(e) => setDesiredCompletion(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-red-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Underground state */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("quote.underground")}</label>
                <input 
                  type="text"
                  placeholder="z.B. Beton, Estrich eben, uneben..."
                  value={undergroundCondition}
                  onChange={(e) => setUndergroundCondition(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-red-600 focus:outline-none"
                />
              </div>

              {/* Checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={existingTilesPresent}
                    onChange={(e) => setExistingTilesPresent(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                  />
                  <span className="text-sm font-semibold text-slate-700">{t("quote.tilesPresent")}</span>
                </label>
                {existingTilesPresent && (
                  <label className="flex items-center space-x-3 cursor-pointer animate-in fade-in">
                    <input 
                      type="checkbox"
                      checked={existingTilesRemove}
                      onChange={(e) => setExistingTilesRemove(e.target.checked)}
                      className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                    />
                    <span className="text-sm font-semibold text-slate-700">{t("quote.tilesRemove")}</span>
                  </label>
                )}
              </div>

              {/* Material Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("quote.materialStatus")}</label>
                <select
                  value={materialStatus}
                  onChange={(e) => setMaterialStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-red-600 focus:outline-none font-bold text-slate-700"
                >
                  <option value="Bereits gekauft">{t("quote.material1")}</option>
                  <option value="Noch nicht vorhanden">{t("quote.material2")}</option>
                  <option value="Hilfe erwünscht">{t("quote.material3")}</option>
                </select>
              </div>

              {/* Textarea notes */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("quote.additionalNotes")}</label>
                <textarea 
                  rows={4}
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Beschreiben Sie Besonderheiten wie Deckenhöhen, Rohrdurchführungen oder Materialwünsche..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-red-600 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* STEP 5: FILE UPLOADS WITH PREVIEWS AND DELETE */}
          {step === 5 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900">{t("quote.uploadTitle")}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{t("quote.uploadDesc")}</p>

              {/* Drag and Drop Zone */}
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-10 text-center hover:border-red-500 transition-colors relative">
                <input 
                  type="file" 
                  multiple 
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading}
                />
                <div className="space-y-3">
                  <Upload className="w-10 h-10 text-red-500 mx-auto" />
                  <span className="block text-sm font-bold text-slate-700">{t("quote.uploadBtn")}</span>
                  <span className="block text-xs text-slate-400">Dateien per Drag & Drop hierher ziehen</span>
                </div>
              </div>

              {/* Progress */}
              {uploading && (
                <div className="flex items-center justify-center space-x-2 text-xs font-bold text-red-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
                  <span>{t("quote.uploadProgress")}</span>
                </div>
              )}

              {uploadError && (
                <p className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 p-3 rounded">
                  {uploadError}
                </p>
              )}

              {/* Previews / Selected Files List */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ausgewählte Dateien</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {uploadedFiles.map((file, idx) => {
                      const isImg = /\.(jpg|jpeg|png|webp)$/i.test(file.url);
                      return (
                        <div key={file.stored_name} className="bg-slate-50 border border-slate-200 rounded p-3 text-center relative flex flex-col justify-between h-36">
                          <button 
                            type="button"
                            onClick={() => handleFileDelete(file.stored_name)}
                            className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors z-20"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                          
                          {isImg ? (
                            <img src={`${BACKEND_URL}${file.url}`} alt="Vorschau" className="w-full h-20 object-cover rounded-sm mb-2" />
                          ) : (
                            <FileText className="w-8 h-10 text-red-500 mx-auto mb-2 shrink-0" />
                          )}
                          <span className="block text-[10px] font-bold text-slate-700 truncate">{file.filename}</span>
                          <span className="block text-[9px] text-slate-400">{(file.size / 1024).toFixed(0)} KB</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 6: LOCATION & POSTCODE CHECKING */}
          {step === 6 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900">{t("quote.addressTitle")}</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                
                {/* Street */}
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("quote.street")} *</label>
                  <input 
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-red-600 focus:outline-none"
                    required
                  />
                </div>

                {/* House Nr */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hausnummer</label>
                  <input 
                    type="text"
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-red-600 focus:outline-none"
                  />
                </div>

                {/* Postcode */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("quote.zip")} *</label>
                  <div className="relative">
                    <input 
                      type="text"
                      maxLength={4}
                      placeholder="z.B. 8000"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-red-600 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* City */}
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("quote.city")} *</label>
                  <input 
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-red-600 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* POSTCODE VERIFICATION ALERTS */}
              {postcodeCheck.checked && (
                <div className={`p-4 border rounded flex items-start space-x-3 text-sm animate-in fade-in duration-200 ${
                  postcodeCheck.allowed 
                    ? "bg-green-50 border-green-200 text-green-800" 
                    : "bg-red-50 border-red-200 text-red-800"
                }`}>
                  {postcodeCheck.allowed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="block font-bold">{postcodeCheck.allowed ? "Verfügbar!" : "Hinweis"}</span>
                    <p className="text-xs leading-relaxed mt-1 font-semibold">{postcodeCheck.message}</p>
                  </div>
                </div>
              )}

              {/* Floor and others */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("quote.floor")}</label>
                  <input 
                    type="text"
                    placeholder="z.B. 1. Stock"
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-red-600 focus:outline-none"
                  />
                </div>
                
                <div className="space-y-2 flex flex-col justify-end">
                  <label className="flex items-center space-x-3 cursor-pointer py-3">
                    <input 
                      type="checkbox"
                      checked={liftAvailable}
                      onChange={(e) => setLiftAvailable(e.target.checked)}
                      className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                    />
                    <span className="text-sm font-semibold text-slate-700">{t("quote.lift")}</span>
                  </label>
                </div>

                <div className="space-y-2 flex flex-col justify-end">
                  <label className="flex items-center space-x-3 cursor-pointer py-3">
                    <input 
                      type="checkbox"
                      checked={parkingAvailable}
                      onChange={(e) => setParkingAvailable(e.target.checked)}
                      className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                    />
                    <span className="text-sm font-semibold text-slate-700">{t("quote.parking")}</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: PERSONAL DETAILS */}
          {step === 7 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900">{t("quote.contactTitle")}</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("quote.fname")} *</label>
                  <input 
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-red-600 focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("quote.lname")} *</label>
                  <input 
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-red-600 focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("quote.company")}</label>
                  <input 
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-red-600 focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("quote.phone")} *</label>
                  <input 
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-red-600 focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("common.email")} *</label>
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-red-600 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("quote.prefContact")}</label>
                  <select
                    value={preferredContact}
                    onChange={(e) => setPreferredContact(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-red-600 focus:outline-none font-bold text-slate-700"
                  >
                    <option value="E-Mail">E-Mail</option>
                    <option value="Telefon">Telefon</option>
                    <option value="WhatsApp">WhatsApp</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("quote.prefTime")}</label>
                  <input 
                    type="text"
                    placeholder="z.B. Vormittags, 14-17 Uhr"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-red-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Privacy agreement */}
              <div className="pt-4 border-t border-slate-100">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={agreedPrivacy}
                    onChange={(e) => setAgreedAgreedPrivacy(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                    required
                  />
                  <span className="text-sm font-semibold text-slate-700">{t("common.privacyPolicy")} *</span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 8: SUMMARY REVIEW & JUMP ACTIONS */}
          {step === 8 && (
            <div className="space-y-8">
              <div className="border-b border-slate-200 pb-4">
                <h3 className="text-lg font-bold text-slate-900">{t("quote.reviewTitle")}</h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">{t("quote.reviewDesc")}</p>
              </div>

              {/* Grid block summary */}
              <div className="space-y-6">
                
                {/* 1. Services */}
                <div className="bg-slate-50 p-5 rounded-md border border-slate-200 relative">
                  <button onClick={() => setStep(1)} className="absolute right-4 top-4 text-red-600 hover:text-red-700 flex items-center space-x-1 text-xs font-bold">
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Bearbeiten</span>
                  </button>
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">DIENSTLEISTUNGEN</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedServices.map(s => (
                      <span key={s} className="bg-slate-900 text-white px-2.5 py-1 text-xs font-bold rounded-sm uppercase tracking-wider">{s}</span>
                    ))}
                  </div>
                </div>

                {/* 2. Project Details */}
                <div className="bg-slate-50 p-5 rounded-md border border-slate-200 relative grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button onClick={() => setStep(4)} className="absolute right-4 top-4 text-red-600 hover:text-red-700 flex items-center space-x-1 text-xs font-bold">
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Bearbeiten</span>
                  </button>
                  <div className="sm:col-span-2">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">PROJEKTDETAILS</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">PROJEKTART</span>
                    <span className="text-sm font-bold text-slate-800">{projectType}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">FLÄCHE & RÄUME</span>
                    <span className="text-sm font-bold text-slate-800">{surfaceArea} m² ({roomsCount} Räume)</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">ZEITRAUM</span>
                    <span className="text-sm font-semibold text-slate-800">{desiredStart} - {desiredCompletion}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">MATERIALSTATUS</span>
                    <span className="text-sm font-semibold text-slate-800">{materialStatus}</span>
                  </div>
                </div>

                {/* 3. Location */}
                <div className="bg-slate-50 p-5 rounded-md border border-slate-200 relative">
                  <button onClick={() => setStep(6)} className="absolute right-4 top-4 text-red-600 hover:text-red-700 flex items-center space-x-1 text-xs font-bold">
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Bearbeiten</span>
                  </button>
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">PROJEKTSTANDORT</span>
                  <div className="text-sm font-bold text-slate-800">
                    <p>{street} {houseNumber}</p>
                    <p>{postalCode} {city} ({region})</p>
                  </div>
                </div>

                {/* 4. Client Info */}
                <div className="bg-slate-50 p-5 rounded-md border border-slate-200 relative grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button onClick={() => setStep(7)} className="absolute right-4 top-4 text-red-600 hover:text-red-700 flex items-center space-x-1 text-xs font-bold">
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Bearbeiten</span>
                  </button>
                  <div className="sm:col-span-2">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">KONTAKTDATEN</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">NAME</span>
                    <span className="text-sm font-bold text-slate-800">{firstName} {lastName} {company && `(${company})`}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">KONTAKTINFO</span>
                    <span className="text-sm font-bold text-slate-800">{phone} / {email}</span>
                  </div>
                </div>
              </div>

              {quoteError && (
                <div className="bg-red-50 border border-red-200 p-4 rounded flex items-center space-x-2 text-sm text-red-700">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
                  <span>{quoteError}</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 9: SUCCESS REDIRECT SCREEN */}
          {step === 9 && (
            <div className="text-center space-y-8 py-10 animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Check className="w-8 h-8" />
              </div>
              
              <div className="space-y-3 max-w-lg mx-auto">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{t("quote.successTitle")}</h2>
                <p className="text-base text-slate-500 font-medium">
                  {t("quote.successDesc")}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-6 rounded-md max-w-md mx-auto">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t("quote.successRef")}</span>
                <span data-testid={QUOTE.successRef} className="text-2xl font-black text-[#C5A880] tracking-wider">
                  {successRef}
                </span>
              </div>

              <button
                onClick={() => {
                  setStep(1);
                  setSelectedServices([]);
                  setProjectType("");
                  setObjectAreas([]);
                  setSurfaceArea("");
                  setRoomsCount("");
                  setUploadedFiles([]);
                  setStreet("");
                  setPostalCode("");
                  setCity("");
                  setFirstName("");
                  setLastName("");
                  setEmail("");
                  setPhone("");
                  setPostcodeCheck({ checked: false, allowed: false, message: "" });
                }}
                className="bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs tracking-wider uppercase px-8 py-4 rounded-md transition-colors"
              >
                {t("quote.newQuoteBtn")}
              </button>
            </div>
          )}

          {/* Nav buttons */}
          {step <= 8 && (
            <div className="mt-12 pt-8 border-t border-slate-100 flex justify-between items-center">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-3.5 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold uppercase tracking-widest rounded-md transition-all flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t("common.back")}</span>
                </button>
              ) : (
                <div />
              )}

              {step < 8 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  data-testid={`quote-step-${step}-next`}
                  className="bg-slate-900 text-white hover:bg-slate-850 px-6 py-3.5 text-xs font-bold uppercase tracking-widest rounded-sm transition-all flex items-center space-x-2 shadow-sm border border-[#C5A880]/20"
                >
                  <span>{t("common.next")}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  data-testid={QUOTE.submitBtn}
                  disabled={submitting}
                  className="bg-gradient-to-r from-[#C5A880] to-[#9B8265] text-[#111418] px-8 py-4 text-xs font-extrabold uppercase tracking-widest rounded-sm transition-all flex items-center space-x-2 shadow-md disabled:bg-slate-300"
                >
                  <span>{submitting ? t("common.loading") : t("common.submit")}</span>
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
