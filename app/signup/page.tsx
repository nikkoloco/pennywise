import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";
import { Brand } from "@/components/auth/Brand";

export const metadata: Metadata = { title: "Create an account" };

export default function SignUpPage() {
  return (
    <main className="safe-top safe-bottom flex flex-1 flex-col items-center justify-center gap-10 px-6 py-12">
      <Brand />
      <AuthForm mode="signup" />
    </main>
  );
}
