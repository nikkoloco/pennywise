import Link from "next/link";
import { Card } from "@/components/ui/Card";

export default function NotFound() {
  return (
    <main className="safe-top flex flex-1 flex-col justify-center gap-4 px-6">
      <Card>
        <p className="text-sm font-semibold text-paper">Nothing here.</p>
        <p className="mt-2 text-sm text-sky-200">
          That page does not exist.{" "}
          <Link href="/" className="font-semibold text-gold-500">
            Back to today
          </Link>
          .
        </p>
      </Card>
    </main>
  );
}
