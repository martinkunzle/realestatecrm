import { Check, CreditCard, House } from "lucide-react";
import { eq } from "drizzle-orm";
import { requireChatGPTUser } from "../chatgpt-auth";
import { getDb } from "@/db";
import { subscriptions } from "@/db/schema";
export const dynamic="force-dynamic";
export default async function BillingPage(){const user=await requireChatGPTUser("/billing");const [sub]=await getDb().select().from(subscriptions).where(eq(subscriptions.ownerId,user.userId)).limit(1);const active=["active","trialing"].includes(sub?.status||"");return <main className="billing-page"><a className="marketing-brand" href="/"><span><House size={20}/></span>CloseKey</a><section className="billing-page-card"><span className="login-lock"><CreditCard/></span><p className="eyebrow">CLOSEKEY PRO</p><h1>{active?"Your subscription is active.":"Keep your pipeline moving."}</h1><p>Unlimited contacts, deals, tasks, communication history, invoices, and live reporting.</p><h2><strong>$49</strong> / month</h2><ul><li><Check/>Full CRM workspace</li><li><Check/>Private cloud storage</li><li><Check/>Cancel anytime</li></ul><form action={active?"/api/billing/portal":"/api/billing/checkout"} method="post"><button>{active?"Manage subscription":"Continue to secure checkout"}</button></form><a href="/dashboard">Return to dashboard</a></section></main>}
