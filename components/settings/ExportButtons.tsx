"use client";

import { useState } from "react";
import { exportData } from "@/app/actions";
import { Button } from "@/components/ui/Button";

const TYPES = {
  csv: "text/csv",
  json: "application/json",
};

export function ExportButtons() {
  const [busy, setBusy] = useState<string | null>(null);

  async function download(format: "csv" | "json") {
    setBusy(format);
    try {
      const body = await exportData(format);
      const url = URL.createObjectURL(new Blob([body], { type: TYPES[format] }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `pennywise-${new Date().toISOString().slice(0, 10)}.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="secondary" onClick={() => download("csv")} className="flex-1">
        {busy === "csv" ? "Preparing" : "CSV"}
      </Button>
      <Button variant="secondary" onClick={() => download("json")} className="flex-1">
        {busy === "json" ? "Preparing" : "JSON"}
      </Button>
    </div>
  );
}
