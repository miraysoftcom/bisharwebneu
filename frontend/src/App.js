import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { LanguageProvider } from "@/components/LanguageContext";
import { AuthProvider } from "@/components/AuthContext";
import GlassHeader from "@/components/GlassHeader";
import CustomFooter from "@/components/CustomFooter";
import CookieConsentBanner from "@/components/CookieConsentBanner";

// Pages
import Home from "@/pages/Home";
import Services from "@/pages/Services";
import Portfolio from "@/pages/Portfolio";
import FAQ from "@/pages/FAQ";
import Contact from "@/pages/Contact";
import Areas from "@/pages/Areas";
import QuoteRequest from "@/pages/QuoteRequest";
import AdminDashboard from "@/pages/AdminDashboard";
import Kundenkonto from "@/pages/Kundenkonto";
import ServiceAreaDetail from "@/pages/ServiceAreaDetail";
import CMSPage from "@/pages/CMSPage";
import NotFound from "@/pages/NotFound";

function AppLayout({ children }) {
  const location = useLocation();
  const hideCookieBanner = location.pathname.startsWith("/admin") || location.pathname.startsWith("/kundenkonto");

  return (
    <div className="flex flex-col min-h-screen bg-[#F9F9F8]">
      <GlassHeader />
      <main className="flex-grow">
        {children}
      </main>
      <CustomFooter />
      <CookieConsentBanner hidden={hideCookieBanner} />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
            <Route 
              path="/" 
              element={
                <AppLayout>
                  <Home />
                </AppLayout>
              } 
            />
            <Route 
              path="/services" 
              element={
                <AppLayout>
                  <Services />
                </AppLayout>
              } 
            />
            <Route 
              path="/portfolio" 
              element={
                <AppLayout>
                  <Portfolio />
                </AppLayout>
              } 
            />
            <Route 
              path="/faq" 
              element={
                <AppLayout>
                  <FAQ />
                </AppLayout>
              } 
            />
            <Route 
              path="/contact" 
              element={
                <AppLayout>
                  <Contact />
                </AppLayout>
              } 
            />
            <Route 
              path="/areas" 
              element={
                <AppLayout>
                  <Areas />
                </AppLayout>
              } 
            />
            <Route 
              path="/quote-request" 
              element={
                <AppLayout>
                  <QuoteRequest />
                </AppLayout>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <AppLayout>
                  <AdminDashboard />
                </AppLayout>
              } 
            />
            <Route 
              path="/impressum" 
              element={
                <AppLayout>
                  <CMSPage pageSlug="impressum" />
                </AppLayout>
              } 
            />
            <Route 
              path="/datenschutz" 
              element={
                <AppLayout>
                  <CMSPage pageSlug="datenschutz" />
                </AppLayout>
              } 
            />
            <Route 
              path="/agb" 
              element={
                <AppLayout>
                  <CMSPage pageSlug="agb" />
                </AppLayout>
              } 
            />
            <Route 
              path="/cookie-einstellungen" 
              element={
                <AppLayout>
                  <CMSPage pageSlug="cookie-einstellungen" />
                </AppLayout>
              } 
            />
            <Route 
              path="/ueber-uns" 
              element={
                <AppLayout>
                  <CMSPage pageSlug="ueber-uns" />
                </AppLayout>
              } 
            />
            <Route 
              path="/kundenkonto/anmelden" 
              element={
                <AppLayout>
                  <Kundenkonto />
                </AppLayout>
              } 
            />
            <Route 
              path="/einsatzgebiete/:slug" 
              element={
                <AppLayout>
                  <ServiceAreaDetail />
                </AppLayout>
              } 
            />
            <Route 
              path="*" 
              element={
                <AppLayout>
                  <NotFound />
                </AppLayout>
              } 
            />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
