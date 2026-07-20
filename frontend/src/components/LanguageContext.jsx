import React, { createContext, useContext, useEffect } from "react";
import { translations } from "@/constants/translations";

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const lang = "de";

  useEffect(() => {
    document.documentElement.lang = "de";
    localStorage.setItem("app_lang", "de");
  }, []);

  const t = (keyPath, fallbackText = "") => {
    const keys = keyPath.split(".");
    let result = translations["de"];
    for (const key of keys) {
      if (result && result[key] !== undefined) {
        result = result[key];
      } else {
        result = null;
        break;
      }
    }

    if (result !== null && result !== undefined) {
      return result;
    }

    return fallbackText || keyPath;
  };

  return (
    <LanguageContext.Provider value={{ lang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
