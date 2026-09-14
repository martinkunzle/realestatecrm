import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { sessions } from "@/db/schema";
import { hashToken } from "@/lib/auth-crypto";
import { SESSION_COOKIE } from "@/app/chatgpt-auth";
export async function GET(request:Request){const jar=await cookies(),token=jar.get(SESSION_COOKIE)?.value;if(token)await getDb().delete(sessions).where(eq(sessions.tokenHash,await hashToken(token))).catch(()=>{});jar.delete(SESSION_COOKIE);const returnTo=new URL(request.url).searchParams.get("returnTo")||"/";return Response.redirect(new URL(returnTo.startsWith("/")&&!returnTo.startsWith("//")?returnTo:"/",request.url))}
