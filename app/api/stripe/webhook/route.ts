import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { subscriptions } from "@/db/schema";
export async function POST(request: Request) {
  const raw = await request.text(),
    sig = request.headers.get("stripe-signature") || "";
  if (
    !env.STRIPE_WEBHOOK_SECRET ||
    !(await valid(raw, sig, env.STRIPE_WEBHOOK_SECRET))
  )
    return new Response("Invalid signature", { status: 400 });
  const event = JSON.parse(raw) as {
    type: string;
    data: { object: Record<string, unknown> };
  };
  const o = event.data.object,
    meta = (o.metadata ?? {}) as Record<string, string>;
  let owner = meta.owner_id;
  if (event.type === "checkout.session.completed")
    owner = String(o.client_reference_id || owner || "");
  if (owner) {
    const status =
      event.type === "checkout.session.completed"
        ? "active"
        : event.type === "customer.subscription.deleted"
          ? "canceled"
          : String(o.status || "active"),
      customer = typeof o.customer === "string" ? o.customer : null,
      subId =
        typeof o.subscription === "string"
          ? o.subscription
          : typeof o.id === "string" &&
              event.type.startsWith("customer.subscription")
            ? o.id
            : null,
      end =
        typeof o.current_period_end === "number"
          ? new Date(o.current_period_end * 1000).toISOString()
          : null;
    await getDb()
      .insert(subscriptions)
      .values({
        ownerId: owner,
        status,
        stripeCustomerId: customer,
        stripeSubscriptionId: subId,
        currentPeriodEnd: end,
        updatedAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: subscriptions.ownerId,
        set: {
          status,
          stripeCustomerId: customer,
          stripeSubscriptionId: subId,
          currentPeriodEnd: end,
          updatedAt: new Date().toISOString(),
        },
      });
  }
  return Response.json({ received: true });
}
async function valid(raw: string, header: string, secret: string) {
  const parts = Object.fromEntries(
    header.split(",").map((x) => x.split("=", 2)),
  ) as Record<string, string>;
  if (
    !parts.t ||
    !parts.v1 ||
    Math.abs(Date.now() / 1000 - Number(parts.t)) > 300
  )
    return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const bytes = new Uint8Array(
    await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(`${parts.t}.${raw}`),
    ),
  );
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  if (hex.length !== parts.v1.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++)
    diff |= hex.charCodeAt(i) ^ parts.v1.charCodeAt(i);
  return diff === 0;
}
