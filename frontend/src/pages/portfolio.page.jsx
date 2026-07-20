import dynamic from "next/dynamic";

const Portfolio = dynamic(() => import("./Portfolio"), { ssr: false });

export default Portfolio;