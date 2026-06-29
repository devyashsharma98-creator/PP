import { z } from "zod";

// ── Weekly availability schedule ──────────────────────────────────────────────
// A scholar's recurring weekly availability. Each weekday maps to an array of
// time slots { from: "HH:MM", to: "HH:MM" }. Stored as jsonb on the scholars
// table. Empty object = no weekly schedule set.

export const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export const WEEKDAY_LABELS: Record<Weekday, { en: string; hi: string }> = {
  monday: { en: "Monday", hi: "सोमवार" },
  tuesday: { en: "Tuesday", hi: "मंगलवार" },
  wednesday: { en: "Wednesday", hi: "बुधवार" },
  thursday: { en: "Thursday", hi: "गुरुवार" },
  friday: { en: "Friday", hi: "शुक्रवार" },
  saturday: { en: "Saturday", hi: "शनिवार" },
  sunday: { en: "Sunday", hi: "रविवार" },
};

const timeSlotSchema = z.object({
  from: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:MM format."),
  to: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:MM format."),
});

export type TimeSlot = z.infer<typeof timeSlotSchema>;

export const weeklyAvailabilitySchema = z.record(
  z.string(),
  z.array(timeSlotSchema),
);
export type WeeklyAvailability = z.infer<typeof weeklyAvailabilitySchema>;

export const emptyWeeklyAvailability: WeeklyAvailability = {};
