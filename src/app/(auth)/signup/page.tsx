import type { Metadata } from "next";
import { Suspense } from "react";
import { SignupForm } from "@/components/auth/signup-form";
import { AuthFormSkeleton } from "@/components/auth/auth-form-skeleton";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Create an Apple Score account and start tracking your collection.",
};

export const dynamic = "force-dynamic";

export default function SignupPage() {
  // The form reads search params, so it must stream in under Suspense.
  return (
    <Suspense fallback={<AuthFormSkeleton fields={4} />}>
      <SignupForm />
    </Suspense>
  );
}
