"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { changePasswordAction } from "@/actions/account";
import { changePasswordFormSchema, type ChangePasswordFormValues } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FieldError, describedBy } from "@/components/auth/field-error";
import { PasswordInput } from "@/components/auth/password-input";

const NETWORK_ERROR = "Could not reach the server. Please try again.";

const FIELDS = ["currentPassword", "newPassword", "confirmPassword"] as const;
type FieldName = (typeof FIELDS)[number];

function isFieldName(value: string): value is FieldName {
  return (FIELDS as readonly string[]).includes(value);
}

const EMPTY: ChangePasswordFormValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export function ChangePasswordForm() {
  const [isPending, startTransition] = React.useTransition();

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: EMPTY,
  });

  const busy = isPending || isSubmitting;

  const onSubmit = (values: ChangePasswordFormValues) => {
    startTransition(async () => {
      try {
        const result = await changePasswordAction(values);

        if (!result.ok) {
          let focused = false;
          for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
            const message = messages?.[0];
            if (!message || !isFieldName(field)) continue;
            setError(field, { message }, { shouldFocus: !focused });
            focused = true;
          }
          toast.error(result.error);
          return;
        }

        reset(EMPTY);
        toast.success("Password changed.", {
          description: "Your other devices stay signed in until their sessions expire.",
        });
      } catch (error) {
        console.error(error);
        toast.error(NETWORK_ERROR);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate aria-busy={busy} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password-current">Current password</Label>
        <PasswordInput
          id="password-current"
          autoComplete="current-password"
          aria-invalid={Boolean(errors.currentPassword)}
          aria-describedby={describedBy(errors.currentPassword && "password-current-error")}
          {...register("currentPassword")}
        />
        <FieldError id="password-current-error" message={errors.currentPassword?.message} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="password-new">New password</Label>
          <PasswordInput
            id="password-new"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.newPassword)}
            aria-describedby={describedBy(
              errors.newPassword ? "password-new-error" : "password-new-hint"
            )}
            {...register("newPassword")}
          />
          <FieldError id="password-new-error" message={errors.newPassword?.message} />
          {!errors.newPassword && (
            <p id="password-new-hint" className="text-xs text-muted-foreground">
              At least 8 characters. Not the old one.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password-confirm">Confirm new password</Label>
          <PasswordInput
            id="password-confirm"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={describedBy(errors.confirmPassword && "password-confirm-error")}
            {...register("confirmPassword")}
          />
          <FieldError id="password-confirm-error" message={errors.confirmPassword?.message} />
        </div>
      </div>

      <div className="flex sm:justify-end">
        <Button type="submit" variant="outline" disabled={busy} className="w-full sm:w-auto">
          {busy ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <KeyRound aria-hidden="true" />
          )}
          {busy ? "Updating…" : "Change password"}
        </Button>
      </div>
    </form>
  );
}
