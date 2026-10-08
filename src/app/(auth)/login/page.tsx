import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { AuthFormSkeleton } from "@/components/auth/auth-form-skeleton";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your Apple Score account.",
};

export const dynamic = "force-dynamic";

export default function LoginPage() {
  // The form reads search params, so it must stream in under Suspense.
  return (
    <Suspense fallback={<AuthFormSkeleton fields={2} />}>
      <LoginForm />
    </Suspense>
  );
}
