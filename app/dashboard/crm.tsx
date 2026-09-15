"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  Check,
  CircleDollarSign,
  Clock3,
  CreditCard,
  FileText,
  House,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Mail,
  Menu,
  MessageSquareText,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Settings,
  Sparkles,
  TrendingUp,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type NavKey =
  | "Dashboard"
  | "Contacts"
  | "Pipeline"
  | "Tasks"
  | "Messages"
  | "Invoices"
  | "Reports"
  | "Settings";
type Contact = {
  id: number;
  name: string;
  email: string;
  phone: string;
  type: string;
  status: string;
  source: string;
  budget: number;
};
type Task = {
  id: number;
  title: string;
  contact: string;
  due: string;
  priority: string;
  done: boolean;
};
type Deal = {
  id: number;
  name: string;
  client: string;
  value: number;
  stage: string;
  temperature: string;
  note: string;
};
type Message = {
  id: number;
  contact: string;
  body: string;
  direction: string;
  createdAt: string;
};
type Invoice = {
  id: number;
  number: string;
  client: string;
  service: string;
  amount: number;
  status: string;
  dueDate: string;
};
type Workspace = {
  name: string;
  email: string;
  phone: string;
  team: string;
  market: string;
  trialStartedAt: string;
};
const nav: { label: NavKey; icon: typeof House }[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Contacts", icon: UsersRound },
  { label: "Pipeline", icon: TrendingUp },
  { label: "Tasks", icon: ListTodo },
  { label: "Messages", icon: MessageSquareText },
  { label: "Invoices", icon: FileText },
  { label: "Reports", icon: BarChart3 },
  { label: "Settings", icon: Settings },
];
const stages = ["New lead", "Qualified", "Showing", "Offer", "Closing"];
const money = (v: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(v);
const initials = (name: string) =>
  name
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "CK";
const daysLeft = (started: string) =>
  Math.max(
    0,
    14 - Math.floor((Date.now() - new Date(started).getTime()) / 86400000),
  );

export default function CRMApp({
  displayName,
  email,
  workspace: initialWorkspace,
}: {
  displayName: string;
  email: string;
  workspace: Workspace;
}) {
  const [active, setActive] = useState<NavKey>("Dashboard"),
    [mobileNav, setMobileNav] = useState(false),
    [query, setQuery] = useState(""),
    [loading, setLoading] = useState(true),
    [toast, setToast] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]),
    [tasks, setTasks] = useState<Task[]>([]),
    [deals, setDeals] = useState<Deal[]>([]),
    [messages, setMessages] = useState<Message[]>([]),
    [invoices, setInvoices] = useState<Invoice[]>([]),
    [workspace, setWorkspace] = useState(initialWorkspace);
  const [contactOpen, setContactOpen] = useState(false),
    [dealOpen, setDealOpen] = useState(false),
    [taskOpen, setTaskOpen] = useState(false),
    [invoiceOpen, setInvoiceOpen] = useState(false);
  const notify = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(""), 2600);
  };
  const pipelineValue = useMemo(
    () => deals.reduce((s, d) => s + d.value, 0),
    [deals],
  );
  const filtered = contacts.filter((c) =>
    `${c.name} ${c.email} ${c.type} ${c.source}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const trial = daysLeft(workspace.trialStartedAt);

  useEffect(() => {
    let live = true;
    (async () => {
      const paths = ["contacts", "tasks", "deals", "messages", "invoices"];
      const results: Array<Record<string, any>> = await Promise.all(
        paths.map((p) =>
          fetch(`/api/${p}`)
            .then(async (r) =>
              r.ok ? ((await r.json()) as Record<string, any>) : {},
            )
            .catch(() => ({})),
        ),
      );
      if (!live) return;
      setContacts(results[0].contacts ?? []);
      setTasks(results[1].tasks ?? []);
      setDeals(results[2].deals ?? []);
      setMessages(results[3].messages ?? []);
      setInvoices(results[4].invoices ?? []);
      setLoading(false);
    })();
    return () => {
      live = false;
    };
  }, []);
  async function addContact(f: FormData) {
    const p = {
      name: String(f.get("name")),
      email: String(f.get("email")),
      phone: String(f.get("phone") || ""),
      type: String(f.get("type")),
      status: String(f.get("status")),
      source: String(f.get("source") || "Manual"),
      budget: Number(f.get("budget")) || 0,
    };
    const r = await post("/api/contacts", p);
    if (r.contact) {
      setContacts((o) => [r.contact, ...o]);
      setContactOpen(false);
      notify(`${p.name} added`);
    } else notify(r.error || "Contact could not be saved");
  }
  async function addTask(f: FormData) {
    const p = {
      title: String(f.get("title")),
      contact: String(f.get("contact") || ""),
      due: String(f.get("due") || ""),
      priority: String(f.get("priority")),
    };
    const r = await post("/api/tasks", p);
    if (r.task) {
      setTasks((o) => [r.task, ...o]);
      setTaskOpen(false);
      notify("Follow-up added");
    } else notify(r.error || "Task could not be saved");
  }
  async function toggleTask(t: Task) {
    const done = !t.done;
    setTasks((o) => o.map((x) => (x.id === t.id ? { ...x, done } : x)));
    const r = await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: t.id, done }),
    });
    if (!r.ok) {
      setTasks((o) => o.map((x) => (x.id === t.id ? t : x)));
      notify("Task could not be updated");
    }
  }
  async function addDeal(f: FormData) {
    const p = {
      name: String(f.get("property")),
      client: String(f.get("client") || ""),
      value: Number(f.get("value")) || 0,
      stage: "New lead",
      temperature: String(f.get("temperature")),
      note: String(f.get("note") || ""),
    };
    const r = await post("/api/deals", p);
    if (r.deal) {
      setDeals((o) => [r.deal, ...o]);
      setDealOpen(false);
      notify("Opportunity added");
    } else notify(r.error || "Deal could not be saved");
  }
  async function moveDeal(d: Deal, direction: -1 | 1) {
    const currentIndex = stages.indexOf(d.stage);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= stages.length) return;
    const stage = stages[nextIndex];
    setDeals((o) => o.map((x) => (x.id === d.id ? { ...x, stage } : x)));
    const r = await fetch("/api/deals", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: d.id, stage }),
    });
    if (!r.ok) {
      setDeals((o) => o.map((x) => (x.id === d.id ? d : x)));
      notify("Deal could not be moved");
    }
  }
  async function addInvoice(f: FormData) {
    const p = {
      client: String(f.get("client")),
      service: String(f.get("service")),
      amount: Number(f.get("amount")) || 0,
      dueDate: String(f.get("dueDate") || ""),
    };
    const r = await post("/api/invoices", p);
    if (r.invoice) {
      setInvoices((o) => [r.invoice, ...o]);
      setInvoiceOpen(false);
      notify("Invoice draft created");
    } else notify(r.error || "Invoice could not be saved");
  }
  async function saveWorkspace(f: FormData) {
    const p = Object.fromEntries(f);
    const r = await post("/api/profile", p);
    if (r.created) {
      setWorkspace((w) => ({ ...w, ...p }) as Workspace);
      notify("Profile changes saved");
    } else notify(r.error || "Profile could not be saved");
  }
  useEffect(() => {
    const ctx = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: unknown,
            options?: { signal?: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!ctx?.registerTool) return;
    const life = new AbortController();
    void ctx.registerTool(
      {
        name: "list_open_tasks",
        title: "List open tasks",
        description: "Return incomplete CloseKey follow-up tasks.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: async () => ({ tasks: tasks.filter((t) => !t.done) }),
      },
      { signal: life.signal },
    );
    return () => life.abort();
  }, [tasks]);

  return (
    <div className="crm-shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">
            <House size={20} />
          </span>
          <span>CloseKey</span>
          <button className="close-nav" onClick={() => setMobileNav(false)}>
            <X />
          </button>
        </div>
        <nav>
          <p className="nav-label">Workspace</p>
          {nav.slice(0, 6).map((i) => (
            <button
              key={i.label}
              className={active === i.label ? "nav-active" : ""}
              onClick={() => {
                setActive(i.label);
                setMobileNav(false);
              }}
            >
              <i.icon size={19} />
              <span>{i.label}</span>
              {i.label === "Tasks" &&
                tasks.filter((t) => !t.done).length > 0 && (
                  <b>{tasks.filter((t) => !t.done).length}</b>
                )}
            </button>
          ))}
          <p className="nav-label second">Insights</p>
          {nav.slice(6).map((i) => (
            <button
              key={i.label}
              className={active === i.label ? "nav-active" : ""}
              onClick={() => {
                setActive(i.label);
                setMobileNav(false);
              }}
            >
              <i.icon size={19} />
              <span>{i.label}</span>
            </button>
          ))}
        </nav>
        <div className="trial-card">
          <div>
            <Sparkles size={15} />
            <span>Pro trial</span>
            <strong>{trial} days left</strong>
          </div>
          <i>
            <span style={{ width: `${Math.max(5, (trial / 14) * 100)}%` }} />
          </i>
          <p>Every lead and follow-up, securely in one place.</p>
          <button onClick={() => setActive("Settings")}>View plan</button>
        </div>
        <div className="profile">
          <span className="avatar blue">{initials(displayName)}</span>
          <span>
            <strong>{displayName}</strong>
            <small>{email}</small>
          </span>
          <a href="/api/auth/logout?returnTo=%2F" target="_top">
            <LogOut size={17} />
          </a>
        </div>
      </aside>
      {mobileNav && (
        <button className="scrim" onClick={() => setMobileNav(false)} />
      )}
      <main className="main">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMobileNav(true)}>
            <Menu />
          </button>
          <div className="global-search">
            <Search size={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search contacts, deals, properties…"
            />
            <kbd>⌘ K</kbd>
          </div>
          <button className="icon-button" onClick={() => setActive("Messages")}>
            <Mail size={19} />
          </button>
          <button className="icon-button" onClick={() => setActive("Tasks")}>
            <Bell size={19} />
            {tasks.some((t) => !t.done) && <i />}
          </button>
          <Dialog open={dealOpen} onOpenChange={setDealOpen}>
            <DialogTrigger asChild>
              <Button className="add-button"><Plus size={18} /> New opportunity</Button>
            </DialogTrigger>
            <DealDialog onSubmit={addDeal} />
          </Dialog>
        </header>
        <div className="workspace">
          {loading ? (
            <Loading />
          ) : (
            <>
              {active === "Dashboard" && (
                <Dashboard
                  name={workspace.name}
                  tasks={tasks}
                  toggleTask={toggleTask}
                  deals={deals}
                  value={pipelineValue}
                  setActive={setActive}
                  openTask={() => setTaskOpen(true)}
                />
              )}{" "}
              {active === "Contacts" && (
                <Contacts
                  contacts={filtered}
                  query={query}
                  setQuery={setQuery}
                  open={() => setContactOpen(true)}
                />
              )}{" "}
              {active === "Pipeline" && (
                <Pipeline
                  deals={deals}
                  move={moveDeal}
                  open={() => setDealOpen(true)}
                />
              )}{" "}
              {active === "Tasks" && (
                <Tasks
                  tasks={tasks}
                  toggle={toggleTask}
                  open={() => setTaskOpen(true)}
                />
              )}{" "}
              {active === "Messages" && (
                <Messages
                  contacts={contacts}
                  messages={messages}
                  setMessages={setMessages}
                  notify={notify}
                />
              )}{" "}
              {active === "Invoices" && (
                <Invoices
                  invoices={invoices}
                  open={() => setInvoiceOpen(true)}
                />
              )}{" "}
              {active === "Reports" && (
                <Reports contacts={contacts} deals={deals} />
              )}{" "}
              {active === "Settings" && (
                <WorkspaceSettings
                  workspace={workspace}
                  trial={trial}
                  save={saveWorkspace}
                  notify={notify}
                />
              )}
            </>
          )}
        </div>
      </main>
      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <ContactDialog onSubmit={addContact} />
      </Dialog>
      <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
        <TaskDialog contacts={contacts} onSubmit={addTask} />
      </Dialog>
      <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
        <InvoiceDialog contacts={contacts} onSubmit={addInvoice} />
      </Dialog>
      {toast && (
        <div className="toast">
          <Check size={18} />
          {toast}
        </div>
      )}
    </div>
  );
}

async function post(url: string, body: unknown): Promise<Record<string, any>> {
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await r.json()) as Record<string, any>;
}
function Loading() {
  return (
    <section className="empty-state panel">
      <span className="login-lock">
        <House />
      </span>
      <h2>Opening your workspace…</h2>
      <p>Loading your clients, follow-ups, and pipeline.</p>
    </section>
  );
}
function Heading({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <span>{description}</span>
      </div>
      {children && <div className="heading-actions">{children}</div>}
    </div>
  );
}
function Metric({
  icon: Icon,
  label,
  value,
  detail,
  trend,
  tone,
}: {
  icon: typeof House;
  label: string;
  value: string;
  detail: string;
  trend: string;
  tone: string;
}) {
  return (
    <article className="metric">
      <div className={`metric-icon ${tone}`}>
        <Icon size={19} />
      </div>
      <span>{label}</span>
      <h2>{value}</h2>
      <footer>
        <small>{detail}</small>
        <b>{trend}</b>
      </footer>
    </article>
  );
}
function PanelTitle({
  title,
  subtitle,
  action,
  onClick,
}: {
  title: string;
  subtitle: string;
  action?: string;
  onClick?: () => void;
}) {
  return (
    <header className="panel-title">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {action && <button onClick={onClick}>{action} →</button>}
    </header>
  );
}
function Empty({
  title,
  text,
  action,
  onClick,
}: {
  title: string;
  text: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <div className="empty-inline">
      <span>
        <House />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      <button onClick={onClick}>{action}</button>
    </div>
  );
}

function Dashboard({
  name,
  tasks,
  toggleTask,
  deals,
  value,
  setActive,
  openTask,
}: {
  name: string;
  tasks: Task[];
  toggleTask: (t: Task) => void;
  deals: Deal[];
  value: number;
  setActive: (x: NavKey) => void;
  openTask: () => void;
}) {
  return (
    <>
      <Heading
        title={`Good ${new Date().getHours() < 12 ? "morning" : "afternoon"}, ${name.split(" ")[0]}`}
        description={
          tasks.filter((t) => !t.done).length
            ? `You have ${tasks.filter((t) => !t.done).length} open follow-ups.`
            : "Your workspace is clear. Add your next follow-up when ready."
        }
      >
        <button className="quiet-button">
          <CalendarDays size={17} /> Today
        </button>
      </Heading>
      <section className="metrics">
        <Metric
          icon={CircleDollarSign}
          label="Pipeline value"
          value={money(value)}
          detail={`${deals.length} opportunities`}
          trend="Live"
          tone="navy"
        />
        <Metric
          icon={TrendingUp}
          label="Potential commission"
          value={money(value * 0.025)}
          detail="At 2.5% estimate"
          trend="Forecast"
          tone="green"
        />
        <Metric
          icon={UsersRound}
          label="Open tasks"
          value={String(tasks.filter((t) => !t.done).length)}
          detail="Follow-ups remaining"
          trend="Today"
          tone="blue"
        />
        <Metric
          icon={Check}
          label="Deals at closing"
          value={String(deals.filter((d) => d.stage === "Closing").length)}
          detail="Final stage"
          trend="Pipeline"
          tone="gold"
        />
      </section>
      <div className="dashboard-grid">
        <section className="panel pipeline-panel">
          <PanelTitle
            title="Deal pipeline"
            subtitle={`${deals.length} opportunities · ${money(value)}`}
            action="View pipeline"
            onClick={() => setActive("Pipeline")}
          />
          {deals.length ? (
            <div className="mini-pipeline">
              {stages.map((s) => (
                <div className="mini-stage" key={s}>
                  <header>
                    <span>{s}</span>
                    <b>{deals.filter((d) => d.stage === s).length}</b>
                  </header>
                  {deals
                    .filter((d) => d.stage === s)
                    .slice(0, 2)
                    .map((d) => (
                      <article key={d.id}>
                        <i className={d.temperature.toLowerCase()} />
                        <h3>{d.name}</h3>
                        <p>{d.client}</p>
                        <strong>{money(d.value)}</strong>
                      </article>
                    ))}
                </div>
              ))}
            </div>
          ) : (
            <Empty
              title="Build your first pipeline"
              text="Add an opportunity to start forecasting your business."
              action="Open pipeline"
              onClick={() => setActive("Pipeline")}
            />
          )}
        </section>
        <section className="panel tasks-panel">
          <PanelTitle
            title="Today’s follow-ups"
            subtitle={`${tasks.filter((t) => !t.done).length} remaining`}
            action="Add task"
            onClick={openTask}
          />
          <div className="task-list">
            {tasks.slice(0, 5).map((t) => (
              <label key={t.id} className={t.done ? "task-done" : ""}>
                <button className="task-check" onClick={() => toggleTask(t)}>
                  {t.done && <Check size={14} />}
                </button>
                <span>
                  <strong>{t.title}</strong>
                  <small>{t.contact || "General"}</small>
                </span>
                <time>{t.due || "Today"}</time>
              </label>
            ))}
          </div>
          {!tasks.length && (
            <Empty
              title="No follow-ups yet"
              text="Add a task so no warm lead slips away."
              action="Add task"
              onClick={openTask}
            />
          )}
        </section>
      </div>
    </>
  );
}
function Contacts({
  contacts,
  query,
  setQuery,
  open,
}: {
  contacts: Contact[];
  query: string;
  setQuery: (x: string) => void;
  open: () => void;
}) {
  return (
    <>
      <Heading
        title="Contacts"
        description="Your buyers, sellers, investors, and professional network."
      >
        <Button onClick={open}>
          <Plus /> Add contact
        </Button>
      </Heading>
      <div className="view-toolbar">
        <div className="local-search">
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contacts"
          />
        </div>
      </div>
      <section className="panel table-panel">
        <div className="contact-table table-head">
          <span>Contact</span>
          <span>Type</span>
          <span>Status</span>
          <span>Source</span>
          <span>Phone</span>
          <span>Budget</span>
        </div>
        {contacts.map((c) => (
          <div className="contact-table" key={c.id}>
            <div className="contact-cell">
              <span className="avatar blue">{initials(c.name)}</span>
              <p>
                <strong>{c.name}</strong>
                <small>{c.email}</small>
              </p>
            </div>
            <span>{c.type}</span>
            <span>
              <em
                className={`status ${c.status.toLowerCase().replace(" ", "-")}`}
              >
                {c.status}
              </em>
            </span>
            <span>{c.source}</span>
            <span>{c.phone || "—"}</span>
            <strong>{c.budget ? money(c.budget) : "—"}</strong>
          </div>
        ))}
        {!contacts.length && (
          <Empty
            title="Your network starts here"
            text="Add your first lead or client to begin."
            action="Add contact"
            onClick={open}
          />
        )}
      </section>
    </>
  );
}
function Pipeline({
  deals,
  move,
  open,
}: {
  deals: Deal[];
  move: (d: Deal, direction: -1 | 1) => void;
  open: () => void;
}) {
  return (
    <>
      <Heading
        title="Sales pipeline"
        description={`${money(deals.reduce((s, d) => s + d.value, 0))} across ${deals.length} opportunities.`}
      >
        <Button onClick={open}>
          <Plus /> New opportunity
        </Button>
      </Heading>
      <div className="kanban">
        {stages.map((s) => (
          <section className="kanban-column" key={s}>
            <header>
              <span>
                <i />
                {s}
              </span>
              <b>{deals.filter((d) => d.stage === s).length}</b>
            </header>
            <small>
              {money(
                deals
                  .filter((d) => d.stage === s)
                  .reduce((a, d) => a + d.value, 0),
              )}
            </small>
            {deals
              .filter((d) => d.stage === s)
              .map((d) => (
                <article className="deal-card" key={d.id}>
                  <div>
                    <em className={d.temperature.toLowerCase()}>
                      {d.temperature}
                    </em>
                    <MoreHorizontal size={16} />
                  </div>
                  <h3>{d.name}</h3>
                  <p>{d.client || "No client linked"}</p>
                  <strong>{money(d.value)}</strong>
                  <footer>
                    <span>{d.note || "No notes"}</span>
                    <div className="deal-stage-controls">
                      {s !== "New lead" && (
                        <button
                          type="button"
                          aria-label="Move deal back one stage"
                          title="Move back"
                          onClick={() => move(d, -1)}
                        >
                          ←
                        </button>
                      )}
                      {s !== "Closing" && (
                        <button
                          type="button"
                          aria-label="Move deal forward one stage"
                          title="Move forward"
                          onClick={() => move(d, 1)}
                        >
                          →
                        </button>
                      )}
                    </div>
                  </footer>
                </article>
              ))}
          </section>
        ))}
      </div>
      {!deals.length && (
        <section className="panel">
          <Empty
            title="No opportunities yet"
            text="Add a property or transaction and move it through each stage."
            action="Create opportunity"
            onClick={open}
          />
        </section>
      )}
    </>
  );
}
function Tasks({
  tasks,
  toggle,
  open,
}: {
  tasks: Task[];
  toggle: (t: Task) => void;
  open: () => void;
}) {
  return (
    <>
      <Heading
        title="Tasks & reminders"
        description="Stay ahead of every follow-up and appointment."
      >
        <Button onClick={open}>
          <Plus /> Add task
        </Button>
      </Heading>
      <section className="tasks-board">
        <div className="panel task-board">
          <PanelTitle
            title="All tasks"
            subtitle={`${tasks.filter((t) => !t.done).length} remaining`}
          />
          {tasks.map((t) => (
            <article key={t.id} className={t.done ? "done" : ""}>
              <button className="task-check" onClick={() => toggle(t)}>
                {t.done && <Check size={14} />}
              </button>
              <div>
                <h3>{t.title}</h3>
                <p>
                  <UserRound size={14} />
                  {t.contact || "General"}
                </p>
              </div>
              <em className={t.priority.toLowerCase()}>{t.priority}</em>
              <time>
                <Clock3 size={14} />
                {t.due || "Today"}
              </time>
            </article>
          ))}
          {!tasks.length && (
            <Empty
              title="Nothing on your list"
              text="Create a follow-up and keep your day moving."
              action="Add task"
              onClick={open}
            />
          )}
        </div>
      </section>
    </>
  );
}
function Messages({
  contacts,
  messages,
  setMessages,
  notify,
}: {
  contacts: Contact[];
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  notify: (x: string) => void;
}) {
  const [selected, setSelected] = useState(contacts[0]?.name || "");
  const thread = messages
    .filter((m) => m.contact === selected)
    .slice()
    .reverse();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem(
      "message",
    ) as HTMLInputElement;
    const r = await post("/api/messages", {
      contact: selected,
      body: input.value,
    });
    if (r.message) {
      setMessages((o) => [r.message, ...o]);
      input.value = "";
      notify("Message logged");
    } else notify(r.error || "Message could not be logged");
  }
  return (
    <>
      <Heading
        title="Messages & notes"
        description="Keep a communication history beside every client."
      />
      <section className="messages-layout panel">
        <aside className="chat-list">
          {contacts.map((c) => (
            <button
              key={c.id}
              className={selected === c.name ? "selected" : ""}
              onClick={() => setSelected(c.name)}
            >
              <span className="avatar blue">{initials(c.name)}</span>
              <p>
                <strong>{c.name}</strong>
                <small>
                  {messages.find((m) => m.contact === c.name)?.body || c.email}
                </small>
              </p>
            </button>
          ))}
          {!contacts.length && (
            <p className="chat-empty">Add a contact before logging messages.</p>
          )}
        </aside>
        <div className="conversation">
          {selected ? (
            <>
              <header>
                <span className="avatar blue">{initials(selected)}</span>
                <p>
                  <strong>{selected}</strong>
                  <small>Communication history</small>
                </p>
                <a
                  className="email-action"
                  href={`mailto:${contacts.find((c) => c.name === selected)?.email || ""}`}
                >
                  <Mail size={17} /> Email
                </a>
              </header>
              <div className="bubbles">
                {thread.map((m) => (
                  <div key={m.id} className={`bubble ${m.direction}`}>
                    {m.body}
                    <time>{new Date(m.createdAt).toLocaleString()}</time>
                  </div>
                ))}
                {!thread.length && (
                  <div className="conversation-empty">
                    No messages logged yet.
                  </div>
                )}
              </div>
              <form className="composer" onSubmit={submit}>
                <input
                  name="message"
                  placeholder="Log a message or conversation note…"
                  required
                />
                <button className="send">
                  <Send size={17} />
                </button>
              </form>
            </>
          ) : (
            <div className="conversation-empty">
              Select a contact to view communication history.
            </div>
          )}
        </div>
      </section>
    </>
  );
}
function Invoices({
  invoices,
  open,
}: {
  invoices: Invoice[];
  open: () => void;
}) {
  const paid = invoices
      .filter((i) => i.status === "Paid")
      .reduce((s, i) => s + i.amount, 0),
    outstanding = invoices
      .filter((i) => i.status !== "Paid")
      .reduce((s, i) => s + i.amount, 0);
  return (
    <>
      <Heading
        title="Invoices & payments"
        description="Create invoice records and track what clients owe."
      >
        <Button onClick={open}>
          <Plus /> New invoice
        </Button>
      </Heading>
      <section className="invoice-metrics">
        <Metric
          icon={CreditCard}
          label="Paid"
          value={money(paid)}
          detail="Collected"
          trend="Live"
          tone="green"
        />
        <Metric
          icon={Clock3}
          label="Outstanding"
          value={money(outstanding)}
          detail="Open balance"
          trend="Live"
          tone="gold"
        />
        <Metric
          icon={FileText}
          label="Total invoices"
          value={String(invoices.length)}
          detail="All records"
          trend="Live"
          tone="navy"
        />
      </section>
      <section className="panel table-panel">
        <div className="invoice-row table-head">
          <span>Invoice</span>
          <span>Client</span>
          <span>Service</span>
          <span>Due date</span>
          <span>Status</span>
          <span>Amount</span>
        </div>
        {invoices.map((i) => (
          <div className="invoice-row" key={i.id}>
            <strong>{i.number}</strong>
            <span>{i.client}</span>
            <span>{i.service}</span>
            <span>{i.dueDate || "—"}</span>
            <span>
              <em className={`invoice-status ${i.status.toLowerCase()}`}>
                {i.status}
              </em>
            </span>
            <strong>{money(i.amount)}</strong>
          </div>
        ))}
        {!invoices.length && (
          <Empty
            title="No invoices yet"
            text="Create a draft to track a client charge."
            action="Create invoice"
            onClick={open}
          />
        )}
      </section>
    </>
  );
}
function Reports({ contacts, deals }: { contacts: Contact[]; deals: Deal[] }) {
  const closed = deals.filter((d) => d.stage === "Closing"),
    volume = closed.reduce((s, d) => s + d.value, 0),
    avg = closed.length ? volume / closed.length : 0,
    conversion = contacts.length ? (closed.length / contacts.length) * 100 : 0;
  return (
    <>
      <Heading
        title="Reports & analytics"
        description="Live performance calculated from your CRM records."
      />
      <section className="metrics">
        <Metric
          icon={CircleDollarSign}
          label="Closing-stage volume"
          value={money(volume)}
          detail={`${closed.length} opportunities`}
          trend="Live"
          tone="navy"
        />
        <Metric
          icon={Building2}
          label="Average deal value"
          value={money(avg)}
          detail="Closing stage"
          trend="Live"
          tone="blue"
        />
        <Metric
          icon={TrendingUp}
          label="Lead conversion"
          value={`${conversion.toFixed(1)}%`}
          detail="Contacts to closing"
          trend="Estimate"
          tone="green"
        />
        <Metric
          icon={UsersRound}
          label="Total contacts"
          value={String(contacts.length)}
          detail="All lead types"
          trend="Live"
          tone="gold"
        />
      </section>
      <section className="panel report-summary">
        <PanelTitle
          title="Pipeline distribution"
          subtitle="Opportunity value by stage"
        />
        <div className="report-stage-list">
          {stages.map((s) => {
            const v = deals
              .filter((d) => d.stage === s)
              .reduce((a, d) => a + d.value, 0);
            return (
              <div key={s}>
                <span>{s}</span>
                <i>
                  <b
                    style={{
                      width: `${deals.length ? Math.max(2, (deals.filter((d) => d.stage === s).length / deals.length) * 100) : 0}%`,
                    }}
                  />
                </i>
                <strong>{money(v)}</strong>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
function WorkspaceSettings({
  workspace,
  trial,
  save,
  notify,
}: {
  workspace: Workspace;
  trial: number;
  save: (f: FormData) => void;
  notify: (x: string) => void;
}) {
  return (
    <>
      <Heading
        title="Workspace settings"
        description="Manage your profile, plan, and account."
      />
      <div className="settings-grid">
        <section className="panel settings-panel">
          <h2>Your profile</h2>
          <div className="profile-edit">
            <span className="avatar big blue">{initials(workspace.name)}</span>
            <div>
              <strong>{workspace.name}</strong>
              <small>{workspace.team || "Independent real estate agent"}</small>
            </div>
          </div>
          <form action={save}>
            <div className="form-grid">
              <label>
                Full name
                <Input name="name" defaultValue={workspace.name} required />
              </label>
              <label>
                Email
                <Input
                  name="email"
                  type="email"
                  defaultValue={workspace.email}
                  required
                />
              </label>
              <label>
                Phone
                <Input name="phone" defaultValue={workspace.phone} />
              </label>
              <label>
                Market
                <Input name="market" defaultValue={workspace.market} />
              </label>
              <label>
                Team or brokerage
                <Input name="team" defaultValue={workspace.team} />
              </label>
            </div>
            <Button>Save changes</Button>
          </form>
        </section>
        <aside className="panel billing-card">
          <span className="pro-badge">
            <Sparkles size={14} /> PRO TRIAL
          </span>
          <h2>{trial} days remaining</h2>
          <p>
            The Pro plan is <strong>$49/month</strong> after your trial. Billing
            activates when Stripe is connected.
          </p>
          <i className="trial-line">
            <span style={{ width: `${Math.max(5, (trial / 14) * 100)}%` }} />
          </i>
          <ul>
            <li>
              <Check />
              Unlimited contacts and tasks
            </li>
            <li>
              <Check />
              Pipeline and reporting
            </li>
            <li>
              <Check />
              Communication and invoice records
            </li>
          </ul>
          <Button asChild>
            <a href="/billing"><CreditCard /> Add payment method</a>
          </Button>
          <a
            className="signout-link"
            href="/api/auth/logout?returnTo=%2F"
            target="_top"
          >
            <LogOut size={16} /> Log out
          </a>
        </aside>
      </div>
    </>
  );
}

function ContactDialog({ onSubmit }: { onSubmit: (x: FormData) => void }) {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add a new contact</DialogTitle>
      </DialogHeader>
      <form action={onSubmit} className="dialog-form">
        <Label>
          Full name
          <Input name="name" placeholder="e.g. Ava Thompson" required />
        </Label>
        <Label>
          Email
          <Input
            name="email"
            type="email"
            placeholder="ava@email.com"
            required
          />
        </Label>
        <Label>
          Phone
          <Input name="phone" placeholder="(305) 555-0000" />
        </Label>
        <div className="dialog-row">
          <Label>
            Type
            <select name="type">
              <option>Buyer</option>
              <option>Seller</option>
              <option>Investor</option>
              <option>Vendor</option>
            </select>
          </Label>
          <Label>
            Status
            <select name="status">
              <option>New</option>
              <option>Hot lead</option>
              <option>Active</option>
              <option>Nurture</option>
            </select>
          </Label>
        </div>
        <div className="dialog-row">
          <Label>
            Source
            <Input name="source" placeholder="Referral, Zillow…" />
          </Label>
          <Label>
            Budget
            <Input name="budget" type="number" min="0" placeholder="850000" />
          </Label>
        </div>
        <Button>Add contact</Button>
      </form>
    </DialogContent>
  );
}
function TaskDialog({
  contacts,
  onSubmit,
}: {
  contacts: Contact[];
  onSubmit: (x: FormData) => void;
}) {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add a follow-up</DialogTitle>
      </DialogHeader>
      <form action={onSubmit} className="dialog-form">
        <Label>
          Task
          <Input name="title" placeholder="What needs to happen?" required />
        </Label>
        <Label>
          Contact
          <select name="contact">
            <option value="">General</option>
            {contacts.map((c) => (
              <option key={c.id}>{c.name}</option>
            ))}
          </select>
        </Label>
        <div className="dialog-row">
          <Label>
            Due time
            <Input name="due" type="time" />
          </Label>
          <Label>
            Priority
            <select name="priority">
              <option>Medium</option>
              <option>High</option>
              <option>Low</option>
            </select>
          </Label>
        </div>
        <Button>Add to my day</Button>
      </form>
    </DialogContent>
  );
}
function DealDialog({ onSubmit }: { onSubmit: (x: FormData) => void }) {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>New opportunity</DialogTitle>
      </DialogHeader>
      <form action={onSubmit} className="dialog-form">
        <Label>
          Property or deal
          <Input
            name="property"
            placeholder="Brickell Flatiron #2107"
            required
          />
        </Label>
        <Label>
          Client
          <Input name="client" placeholder="Client name" />
        </Label>
        <Label>
          Estimated value
          <Input
            name="value"
            type="number"
            min="0"
            placeholder="850000"
            required
          />
        </Label>
        <Label>
          Temperature
          <select name="temperature">
            <option>Warm</option>
            <option>Hot</option>
            <option>Cold</option>
          </select>
        </Label>
        <Label>
          Notes
          <Textarea name="note" placeholder="What is the client looking for?" />
        </Label>
        <Button>Add to pipeline</Button>
      </form>
    </DialogContent>
  );
}
function InvoiceDialog({
  contacts,
  onSubmit,
}: {
  contacts: Contact[];
  onSubmit: (x: FormData) => void;
}) {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create invoice draft</DialogTitle>
      </DialogHeader>
      <form action={onSubmit} className="dialog-form">
        <Label>
          Client
          <select name="client" required>
            <option value="">Select a client</option>
            {contacts.map((c) => (
              <option key={c.id}>{c.name}</option>
            ))}
          </select>
        </Label>
        <Label>
          Service
          <Input
            name="service"
            placeholder="Consultation, photography…"
            required
          />
        </Label>
        <div className="dialog-row">
          <Label>
            Amount
            <Input name="amount" type="number" min="0" required />
          </Label>
          <Label>
            Due date
            <Input name="dueDate" type="date" />
          </Label>
        </div>
        <Button>Create draft</Button>
      </form>
    </DialogContent>
  );
}
