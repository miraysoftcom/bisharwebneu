import dynamic from "next/dynamic";

const Areas = dynamic(() => import("./Areas"), { ssr: false });

export default Areas;