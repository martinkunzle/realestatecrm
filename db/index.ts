import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

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
}
