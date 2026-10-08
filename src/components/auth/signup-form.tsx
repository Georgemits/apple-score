"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { signupAction } from "@/actions/auth";
import { signupFormSchema, type SignupFormValues } from "@/lib/validations";
import { safeCallbackUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError, describedBy } from "@/components/auth/field-error";
import { PasswordInput } from "@/components/auth/password-input";

const NETWORK_ERROR = "Network error. Please try again.";

const FIELDS = ["username", "email", "password", "confirmPassword"] as const;
type Field = (typeof FIELDS)[number];

function isField(value: string): value is Field {
  return (FIELDS as readonly string[]).includes(value);
}

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get("callbackUrl");
  // New accounts always go through the welcome flow: it is the fastest way to a
  // score, and the page they came from is one tap away afterwards. The
  // callback is only kept for the "already have an account" link.
  const destination = "/welcome";
  const loginHref = rawCallback
    ? `/login?callbackUrl=${encodeURIComponent(safeCallbackUrl(rawCallback))}`
    : "/login";

  const [formError, setFormError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: { username: "", email: "", password: "", confirmPassword: "" },
  });

  const usernamePreview = watch("username").trim().toLowerCase() || "yourname";

  const onSubmit = (values: SignupFormValues) => {
    setFormError(null);

    startTransition(async () => {
      try {
        const result = await signupAction(values);

        if (!result.ok) {
          setFormError(result.error);
          toast.error(result.error);

          for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
            const message = messages?.[0];
            if (message && isField(field)) setError(field, { message });
          }
          return;
        }

        toast.success("Welcome to Apple Score.");
        router.replace(destination);
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
        <CardTitle className="text-2xl tracking-tight">Create your account</CardTitle>
        <CardDescription>Start scoring your Apple collection in under a minute.</CardDescription>
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
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="tim"
              aria-invalid={Boolean(errors.username)}
              aria-describedby={describedBy(errors.username && "username-error", "username-hint")}
              {...register("username")}
            />
            <FieldError id="username-error" message={errors.username?.message} />
            <p id="username-hint" className="text-pretty text-xs text-muted-foreground">
              Your public page will be{" "}
              <span className="break-all font-medium text-foreground">/u/{usernamePreview}</span>.
              3–20 letters, numbers or underscores — and it can’t be changed later.
            </p>
          </div>

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
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={describedBy(errors.password && "password-error", "password-hint")}
              {...register("password")}
            />
            <FieldError id="password-error" message={errors.password?.message} />
            <p id="password-hint" className="text-xs text-muted-foreground">
              At least 8 characters.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <PasswordInput
              id="confirmPassword"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={describedBy(errors.confirmPassword && "confirm-error")}
              {...register("confirmPassword")}
            />
            <FieldError id="confirm-error" message={errors.confirmPassword?.message} />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={busy}>
            {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
            {busy ? "Creating account…" : "Create account"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href={loginHref} className="font-medium text-accent hover:underline">
              Log in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
