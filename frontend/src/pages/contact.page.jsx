import dynamic from "next/dynamic";

const Contact = dynamic(() => import("./Contact"), { ssr: false });

export default Contact;