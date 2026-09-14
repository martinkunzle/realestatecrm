import { requireChatGPTUser } from "../chatgpt-auth";
import { getDb } from "@/db";
import { workspaces } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import OnboardingForm from "./form";
export const dynamic="force-dynamic";
export default async function OnboardingPage(){const user=await requireChatGPTUser("/onboarding");let workspace;try{[workspace]=await getDb().select().from(workspaces).where(eq(workspaces.ownerId,user.userId)).limit(1)}catch{}if(workspace)redirect("/dashboard");return <OnboardingForm displayName={user.displayName} email={user.email}/>}
