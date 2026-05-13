"use client";

import { useState } from "react";

export function NewsletterForm({
  placeholder,
  subscribe,
  thanks,
}: {
  placeholder: string;
  subscribe: string;
  thanks: string;
}) {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return <p className="text-xs text-emerald-400">{thanks}</p>;
  }

  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
    >
      <input
        type="email"
        required
        placeholder={placeholder}
        className="flex-1 rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm placeholder-neutral-500 outline-none focus:border-barn-500"
      />
      <button
        type="submit"
        className="rounded-md bg-barn-600 px-3 py-2 text-sm font-medium text-white hover:bg-barn-700 transition"
      >
        {subscribe}
      </button>
    </form>
  );
}
