"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useCallback, useEffect, useId, useState, type ReactNode } from "react";
import { briefEntries, type Brief } from "@/lib/brief";
import { serif } from "./booking-button";
import { Modal } from "./modal";

// The /admin Insights and Leads tabs. Data comes from GET /api/admin/dashboard (the
// signed-in admin session); see convex/admin.ts for what each number means.

type Funnel = {
  landing_view: number;
  chat_started: number;
  brief_shown: number;
  booking_clicked: number;
  email_clicked: number;
  leads: number;
};

type Dashboard = {
  funnel: Funnel;
  headlines: { headline: string; views: number; chats: number }[];
  referrers: { referrer: string; visits: number }[];
  depth: { one: number; two: number; three: number; fourPlus: number };
  outcomes: { noBrief: number; briefOnly: number; clicked: number; lead: number };
  conversationCount: number;
  truncated: boolean;
  recent: {
    conversationId: string;
    startedAt: number;
    userMessages: number;
    referrer: string | null;
    device: string | null;
    briefShown: boolean;
    clicked: boolean;
    leadCaptured: boolean;
    firstMessage: string;
  }[];
  feedback: {
    id: string;
    messageId: string;
    conversationId?: string;
    rating: "up" | "down";
    reasons: string[];
    details: string;
    replyText: string;
    userText: string;
    createdAt: number;
  }[];
};

export type Lead = {
  id: string;
  email: string;
  name?: string;
  brief: Brief;
  conversationId?: string;
  createdAt: number;
};

type Transcript = {
  startedAt: number;
  referrer?: string;
  utmSource?: string;
  device?: string;
  model?: string;
  messages: { role: "user" | "assistant"; text: string; tools?: string[]; createdAt: number }[];
};

type DashboardState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "unconfigured" }
  | { status: "ready"; dashboard: Dashboard; leads: Lead[] };

const RANGES = [7, 30, 90] as const;

const dateTime = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const formatDate = (ms: number) => dateTime.format(new Date(ms));
const percent = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : "–");

const pillClass = (selected: boolean) =>
  `rounded-full border px-4 py-2 text-sm font-medium transition ${
    selected
      ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
      : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--border-strong)]"
  }`;

export function useAdminDashboard(onLocked: () => void) {
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);
  const [state, setState] = useState<DashboardState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const response = await fetch(`/api/admin/dashboard?days=${days}`, { cache: "no-store" });
      if (response.status === 401) return onLocked();
      const payload = (await response.json()) as {
        configured?: boolean;
        dashboard?: Dashboard;
        leads?: Lead[];
        error?: string;
        detail?: string;
      };
      if (!response.ok) {
        const message = [payload.error ?? "Could not load the dashboard.", payload.detail].filter(Boolean).join(" ");
        return setState({ status: "error", message });
      }
      if (!payload.configured || !payload.dashboard) return setState({ status: "unconfigured" });
      setState({ status: "ready", dashboard: payload.dashboard, leads: payload.leads ?? [] });
    } catch {
      setState({ status: "error", message: "Request failed. Try again." });
    }
  }, [days, onLocked]);

  useEffect(() => {
    void load();
  }, [load]);

  return { days, setDays, state, reload: load };
}

function Panel({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-5 sm:p-7">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className={`text-2xl tracking-[-0.02em] ${serif}`}>{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm leading-6 text-[var(--muted)]">
      {children}
    </p>
  );
}

export function NotConfiguredNotice() {
  return (
    <Notice>
      Analytics are off on this deployment. Create a Convex project, set <code>CONVEX_DEPLOY_KEY</code>,{" "}
      <code>CONVEX_URL</code> and <code>CONVEX_SERVER_SECRET</code> in Vercel (and the same{" "}
      <code>CONVEX_SERVER_SECRET</code> in Convex), then redeploy.
    </Notice>
  );
}

