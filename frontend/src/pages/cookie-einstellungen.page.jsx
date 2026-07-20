import dynamic from "next/dynamic";

const CMSPage = dynamic(() => import("./CMSPage"), { ssr: false });

export default function CookieSettingsPage() {
  return <CMSPage pageSlug="cookie-einstellungen" />;
}