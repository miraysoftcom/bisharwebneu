import dynamic from "next/dynamic";

const ServiceAreaDetail = dynamic(() => import("../ServiceAreaDetail"), {
	ssr: false,
});

export default ServiceAreaDetail;