import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your Apple Score account.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[26rem] w-full rounded-xl" />}>
      <LoginForm />
    </Suspense>
  );
}
