"use client";

import { ChevronDown, ChevronRight, Mail, Reply, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  read: boolean;
  created_at: string;
}

function notifyUnreadChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("messages:read-changed"));
  }
}

function previewText(s: string, limit = 110): string {
  const flat = s.replace(/\s+/g, " ").trim();
  return flat.length > limit ? flat.slice(0, limit - 1) + "…" : flat;
}

export default function AdminMessagesPage() {
  const [items, setItems] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setItems([]);
      setLoading(false);
      return;
    }
    const sb = getSupabaseBrowserClient();
    sb.from("messages").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setItems((data as Message[]) ?? []);
      setLoading(false);
    });
  }, []);

  async function setRead(m: Message, read: boolean) {
    if (!isSupabaseConfigured()) return;
    if (m.read === read) return;
    const sb = getSupabaseBrowserClient();
    await sb.from("messages").update({ read }).eq("id", m.id);
    setItems((prev) => prev.map((x) => (x.id === m.id ? { ...x, read } : x)));
    notifyUnreadChanged();
  }

  async function toggleRead(m: Message) {
    await setRead(m, !m.read);
  }

  function toggleOpen(m: Message) {
    const next = openId === m.id ? null : m.id;
    setOpenId(next);
    if (next && !m.read) {
      // Auto-mark-as-read when admin clicks to read the full message.
      setRead(m, true);
    }
  }

  async function remove(m: Message) {
    if (!confirm("Delete this message?")) return;
    if (!isSupabaseConfigured()) return;
    const sb = getSupabaseBrowserClient();
    await sb.from("messages").delete().eq("id", m.id);
    setItems((prev) => prev.filter((x) => x.id !== m.id));
    if (openId === m.id) setOpenId(null);
    notifyUnreadChanged();
  }

  const unreadCount = items.filter((m) => !m.read).length;

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold">Messages</h1>
      <p className="text-sm text-neutral-500">
        {items.length} message{items.length === 1 ? "" : "s"}
        {unreadCount > 0 ? ` · ${unreadCount} unread` : ""}.
      </p>

      {!isSupabaseConfigured() && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          Configure Supabase to receive and manage contact‑form messages.
        </div>
      )}

      <div className="mt-5 space-y-3">
        {loading ? (
          <p className="text-sm text-neutral-400">Loading…</p>
        ) : items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-400">
            No messages yet.
          </p>
        ) : (
          items.map((m) => {
            const isOpen = openId === m.id;
            return (
              <article
                key={m.id}
                className={`rounded-xl border bg-white transition ${
                  m.read ? "border-neutral-200" : "border-recette-300 bg-recette-50/40"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleOpen(m)}
                  aria-expanded={isOpen}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left"
                >
                  <span className="mt-1 text-neutral-400">
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      {!m.read && (
                        <span className="inline-flex items-center rounded-full bg-recette-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                          New
                        </span>
                      )}
                      <span className={`text-sm ${m.read ? "font-medium text-neutral-700" : "font-bold text-neutral-900"}`}>
                        {m.name}
                      </span>
                      <span className="text-xs text-neutral-500">·</span>
                      <span className="truncate text-xs text-neutral-500">{m.email}</span>
                    </span>
                    {!isOpen && (
                      <span className="mt-1 block truncate text-xs text-neutral-500">
                        {previewText(m.message)}
                      </span>
                    )}
                  </span>
                  <span className="hidden flex-none whitespace-nowrap text-xs text-neutral-500 sm:block">
                    {new Date(m.created_at).toLocaleString()}
                  </span>
                </button>

                {isOpen && (
                  <div className="border-t border-neutral-100 px-4 py-3">
                    <p className="whitespace-pre-line text-sm text-neutral-800">{m.message}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                      <a
                        href={`mailto:${m.email}?subject=${encodeURIComponent(
                          `Re: your message to sucre et sel`,
                        )}`}
                        className="inline-flex items-center gap-1 rounded-md border border-recette-600 bg-recette-600 px-3 py-1.5 font-semibold text-white hover:bg-recette-700"
                      >
                        <Reply className="h-3 w-3" /> Reply
                      </a>
                      <button
                        type="button"
                        onClick={() => toggleRead(m)}
                        className="inline-flex items-center gap-1 rounded-md border border-neutral-300 px-3 py-1.5 hover:border-recette-600 hover:text-recette-700"
                      >
                        <Mail className="h-3 w-3" /> {m.read ? "Mark unread" : "Mark read"}
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(m)}
                        className="inline-flex items-center gap-1 rounded-md border border-neutral-300 px-3 py-1.5 hover:border-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                      <span className="ml-auto text-neutral-500 sm:hidden">
                        {new Date(m.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
