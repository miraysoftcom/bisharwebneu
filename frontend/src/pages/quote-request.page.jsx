import dynamic from "next/dynamic";

const QuoteRequest = dynamic(() => import("./QuoteRequest"), { ssr: false });

export default QuoteRequest;