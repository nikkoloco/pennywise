"use client";

import { createContext, useContext } from "react";
import type { PaySchedule } from "@/lib/payPeriod";

const PayScheduleContext = createContext<PaySchedule | null>(null);

/** Hands the account's pay schedule to every client component under the tabs. */
export function PayScheduleProvider({
  schedule,
  children,
}: {
  schedule: PaySchedule;
  children: React.ReactNode;
}) {
  return <PayScheduleContext value={schedule}>{children}</PayScheduleContext>;
}

export function usePaySchedule() {
  const schedule = useContext(PayScheduleContext);
  if (!schedule) throw new Error("usePaySchedule outside PayScheduleProvider");
  return schedule;
}
