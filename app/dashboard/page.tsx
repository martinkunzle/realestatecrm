import { requireChatGPTUser } from "../chatgpt-auth";
import { getDb } from "@/db";
import { subscriptions, workspaces } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import CRMApp from "./crm";
export const dynamic="force-dynamic";
export default async function DashboardPage(){const user=await requireChatGPTUser("/dashboard");let workspace,subscription;try{[workspace]=await getDb().select().from(workspaces).where(eq(workspaces.ownerId,user.userId)).limit(1);[subscription]=await getDb().select().from(subscriptions).where(eq(subscriptions.ownerId,user.userId)).limit(1)}catch{}if(!workspace)redirect("/onboarding");const trialEnds=new Date(workspace.trialStartedAt).getTime()+14*86400000;if(Date.now()>trialEnds&&!["active","trialing"].includes(subscription?.status||""))redirect("/billing");return <CRMApp displayName={workspace.name||user.displayName} email={workspace.email||user.email} workspace={workspace}/>}
