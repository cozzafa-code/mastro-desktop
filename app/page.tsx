"use client";
import dynamic from 'next/dynamic';
const MastroERP = dynamic(() => import('@/components/MastroERP'), { ssr: false });
export default function Page() {
  return <MastroERP user={{id:"2a98547f-338b-4926-aa7b-0859cde5a1bf",email:"cozzafa@gmail.com"}} azienda={null} forceDesktop />;
}
