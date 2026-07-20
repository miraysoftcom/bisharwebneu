import dynamic from "next/dynamic";

const CMSPage = dynamic(() => import("./CMSPage"), { ssr: false });

export default function AboutPage() {
  return <CMSPage pageSlug="ueber-uns" />;
}