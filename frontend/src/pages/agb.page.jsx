import dynamic from "next/dynamic";

const CMSPage = dynamic(() => import("./CMSPage"), { ssr: false });

export default function AGBPage() {
  return <CMSPage pageSlug="agb" />;
}