import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { subscriptions } from "@/db/schema";
export async function POST(request:Request){const user=await getChatGPTUser();if(!user)return Response.redirect(new URL("/login",request.url),303);const [sub]=await getDb().select().from(subscriptions).where(eq(subscriptions.ownerId,user.userId)).limit(1);if(!env.STRIPE_SECRET_KEY||!sub?.stripeCustomerId)return Response.redirect(new URL("/billing",request.url),303);const origin=env.APP_URL||new URL(request.url).origin;const body=new URLSearchParams({customer:sub.stripeCustomerId,return_url:`${origin}/billing`});const stripe=await fetch("https://api.stripe.com/v1/billing_portal/sessions",{method:"POST",headers:{authorization:`Bearer ${env.STRIPE_SECRET_KEY}`,"content-type":"application/x-www-form-urlencoded"},body});const data=await stripe.json() as {url?:string};return data.url?Response.redirect(data.url,303):Response.json({error:"Billing portal unavailable."},{status:502})}
