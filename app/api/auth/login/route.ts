import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { ensureDatabase, getDb } from "@/db";
import { sessions, users } from "@/db/schema";
import { hashToken, newSessionToken, verifyPassword } from "@/lib/auth-crypto";
import { SESSION_COOKIE } from "@/app/chatgpt-auth";

export async function POST(request: Request) {
  if (
    request.headers.get("origin") &&
    request.headers.get("origin") !== new URL(request.url).origin
  )
    return Response.json({ error: "Invalid request." }, { status: 403 });
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };

  await ensureDatabase();
  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, body.email?.trim().toLowerCase() ?? ""))
    .limit(1);
  if (!user || !(await verifyPassword(body.password ?? "", user.passwordHash)))
    return Response.json(
      { error: "Incorrect email or password." },
      { status: 401 },
    );
  const token = newSessionToken(),
    expires = new Date(Date.now() + 30 * 86400000).toISOString();
  await db
    .insert(sessions)
    .values({
      tokenHash: await hashToken(token),
      userId: user.id,
      expiresAt: expires,
    });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: new URL(request.url).protocol === "https:",
    sameSite: "lax",
    path: "/",
    expires: new Date(expires),
  });
  return Response.json({ authenticated: true });
}
