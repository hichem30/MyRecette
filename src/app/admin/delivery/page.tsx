"use client";

import { MapPin, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { DeliveryZone } from "@/lib/types";

const US_STATES = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"],
  ["CA", "California"], ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"],
  ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"],
  ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"],
  ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"], ["MD", "Maryland"],
  ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"],
  ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"],
  ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"],
  ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"], ["OK", "Oklahoma"],
  ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"],
  ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"],
  ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"], ["WV", "West Virginia"],
  ["WI", "Wisconsin"], ["WY", "Wyoming"],
] as const;

export default function AdminDeliveryPage() {
  const [items, setItems] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [stateCode, setStateCode] = useState("OK");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setItems([]);
      setLoading(false);
      return;
    }
    const sb = getSupabaseBrowserClient();
    sb.from("delivery_zones")
      .select("*")
      .order("state_code", { ascending: true })
      .then(({ data }) => {
        setItems((data as DeliveryZone[]) ?? []);
        setLoading(false);
      });
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured()) {
      alert("Configure Supabase to save.");
      return;
    }
    const sb = getSupabaseBrowserClient();
    const payload = {
      state_code: stateCode,
      city: city.trim() || null,
      notes: notes.trim() || null,
    };
    const { data, error } = await sb.from("delivery_zones").insert(payload).select().single();
    if (error) {
      alert(error.message);
      return;
    }
    setItems((prev) => [...prev, data as DeliveryZone]);
    setCity("");
    setNotes("");
  }

  async function remove(id: string) {
    if (!confirm("Remove this zone?")) return;
    if (!isSupabaseConfigured()) return;
    const sb = getSupabaseBrowserClient();
    const { error } = await sb.from("delivery_zones").delete().eq("id", id);
    if (error) alert(error.message);
    else setItems((prev) => prev.filter((x) => x.id !== id));
  }

  const grouped = items.reduce<Record<string, DeliveryZone[]>>((acc, z) => {
    (acc[z.state_code] ??= []).push(z);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl">
      <div className="mb-5">
        <h1 className="font-serif text-2xl font-bold">Delivery Zones</h1>
        <p className="text-sm text-neutral-500">
          Set which US states (and optionally specific cities) you ship to. Customers ordering from outside these zones will see an error at checkout.
        </p>
        {items.length === 0 && (
          <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            No zones set — checkout currently allows all US addresses. Add at least one zone to restrict deliveries.
          </p>
        )}
      </div>

      <form onSubmit={add} className="mb-5 grid items-end gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:grid-cols-[1fr_1fr_1fr_auto]">
        <label className="text-xs font-semibold text-neutral-700">
          State
          <select
            required
            value={stateCode}
            onChange={(e) => setStateCode(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
          >
            {US_STATES.map(([code, name]) => (
              <option key={code} value={code}>{code} — {name}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-neutral-700">
          City (optional)
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="(leave empty to allow the entire state)"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs font-semibold text-neutral-700">
          Notes (optional)
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. local pickup only"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
          />
        </label>
        <button type="submit" className="inline-flex h-9 items-center gap-1 rounded-md bg-barn-600 px-4 text-sm font-bold text-white hover:bg-barn-700">
          <Plus className="h-4 w-4" /> Add
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-neutral-400">Loading...</p>
      ) : (
        <div className="space-y-3">
          {Object.entries(grouped).map(([state, zones]) => (
            <div key={state} className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
              <div className="flex items-center gap-2 border-b border-neutral-100 bg-neutral-50 px-4 py-2">
                <MapPin className="h-4 w-4 text-barn-600" />
                <span className="font-bold">{state}</span>
                <span className="text-xs text-neutral-500">
                  ({US_STATES.find(([c]) => c === state)?.[1] ?? state})
                </span>
              </div>
              <ul className="divide-y divide-neutral-100">
                {zones.map((z) => (
                  <li key={z.id} className="flex items-center justify-between px-4 py-2 text-sm">
                    <div>
                      {z.city ? <span className="font-medium">{z.city}</span> : <span className="italic text-neutral-500">Entire state</span>}
                      {z.notes && <span className="ml-2 text-xs text-neutral-500">— {z.notes}</span>}
                    </div>
                    <button onClick={() => remove(z.id)} className="inline-flex items-center gap-1 text-xs text-neutral-600 hover:text-red-700">
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
