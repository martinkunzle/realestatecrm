import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { messages } from "@/db/schema";
import { getChatGPTUser } from "@/app/chatgpt-auth";
export async function GET(){const user=await getChatGPTUser();if(!user)return Response.json({error:"Sign in required."},{status:401});try{return Response.json({messages:await getDb().select().from(messages).where(eq(messages.ownerId,user.userId)).orderBy(desc(messages.id))})}catch{return Response.json({error:"Messages are temporarily unavailable."},{status:503})}}
export async function POST(r:Request){const user=await getChatGPTUser();if(!user)return Response.json({error:"Sign in required."},{status:401});try{const b=await r.json() as {contact?:string;body?:string};if(!b.contact?.trim()||!b.body?.trim())return Response.json({error:"Contact and message are required."},{status:400});const [message]=await getDb().insert(messages).values({ownerId:user.userId,contact:b.contact.trim(),body:b.body.trim(),direction:"outgoing"}).returning();return Response.json({message},{status:201})}catch{return Response.json({error:"Message could not be saved."},{status:503})}}
