"use client";

import { ShieldCheck, ShieldOff, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

interface StaffRow {
  id: string;
  email: string | null;
  role: string;
  marketing_optin: boolean;
  created_at: string;
}

export default function AdminStaffPage() {
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [selfEmail, setSelfEmail] = useState<string | null>(null);

  async function reload() {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    const sb = getSupabaseBrowserClient();
    const [{ data: usersData, error }, { data: userData }] = await Promise.all([
      sb.rpc("admin_list_users"),
      sb.auth.getUser(),
    ]);
    setSelfEmail(userData.user?.email ?? null);
    if (error) {
      setFeedback({ kind: "err", text: error.message });
    } else {
      setRows((usersData as StaffRow[]) ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    reload();
  }, []);

  async function setRole(targetEmail: string, role: "admin" | "user") {
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ kind: "err", text: data.error ?? "Failed." });
      } else {
        setFeedback({
          kind: "ok",
          text:
            role === "admin"
              ? `${data.email} is now an admin.`
              : `${data.email} is no longer an admin.`,
        });
        setEmail("");
        await reload();
      }
    } catch (e) {
      setFeedback({ kind: "err", text: e instanceof Error ? e.message : "Network error." });
    } finally {
      setSubmitting(false);
    }
  }

  function onPromote(e: React.FormEvent) {
    e.preventDefault();
    const v = email.trim();
    if (!v) return;
    setRole(v, "admin");
  }

  const admins = rows.filter((r) => r.role === "admin");
  const customers = rows.filter((r) => r.role !== "admin");

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold">Staff & Users</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Promote an existing user to admin, or demote them back to customer. New staff need to
        sign up at <code className="font-mono text-xs">/admin/login</code> first, then you can
        promote them here.
      </p>

      <form
        onSubmit={onPromote}
        className="mt-5 flex flex-wrap items-end gap-3 rounded-xl border border-neutral-200 bg-white p-4"
      >
        <div className="flex-1 min-w-[240px]">
          <label className="mb-1 block text-xs font-semibold text-neutral-600">Promote user</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="staff@example.com"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-barn-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-1.5 rounded-md bg-barn-600 px-4 py-2 text-sm font-bold text-white hover:bg-barn-700 disabled:opacity-50"
        >
          <UserPlus className="h-4 w-4" /> {submitting ? "Working…" : "Make admin"}
        </button>
      </form>

      {feedback && (
        <div
          role="alert"
          className={`mt-3 rounded-md border px-3 py-2 text-xs ${
            feedback.kind === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {!isSupabaseConfigured() && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <strong>Read‑only mode.</strong> Configure Supabase to manage staff.
        </div>
      )}

      <Section title="Admins" subtitle="Have full access to the admin dashboard.">
        {loading ? (
          <p className="text-sm text-neutral-400">Loading…</p>
        ) : admins.length === 0 ? (
          <p className="text-sm text-neutral-500">No admins yet.</p>
        ) : (
          <Table
            rows={admins}
            selfEmail={selfEmail}
            onAction={(em) => setRole(em, "user")}
            actionLabel="Demote"
            actionIcon={<ShieldOff className="h-3.5 w-3.5" />}
            highlight
          />
        )}
      </Section>

      <Section title="Customers" subtitle="Standard storefront users.">
        {loading ? (
          <p className="text-sm text-neutral-400">Loading…</p>
        ) : customers.length === 0 ? (
          <p className="text-sm text-neutral-500">No customer profiles yet.</p>
        ) : (
          <Table
            rows={customers}
            selfEmail={selfEmail}
            onAction={(em) => setRole(em, "admin")}
            actionLabel="Make admin"
            actionIcon={<ShieldCheck className="h-3.5 w-3.5" />}
          />
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-700">{title}</h2>
      {subtitle && <p className="text-xs text-neutral-500">{subtitle}</p>}
      <div className="mt-3 overflow-hidden rounded-xl border border-neutral-200 bg-white">
        {children}
      </div>
    </section>
  );
}

function Table({
  rows,
  selfEmail,
  onAction,
  actionLabel,
  actionIcon,
  highlight = false,
}: {
  rows: StaffRow[];
  selfEmail: string | null;
  onAction: (email: string) => void;
  actionLabel: string;
  actionIcon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
        <tr>
          <th className="px-4 py-3">Email</th>
          <th className="px-4 py-3">Joined</th>
          <th className="px-4 py-3">Marketing</th>
          <th className="px-4 py-3 text-right">Action</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-neutral-100">
        {rows.map((r) => {
          const isSelf = r.email && selfEmail && r.email.toLowerCase() === selfEmail.toLowerCase();
          return (
            <tr key={r.id} className={highlight ? "bg-barn-50/30" : ""}>
              <td className="px-4 py-3 font-medium">
                {r.email ?? <span className="text-neutral-400">(no email)</span>}
                {isSelf && (
                  <span className="ml-2 rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] font-bold uppercase text-neutral-700">
                    You
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-neutral-500">
                {new Date(r.created_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </td>
              <td className="px-4 py-3 text-xs">
                {r.marketing_optin ? (
                  <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700">SUBSCRIBED</span>
                ) : (
                  <span className="text-neutral-400">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                {r.email && !isSelf ? (
                  <button
                    onClick={() => onAction(r.email!)}
                    className="inline-flex items-center gap-1 text-xs text-neutral-600 hover:text-barn-700"
                  >
                    {actionIcon} {actionLabel}
                  </button>
                ) : (
                  <span className="text-xs text-neutral-300">—</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
