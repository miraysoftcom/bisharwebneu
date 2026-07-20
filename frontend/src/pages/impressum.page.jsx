import dynamic from "next/dynamic";

const CMSPage = dynamic(() => import("./CMSPage"), { ssr: false });

export default function ImpressumPage() {
  return <CMSPage pageSlug="impressum" />;
}