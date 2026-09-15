import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";
import { hashPassword } from "@/lib/auth-crypto";

let initialization: Promise<void> | undefined;

function database() {
  if (!env.DB) {
    throw new Error("Cloudflare D1 binding DB is unavailable.");
  }
  return env.DB;
}

export function getDb() {
  return drizzle(database(), { schema });
}

export function ensureDatabase() {
  if (!initialization) {
    initialization = initializeDatabase().catch((error) => {
      initialization = undefined;
      throw error;
    });
  }
  return initialization;
}

async function initializeDatabase() {
  const db = database();
  try {
    await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS workspaces (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      owner_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      team TEXT NOT NULL DEFAULT '',
      market TEXT NOT NULL DEFAULT '',
      trial_started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS idx_workspaces_owner_id ON workspaces (owner_id)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      owner_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      type TEXT NOT NULL DEFAULT 'Buyer',
      status TEXT NOT NULL DEFAULT 'New',
      source TEXT NOT NULL DEFAULT 'Manual',
      budget INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_contacts_owner_id ON contacts (owner_id)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      owner_id TEXT NOT NULL,
      title TEXT NOT NULL,
      contact TEXT NOT NULL DEFAULT '',
      due TEXT NOT NULL DEFAULT '',
      priority TEXT NOT NULL DEFAULT 'Medium',
      done INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_tasks_owner_id ON tasks (owner_id)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS deals (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      owner_id TEXT NOT NULL,
      name TEXT NOT NULL,
      client TEXT NOT NULL DEFAULT '',
      value INTEGER NOT NULL DEFAULT 0,
      stage TEXT NOT NULL DEFAULT 'New lead',
      temperature TEXT NOT NULL DEFAULT 'Warm',
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_deals_owner_stage ON deals (owner_id, stage)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      owner_id TEXT NOT NULL,
      contact TEXT NOT NULL,
      body TEXT NOT NULL,
      direction TEXT NOT NULL DEFAULT 'outgoing',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_messages_owner_contact ON messages (owner_id, contact)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      owner_id TEXT NOT NULL,
      number TEXT NOT NULL,
      client TEXT NOT NULL,
      service TEXT NOT NULL,
      amount INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Draft',
      due_date TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_invoices_owner_status ON invoices (owner_id, status)`),
    db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_owner_number ON invoices (owner_id, number)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      owner_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'inactive',
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      current_period_end TEXT,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_owner_id ON subscriptions (owner_id)`),
    db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription ON subscriptions (stripe_subscription_id)`)
    ]);
  } catch {
    throw new Error("DB_SCHEMA");
  }

  try {
    await ensureContactsColumns(db);
  } catch {
    throw new Error("DB_CONTACTS_UPGRADE");
  }

  let demoPasswordHash: string;
  try {
    demoPasswordHash = await hashPassword("CloseKeyDemo2026!");
  } catch {
    throw new Error("DB_DEMO_PASSWORD");
  }
  const trialEnd = new Date(Date.now() + 14 * 86400000).toISOString();
  try {
    await db.batch([
    db.prepare(`INSERT OR IGNORE INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)`)
      .bind("demo-agent", "Martin Demo", "demo@closekeycrm.com", demoPasswordHash),
    db.prepare(`INSERT OR IGNORE INTO workspaces (id, owner_id, name, email, phone, team, market) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .bind(-1001, "demo-agent", "CloseKey Demo Realty", "demo@closekeycrm.com", "(305) 555-0148", "Demo Brokerage", "Miami, FL"),
    db.prepare(`INSERT OR IGNORE INTO contacts (id, owner_id, name, email, phone, type, status, source, budget) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(-1001, "demo-agent", "Sofia Martinez", "sofia@example.com", "(305) 555-0112", "Buyer", "Qualified", "Referral", 850000),
    db.prepare(`INSERT OR IGNORE INTO contacts (id, owner_id, name, email, phone, type, status, source, budget) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(-1002, "demo-agent", "Daniel Brooks", "daniel@example.com", "(786) 555-0184", "Seller", "New", "Website", 1200000),
    db.prepare(`INSERT OR IGNORE INTO tasks (id, owner_id, title, contact, due, priority, done) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .bind(-1001, "demo-agent", "Schedule Brickell property tour", "Sofia Martinez", "Tomorrow at 10:00 AM", "High", 0),
    db.prepare(`INSERT OR IGNORE INTO tasks (id, owner_id, title, contact, due, priority, done) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .bind(-1002, "demo-agent", "Send listing presentation", "Daniel Brooks", "Friday at 2:00 PM", "Medium", 0),
    db.prepare(`INSERT OR IGNORE INTO deals (id, owner_id, name, client, value, stage, temperature, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(-1001, "demo-agent", "Brickell Condo Purchase", "Sofia Martinez", 850000, "Tour scheduled", "Hot", "Client prefers a two-bedroom with water views."),
    db.prepare(`INSERT OR IGNORE INTO deals (id, owner_id, name, client, value, stage, temperature, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(-1002, "demo-agent", "Aventura Listing", "Daniel Brooks", 1200000, "New lead", "Warm", "Prepare comparative market analysis."),
    db.prepare(`INSERT OR IGNORE INTO messages (id, owner_id, contact, body, direction) VALUES (?, ?, ?, ?, ?)`)
      .bind(-1001, "demo-agent", "Sofia Martinez", "The Brickell tour is confirmed for tomorrow at 10 AM.", "outgoing"),
    db.prepare(`INSERT OR IGNORE INTO invoices (id, owner_id, number, client, service, amount, status, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(-1001, "demo-agent", "CK-1001", "Sofia Martinez", "Transaction coordination", 75000, "Draft", "2026-09-30"),
    db.prepare(`INSERT OR IGNORE INTO subscriptions (id, owner_id, status, current_period_end) VALUES (?, ?, ?, ?)`)
      .bind(-1001, "demo-agent", "trialing", trialEnd)
    ]);
  } catch {
    throw new Error("DB_DEMO_SEED");
  }
}

async function ensureContactsColumns(db: D1Database) {
  const info = await db
    .prepare("PRAGMA table_info(contacts)")
    .all<{ name: string }>();
  const columns = new Set(info.results.map((column) => column.name));

  if (!columns.has("status")) {
    await db.exec("ALTER TABLE contacts ADD COLUMN status TEXT NOT NULL DEFAULT 'New'");
  }
  if (!columns.has("source")) {
    await db.exec("ALTER TABLE contacts ADD COLUMN source TEXT NOT NULL DEFAULT 'Manual'");
  }
  if (!columns.has("budget")) {
    await db.exec("ALTER TABLE contacts ADD COLUMN budget INTEGER NOT NULL DEFAULT 0");
  }
}
