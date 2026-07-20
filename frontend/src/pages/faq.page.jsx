import dynamic from "next/dynamic";

const FAQ = dynamic(() => import("./FAQ"), { ssr: false });

export default FAQ;