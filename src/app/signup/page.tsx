import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";

export default function SignupPage() {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center px-4 py-12">
      <Suspense
        fallback={
          <p className="text-sm text-muted">Loading…</p>
        }
      >
        <AuthForm mode="signup" />
      </Suspense>
    </main>
  );
}
