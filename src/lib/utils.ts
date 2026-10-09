import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number) {
  return usd.format(Math.round(amount));
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "Never";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
