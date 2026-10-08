import type * as React from "react";
import { AuthValuePanel } from "@/components/auth/value-panel";

/**
 * Two columns on large screens — the pitch on the left, the form on the
 * right. The form comes first in the DOM so keyboard and screen-reader users
 * reach it without wading through the pitch; on phones it is all they see.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container grid min-h-[calc(100dvh-4rem)] items-center gap-12 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-16">
      <div className="mx-auto w-full max-w-md">{children}</div>
      <AuthValuePanel className="hidden lg:order-first lg:block lg:w-full lg:max-w-lg lg:justify-self-center" />
    </div>
  );
}
