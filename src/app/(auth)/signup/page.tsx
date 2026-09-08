import type { Metadata } from "next";
import { Suspense } from "react";
import { SignupForm } from "@/components/auth/signup-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create an Apple Score account and start tracking your collection.",
};

export default function SignupPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[34rem] w-full rounded-xl" />}>
      <SignupForm />
    </Suspense>
  );
}
