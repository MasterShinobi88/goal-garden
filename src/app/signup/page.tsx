import { AuthForm } from "@/components/AuthForm";

export default function SignupPage() {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center px-4 py-12">
      <AuthForm mode="signup" />
    </main>
  );
}
