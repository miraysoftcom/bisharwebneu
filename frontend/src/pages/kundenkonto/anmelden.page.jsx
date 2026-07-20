import dynamic from "next/dynamic";

const Kundenkonto = dynamic(() => import("../Kundenkonto"), {
	ssr: false,
});

export default Kundenkonto;