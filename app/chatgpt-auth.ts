import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { sessions, users } from "@/db/schema";
import { hashToken } from "@/lib/auth-crypto";

export type ChatGPTUser={userId:string;displayName:string;email:string;fullName:string|null};
export const SESSION_COOKIE="closekey_session";
export async function getChatGPTUser():Promise<ChatGPTUser|null>{const token=(await cookies()).get(SESSION_COOKIE)?.value;if(!token)return null;try{const [row]=await getDb().select({id:users.id,name:users.name,email:users.email}).from(sessions).innerJoin(users,eq(sessions.userId,users.id)).where(and(eq(sessions.tokenHash,await hashToken(token)),gt(sessions.expiresAt,new Date().toISOString()))).limit(1);return row?{userId:row.id,displayName:row.name,email:row.email,fullName:row.name}:null}catch{return null}}
export async function requireChatGPTUser(returnTo:string){const user=await getChatGPTUser();if(user)return user;redirect(`/login?returnTo=${encodeURIComponent(safePath(returnTo))}`)}
export function chatGPTSignInPath(returnTo:string){return `/login?returnTo=${encodeURIComponent(safePath(returnTo))}`}
export function chatGPTSignOutPath(returnTo="/"){return `/api/auth/logout?returnTo=${encodeURIComponent(safePath(returnTo))}`}
function safePath(v:string){return v.startsWith("/")&&!v.startsWith("//")?v:"/"}
