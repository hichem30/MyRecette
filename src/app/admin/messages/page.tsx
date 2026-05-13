"use client";

import { Mail, Trash2 } from "lucide-react";
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

export default function AdminMessagesPage() {
  const [items, setItems] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

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

  async function toggleRead(m: Message) {
    if (!isSupabaseConfigured()) return;
    const sb = getSupabaseBrowserClient();
    await sb.from("messages").update({ read: !m.read }).eq("id", m.id);
    setItems((prev) => prev.map((x) => (x.id === m.id ? { ...x, read: !m.read } : x)));
  }
  async function remove(m: Message) {
    if (!confirm("Delete this message?")) return;
    if (!isSupabaseConfigured()) return;
    const sb = getSupabaseBrowserClient();
    await sb.from("messages").delete().eq("id", m.id);
    setItems((prev) => prev.filter((x) => x.id !== m.id));
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold">Messages</h1>
      <p className="text-sm text-neutral-500">{items.length} message{items.length === 1 ? "" : "s"}.</p>

      {!isSupabaseConfigured() && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          Configure Supabase to receive and manage contact‑form messages.
        </div>
      )}

      <div className="mt-5 space-y-3">
        {loading ? (
          <p className="text-sm text-neutral-400">Loading...</p>
        ) : items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-400">
            No messages yet.
          </p>
        ) : (
          items.map((m) => (
            <article
              key={m.id}
              className={`rounded-xl border bg-white p-4 ${
                m.read ? "border-neutral-200" : "border-barn-300 bg-barn-50/40"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">{m.name}</p>
                  <p className="text-xs text-neutral-500">{m.email}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <span>{new Date(m.created_at).toLocaleString()}</span>
                  <button
                    onClick={() => toggleRead(m)}
                    className="inline-flex items-center gap-1 rounded-md border border-neutral-300 px-2 py-1 hover:border-barn-600 hover:text-barn-700"
                  >
                    <Mail className="h-3 w-3" /> {m.read ? "Mark unread" : "Mark read"}
                  </button>
                  <button
                    onClick={() => remove(m)}
                    className="inline-flex items-center gap-1 rounded-md border border-neutral-300 px-2 py-1 hover:border-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm text-neutral-700">{m.message}</p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
