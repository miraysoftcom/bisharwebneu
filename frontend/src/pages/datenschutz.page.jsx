import dynamic from "next/dynamic";

const CMSPage = dynamic(() => import("./CMSPage"), { ssr: false });

export default function DatenschutzPage() {
  return <CMSPage pageSlug="datenschutz" />;
}