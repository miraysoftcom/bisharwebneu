import dynamic from "next/dynamic";

const Services = dynamic(() => import("./Services"), { ssr: false });

export default Services;