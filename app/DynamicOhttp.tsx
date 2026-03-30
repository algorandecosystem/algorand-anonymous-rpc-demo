"use client";

import dynamic from "next/dynamic";

const OhttpFetcher = dynamic(() => import("./OhttpFetcher"), { ssr: false });

export default function DynamicOhttp() {
  return <OhttpFetcher />;
}
