"use client";
import dynamic from "next/dynamic";

const MastroERP = dynamic(() => import("@/components/MastroERP"), { ssr: false });

export default function Page() {
  return <MastroERP forceDesktop />;
}
