import { Check, House } from "lucide-react";
import { redirect } from "next/navigation";
import { getChatGPTUser } from "../chatgpt-auth";
import AuthForm from "./auth-form";
export const dynamic="force-dynamic";
export default async function LoginPage({searchParams}:{searchParams:Promise<{mode?:string;returnTo?:string}>}){const user=await getChatGPTUser(),p=await searchParams;if(user)redirect(p.returnTo?.startsWith("/")?p.returnTo:"/dashboard");const signup=p.mode==="signup";return <main className="login-page"><a className="marketing-brand login-brand" href="/"><span><House size={20}/></span>CloseKey</a><section className="login-panel"><div className="login-copy"><p className="eyebrow">REAL ESTATE, ORGANIZED</p><h1>{signup?"Start closing with clarity.":"Welcome back."}</h1><p>{signup?"Create your private CRM workspace and try every feature free for 14 days.":"Log in to manage your leads, follow-ups, deals, and commissions."}</p><ul><li><Check/>Your data stays private</li><li><Check/>Works on desktop and mobile</li><li><Check/>14-day free trial</li></ul></div><AuthForm signup={signup} returnTo={p.returnTo}/></section></main>}
