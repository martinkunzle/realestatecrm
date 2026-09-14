import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { ensureDatabase, getDb } from "@/db";
import { sessions, users } from "@/db/schema";
import { hashPassword, hashToken, newSessionToken } from "@/lib/auth-crypto";
import { SESSION_COOKIE } from "@/app/chatgpt-auth";

export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json({ error: "Invalid request." }, { status: 403 });
  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    email?: string;
    password?: string;
  };
  const email = body.email?.trim().toLowerCase(),
    password = body.password ?? "",
    name = body.name?.trim() || email?.split("@")[0] || "Agent";
  if (!email || !/^\S+@\S+\.\S+$/.test(email) || password.length < 10)
    return Response.json(
      {
        error:
          "Enter a valid email and password of at least 10 characters.",
      },
      { status: 400 },
    );

  await ensureDatabase();
  const db = getDb();
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing)
    return Response.json(
      { error: "An account with this email already exists." },
      { status: 409 },
    );
  const id = crypto.randomUUID(),
    token = newSessionToken(),
    expires = new Date(Date.now() + 30 * 86400000).toISOString();
  await db
    .insert(users)
    .values({ id, name, email, passwordHash: await hashPassword(password) });
  await db
    .insert(sessions)
    .values({
      tokenHash: await hashToken(token),
      userId: id,
      expiresAt: expires,
    });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: new URL(request.url).protocol === "https:",
    sameSite: "lax",
    path: "/",
    expires: new Date(expires),
  });
  return Response.json({ created: true });
}
function sameOrigin(r: Request) {
  const origin = r.headers.get("origin");
  return !origin || origin === new URL(r.url).origin;
}