// One series per chart: bars in the accent colour, the value as text beside each.
function BarList({ rows, total }: { rows: { label: string; value: number }[]; total: number }) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  return (
    <ul className="space-y-2.5">
      {rows.map((row) => (
        <li key={row.label} className="grid grid-cols-[minmax(0,9rem)_1fr_4.5rem] items-center gap-3 text-sm">
          <span className="truncate text-[var(--muted)]" title={row.label}>
            {row.label}
          </span>
          <span className="h-3 rounded-full bg-[var(--surface-muted)]">
            <span
              className="block h-3 rounded-full bg-[var(--accent)]"
              style={{ width: `${(row.value / max) * 100}%`, minWidth: row.value > 0 ? 6 : 0 }}
            />
          </span>
          <span className="text-right tabular-nums">
            {row.value} <span className="text-[var(--muted)]">{percent(row.value, total)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function Stat({ label, value, note }: { label: string; value: number; note?: string }) {
  return (
    <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className={`mt-1 text-3xl tabular-nums tracking-[-0.02em] ${serif}`}>{value}</p>
      {note ? <p className="mt-1 text-xs text-[var(--muted)]">{note}</p> : null}
    </div>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-xs text-[var(--muted)]">{children}</span>
  );
}

export function RangePicker({ days, onChange }: { days: number; onChange: (days: (typeof RANGES)[number]) => void }) {
  return (
    <div role="group" aria-label="Date range" className="flex gap-1.5">
      {RANGES.map((range) => (
        <button key={range} type="button" aria-pressed={days === range} onClick={() => onChange(range)} className={pillClass(days === range)}>
          {range} days
        </button>
      ))}
    </div>
  );
}

export function Insights({ dashboard, onOpenConversation }: { dashboard: Dashboard; onOpenConversation: (id: string) => void }) {
  const { funnel, depth, outcomes } = dashboard;
  const visits = funnel.landing_view;
  return (
    <div className="space-y-6">
      {dashboard.truncated ? <Notice>There&apos;s more data than this view reads at once; numbers are a lower bound.</Notice> : null}

      <Panel title="Funnel">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <Stat label="Visits" value={visits} />
          <Stat label="Started a chat" value={funnel.chat_started} note={`${percent(funnel.chat_started, visits)} of visits`} />
          <Stat label="Got a brief" value={funnel.brief_shown} note={`${percent(funnel.brief_shown, funnel.chat_started)} of chats`} />
          <Stat label="Clicked booking" value={funnel.booking_clicked} note={`${percent(funnel.booking_clicked, visits)} of visits`} />
          <Stat label="Clicked email" value={funnel.email_clicked} note={`${percent(funnel.email_clicked, visits)} of visits`} />
          <Stat label="Left their email" value={funnel.leads} />
        </div>
        <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
          Visits are page loads of the chat in one browser tab. Booking clicks open Cal.com; whether they booked shows in Cal.com.
        </p>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="How far chats went" aside={<span className="text-sm text-[var(--muted)]">{dashboard.conversationCount} chats</span>}>
          <BarList
            total={dashboard.conversationCount}
            rows={[
              { label: "1 message", value: depth.one },
              { label: "2 messages", value: depth.two },
              { label: "3 messages", value: depth.three },
              { label: "4 or more", value: depth.fourPlus },
            ]}
          />
          <h3 className="mb-2.5 mt-6 text-sm font-medium">Where they ended</h3>
          <BarList
            total={dashboard.conversationCount}
            rows={[
              { label: "Left before a brief", value: outcomes.noBrief },
              { label: "Got a brief, no click", value: outcomes.briefOnly },
              { label: "Clicked book or email", value: outcomes.clicked },
              { label: "Left their email", value: outcomes.lead },
            ]}
          />
        </Panel>

        <Panel title="Where visits came from">
          {dashboard.referrers.length > 0 ? (
            <BarList total={visits} rows={dashboard.referrers.map(({ referrer, visits: value }) => ({ label: referrer, value }))} />
          ) : (
            <p className="text-sm text-[var(--muted)]">No visits yet.</p>
          )}
          <h3 className="mb-2.5 mt-6 text-sm font-medium">Headlines</h3>
          <table className="w-full text-sm">
            <thead className="text-left text-[var(--muted)]">
              <tr>
                <th className="pb-2 font-normal">Headline</th>
                <th className="pb-2 text-right font-normal">Visits</th>
                <th className="pb-2 text-right font-normal">Chats</th>
                <th className="pb-2 text-right font-normal">Rate</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.headlines.map((row) => (
                <tr key={row.headline} className="border-t border-[var(--border)]">
                  <td className="py-2 pr-3">{row.headline}</td>
                  <td className="py-2 text-right tabular-nums">{row.views}</td>
                  <td className="py-2 text-right tabular-nums">{row.chats}</td>
                  <td className="py-2 text-right tabular-nums">{percent(row.chats, row.views)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <Panel title="Feedback" aside={<span className="text-sm text-[var(--muted)]">{dashboard.feedback.length} ratings</span>}>
        {dashboard.feedback.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No ratings yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {dashboard.feedback.map((item) => (
              <li key={item.id} className="space-y-2 py-4 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  {item.rating === "up" ? (
                    <ThumbsUp size={16} aria-label="Good reply" />
                  ) : (
                    <ThumbsDown size={16} aria-label="Bad reply" />
                  )}
                  <span className="font-medium">{item.rating === "up" ? "Good reply" : "Bad reply"}</span>
                  <span className="text-[var(--muted)]">{formatDate(item.createdAt)}</span>
                  {item.reasons.map((reason) => (
                    <Badge key={reason}>{reason}</Badge>
                  ))}
                  {item.conversationId ? (
                    <button type="button" onClick={() => onOpenConversation(item.conversationId!)} className="ml-auto text-[var(--accent)] underline underline-offset-4">
                      View chat
                    </button>
                  ) : null}
                </div>
                {item.details ? <p className="leading-6">&ldquo;{item.details}&rdquo;</p> : null}
                {item.userText ? <p className="line-clamp-2 leading-6 text-[var(--muted)]">Visitor: {item.userText}</p> : null}
                <p className="line-clamp-3 leading-6 text-[var(--muted)]">Skaffen: {item.replyText}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Recent chats">
        {dashboard.recent.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No chats yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {dashboard.recent.map((chat) => (
              <li key={chat.conversationId}>
                <button
                  type="button"
                  onClick={() => onOpenConversation(chat.conversationId)}
                  className="flex w-full flex-col gap-1.5 py-3.5 text-left text-sm transition hover:opacity-80"
                >
                  <span className="line-clamp-2 leading-6">{chat.firstMessage || "(no text)"}</span>
                  <span className="flex flex-wrap items-center gap-2 text-[var(--muted)]">
                    {formatDate(chat.startedAt)} · {chat.userMessages} {chat.userMessages === 1 ? "message" : "messages"}
                    {chat.referrer ? ` · ${chat.referrer}` : ""}
                    {chat.device ? ` · ${chat.device}` : ""}
                    {chat.briefShown ? <Badge>Brief</Badge> : null}
                    {chat.clicked ? <Badge>Clicked</Badge> : null}
                    {chat.leadCaptured ? <Badge>Lead</Badge> : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

export function Leads({
  leads,
  onOpenConversation,
  onDeleted,
}: {
  leads: Lead[];
  onOpenConversation: (id: string) => void;
  onDeleted: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const remove = async (lead: Lead) => {
    if (!window.confirm(`Delete the lead from ${lead.email}? This can't be undone.`)) return;
    setError(null);
    const response = await fetch("/api/admin/leads", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: lead.id }),
    }).catch(() => null);
    if (!response?.ok) return setError("Could not delete the lead.");
    onDeleted();
  };

  return (
    <Panel title="Leads" aside={<span className="text-sm text-[var(--muted)]">Kept until you delete them</span>}>
      {error ? <p role="alert" className="mb-3 text-sm text-[var(--muted)]">{error}</p> : null}
      {leads.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No one has left their email yet.</p>
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {leads.map((lead) => (
            <li key={lead.id} className="space-y-2 py-4 text-sm">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <a href={`mailto:${lead.email}`} className="font-medium underline-offset-4 hover:underline">
                  {lead.name ? `${lead.name} <${lead.email}>` : lead.email}
                </a>
                <span className="text-[var(--muted)]">{formatDate(lead.createdAt)}</span>
                <span className="ml-auto flex gap-3">
                  {lead.conversationId ? (
                    <button type="button" onClick={() => onOpenConversation(lead.conversationId!)} className="text-[var(--accent)] underline underline-offset-4">
                      View chat
                    </button>
                  ) : null}
                  <button type="button" onClick={() => remove(lead)} className="text-[var(--muted)] underline underline-offset-4 hover:text-[var(--foreground)]">
                    Delete
                  </button>
                </span>
              </div>
              <dl className="grid grid-cols-[8rem_minmax(0,1fr)] gap-x-3 gap-y-1 leading-6">
                {briefEntries(lead.brief).map(({ key, label, value }) => (
                  <div key={key} className="contents">
                    <dt className="text-[var(--muted)]">{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function TranscriptDialog({ conversationId, onClose, onLocked }: { conversationId: string; onClose: () => void; onLocked: () => void }) {
  const titleId = useId();
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/conversation?id=${encodeURIComponent(conversationId)}`, { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) return onLocked();
        const payload = (await response.json()) as { conversation?: Transcript; error?: string; detail?: string };
        if (cancelled) return;
        if (!response.ok || !payload.conversation) {
          setError([payload.error ?? "Could not load the chat.", payload.detail].filter(Boolean).join(" "));
        }
        else setTranscript(payload.conversation);
      })
      .catch(() => !cancelled && setError("Request failed."));
    return () => {
      cancelled = true;
    };
  }, [conversationId, onLocked]);

  return (
    <Modal labelledBy={titleId} onClose={onClose}>
      <div className="flex max-h-[85dvh] w-full max-w-2xl flex-col rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] p-5">
          <div>
            <h2 id={titleId} className={`text-2xl tracking-[-0.02em] ${serif}`}>
              Chat transcript
            </h2>
            {transcript ? (
              <p className="mt-1 text-sm text-[var(--muted)]">
                {formatDate(transcript.startedAt)}
                {transcript.utmSource ?? transcript.referrer ? ` · ${transcript.utmSource ?? transcript.referrer}` : ""}
                {transcript.device ? ` · ${transcript.device}` : ""}
                {transcript.model ? ` · ${transcript.model}` : ""}
              </p>
            ) : null}
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-[var(--border)] px-4 py-2 text-sm">
            Close
          </button>
        </div>
        <div className="overflow-y-auto p-5">
          {error ? <p className="text-sm text-[var(--muted)]">{error}</p> : null}
          {!transcript && !error ? <p className="text-sm text-[var(--muted)]">Loading…</p> : null}
          {transcript ? (
            <ol className="space-y-4">
              {transcript.messages.map((message, index) => (
                <li key={index} className={message.role === "user" ? "flex justify-end" : ""}>
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap text-[15px] leading-6 ${
                      message.role === "user" ? "rounded-[1.25rem] bg-[var(--user-bubble)] px-4 py-2.5" : ""
                    }`}
                  >
                    <span className="sr-only">{message.role === "user" ? "Visitor:" : "Skaffen:"} </span>
                    {message.text || <span className="text-[var(--muted)]">(no text)</span>}
                    {message.tools?.length ? (
                      <span className="mt-1 block text-xs text-[var(--muted)]">Showed: {message.tools.join(", ")}</span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
