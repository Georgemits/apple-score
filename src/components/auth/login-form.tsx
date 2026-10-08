"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { loginAction } from "@/actions/auth";
import { loginFormSchema, type LoginFormValues } from "@/lib/validations";
import { safeCallbackUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError, describedBy } from "@/components/auth/field-error";
import { PasswordInput } from "@/components/auth/password-input";

const NETWORK_ERROR = "Network error. Please try again.";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Same-origin paths only; anything else falls back to the dashboard.
  const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"));

  const [formError, setFormError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: LoginFormValues) => {
    setFormError(null);

    startTransition(async () => {
      try {
        const result = await loginAction(values);

        if (!result.ok) {
          setFormError(result.error);
          toast.error(result.error);
          return;
        }

        toast.success("Welcome back.");
        router.replace(callbackUrl);
        router.refresh();
      } catch (error) {
        console.error(error);
        setFormError(NETWORK_ERROR);
        toast.error(NETWORK_ERROR);
      }
    });
  };

  const busy = isPending || isSubmitting;

  return (
    <Card className="animate-enter-up">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl tracking-tight">Welcome back</CardTitle>
        <CardDescription>Log in to keep your Apple Score climbing.</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate aria-busy={busy} className="space-y-5">
          {formError && (
            <div
              role="alert"
              className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {formError}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={describedBy(errors.email && "email-error")}
              {...register("email")}
            />
            <FieldError id="email-error" message={errors.email?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={describedBy(errors.password && "password-error")}
              {...register("password")}
            />
            <FieldError id="password-error" message={errors.password?.message} />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={busy}>
            {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
            {busy ? "Signing in…" : "Log in"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link href="/signup" className="font-medium text-accent hover:underline">
              Create an account
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
