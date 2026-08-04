import type { Metadata } from "next";
import { AuthShell } from "@/components/layout/auth-shell";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = { title: "Sign in — Dabang Admin" };

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to your workspace"
      subtitle="Enter your credentials to access the dashboard."
    >
      <LoginForm />
      <p className="text-muted-foreground mt-6 text-center text-sm">
        Don&apos;t have an account?{" "}
        <a href="/login" className="text-primary font-medium hover:underline">
          Contact your admin
        </a>
      </p>
    </AuthShell>
  );
}
