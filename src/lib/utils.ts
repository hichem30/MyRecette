import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, locale: string = "en-US"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/** Whether a time-limited discount window is active right now. */
export function isDiscountWindowActive(
  startsAt?: string | null,
  endsAt?: string | null,
  now: Date = new Date(),
): boolean {
  if (startsAt) {
    const s = new Date(startsAt);
    if (!Number.isNaN(s.getTime()) && s > now) return false;
  }
  if (endsAt) {
    const e = new Date(endsAt);
    if (!Number.isNaN(e.getTime()) && e < now) return false;
  }
  return true;
}
