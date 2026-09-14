import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(), name: text("name").notNull(), email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(), createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("idx_users_email").on(table.email)]);

export const sessions = sqliteTable("sessions", {
  tokenHash: text("token_hash").primaryKey(), userId: text("user_id").notNull(), expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_sessions_user_id").on(table.userId)]);

export const workspaces = sqliteTable("workspaces", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerId: text("owner_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  team: text("team").notNull().default(""),
  market: text("market").notNull().default(""),
  trialStartedAt: text("trial_started_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("idx_workspaces_owner_id").on(table.ownerId)]);

export const contacts = sqliteTable("contacts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerId: text("owner_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  type: text("type").notNull().default("Buyer"),
  status: text("status").notNull().default("New"),
  source: text("source").notNull().default("Manual"),
  budget: integer("budget").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_contacts_owner_id").on(table.ownerId)]);
export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerId: text("owner_id").notNull(),
  title: text("title").notNull(),
  contact: text("contact").notNull().default(""),
  due: text("due").notNull().default(""),
  priority: text("priority").notNull().default("Medium"),
  done: integer("done", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_tasks_owner_id").on(table.ownerId)]);

export const deals = sqliteTable("deals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerId: text("owner_id").notNull(),
  name: text("name").notNull(),
  client: text("client").notNull().default(""),
  value: integer("value").notNull().default(0),
  stage: text("stage").notNull().default("New lead"),
  temperature: text("temperature").notNull().default("Warm"),
  note: text("note").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_deals_owner_stage").on(table.ownerId, table.stage)]);

export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerId: text("owner_id").notNull(),
  contact: text("contact").notNull(),
  body: text("body").notNull(),
  direction: text("direction").notNull().default("outgoing"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_messages_owner_contact").on(table.ownerId, table.contact)]);

export const invoices = sqliteTable("invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerId: text("owner_id").notNull(),
  number: text("number").notNull(),
  client: text("client").notNull(),
  service: text("service").notNull(),
  amount: integer("amount").notNull().default(0),
  status: text("status").notNull().default("Draft"),
  dueDate: text("due_date").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_invoices_owner_status").on(table.ownerId, table.status),
  uniqueIndex("idx_invoices_owner_number").on(table.ownerId, table.number),
]);

export const subscriptions = sqliteTable("subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }), ownerId: text("owner_id").notNull(), status: text("status").notNull().default("inactive"),
  stripeCustomerId: text("stripe_customer_id"), stripeSubscriptionId: text("stripe_subscription_id"), currentPeriodEnd: text("current_period_end"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("idx_subscriptions_owner_id").on(table.ownerId), uniqueIndex("idx_subscriptions_stripe_subscription").on(table.stripeSubscriptionId)]);
