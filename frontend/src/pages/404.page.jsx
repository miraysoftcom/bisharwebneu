import dynamic from "next/dynamic";

const NotFound = dynamic(() => import("./NotFound"), { ssr: false });

export default NotFound;