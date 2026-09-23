"use client";

import { useAsync } from "@/hooks/use-async";
import { siteService } from "@/services/site.service";
import type { SiteSettings } from "@/types";

/** Shown until the live values arrive (and if the request ever fails). */
const FALLBACK: SiteSettings = {
  orgName: "Nirvona Education Tech Pvt. Ltd.",
  gstin: "",
  address: "Chhatrapati Sambhajinagar, Maharashtra",
  contactPersonName: "",
  phone: "+91 77097 66717",
  whatsapp: "",
  email: "support@nirvona.edu.in",
};

/** Digits (and a leading +) only - safe to put in a tel: / wa.me link. */
export function phoneDigits(value: string): string {
  return value.replace(/[^\d+]/g, "");
}

/**
 * The organisation details an admin edits in Admin -> Settings (address,
 * contact person, phone, email...). The footer, contact page, student
 * support page and receipts all read this, so a change made once shows up
 * everywhere.
 */
export function useSiteSettings() {
  const state = useAsync(() => siteService.getSettings(), []);
  const settings: SiteSettings = { ...FALLBACK, ...(state.data ?? {}) };
  const phone = settings.phone;
  // WhatsApp falls back to the main number when the admin leaves it blank.
  const whatsapp = settings.whatsapp || phone;
  const waDigits = phoneDigits(whatsapp).replace(/^\+/, "");
  return {
    settings,
    phone,
    phoneHref: `tel:${phoneDigits(phone)}`,
    whatsapp,
    whatsappHref: `https://wa.me/${waDigits}`,
    emailHref: `mailto:${settings.email}`,
    addressLines: settings.address.split("\n").map((l) => l.trim()).filter(Boolean),
    status: state.status,
  };
}
