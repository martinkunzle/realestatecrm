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

  try {
    await ensureDatabase();
  } catch (problem) {
    console.error("LOGIN_DB_INIT", problem);
    const allowedCodes = new Set([
      "DB_SCHEMA",
      "DB_CONTACTS_UPGRADE",
      "DB_DEMO_PASSWORD",
      "DB_DEMO_SEED",
    ]);
    const stage =
      problem instanceof Error && allowedCodes.has(problem.message)
        ? problem.message
        : "LOGIN_DB_INIT";
    return Response.json(
      { error: `Login service is initializing. Code: ${stage}` },
      { status: 503 },
    );
  }

  const db = getDb();
  let user;
  try {
    [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, body.email?.trim().toLowerCase() ?? ""))
      .limit(1);
  } catch (problem) {
    console.error("LOGIN_DB_QUERY", problem);
    return Response.json(
      { error: "Login service is unavailable. Code: LOGIN_DB_QUERY" },
      { status: 503 },
    );
  }

  if (!user || !(await verifyPassword(body.password ?? "", user.passwordHash)))
    return Response.json(
      { error: "Incorrect email or password." },
      { status: 401 },
    );

  try {
    const token = newSessionToken();
    const expires = new Date(Date.now() + 30 * 86400000).toISOString();
    await db.insert(sessions).values({
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
  } catch (problem) {
    console.error("LOGIN_SESSION", problem);
    return Response.json(
      { error: "Could not create your session. Code: LOGIN_SESSION" },
      { status: 503 },
    );
  }

  return Response.json({ authenticated: true });
}
