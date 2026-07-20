import React from "react";
import Head from "next/head";
import NextApp from "next/app";
import { useRouter } from "next/router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "@/components/LanguageContext";
import { AuthProvider } from "@/components/AuthContext";
import GlassHeader from "@/components/GlassHeader";
import CustomFooter from "@/components/CustomFooter";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import "@/App.css";
import "@/index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const hideCookieBanner = router.pathname.startsWith("/admin") || router.pathname.startsWith("/kundenkonto");

  return (
    <React.StrictMode>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <LanguageProvider>
            <div className="flex min-h-screen flex-col bg-[#F9F9F8]">
              <GlassHeader />
              <main className="flex-grow">
                <Component {...pageProps} />
              </main>
              <CustomFooter />
              <CookieConsentBanner hidden={hideCookieBanner} />
            </div>
          </LanguageProvider>
        </AuthProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
}

App.getInitialProps = async (appContext) => {
  const appProps = await NextApp.getInitialProps(appContext);
  return { ...appProps };
};