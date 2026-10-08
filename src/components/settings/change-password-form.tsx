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
import { FieldError } from "@/components/auth/field-error";
import { PasswordInput } from "@/components/auth/password-input";

export function ChangePasswordForm() {
  const [isPending, startTransition] = React.useTransition();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = (values: ChangePasswordFormValues) => {
    startTransition(async () => {
      const result = await changePasswordAction(values);
      if (!result.ok) {
        toast.error(result.error);
        for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
          const message = messages?.[0];
          if (!message) continue;
          if (field === "currentPassword" || field === "newPassword" || field === "confirmPassword") {
            setError(field, { message });
          }
        }
        return;
      }
      toast.success("Password changed.");
      reset();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current password</Label>
        <PasswordInput
          id="currentPassword"
          autoComplete="current-password"
          aria-invalid={Boolean(errors.currentPassword)}
          aria-describedby={errors.currentPassword ? "currentPassword-error" : undefined}
          {...register("currentPassword")}
        />
        <FieldError id="currentPassword-error" message={errors.currentPassword?.message} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="newPassword">New password</Label>
          <PasswordInput
            id="newPassword"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.newPassword)}
            aria-describedby={errors.newPassword ? "newPassword-error" : "newPassword-hint"}
            {...register("newPassword")}
          />
          <FieldError id="newPassword-error" message={errors.newPassword?.message} />
          {!errors.newPassword && (
            <p id="newPassword-hint" className="text-xs text-muted-foreground">
              At least 8 characters.
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmNewPassword">Confirm new password</Label>
          <PasswordInput
            id="confirmNewPassword"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={errors.confirmPassword ? "confirmNewPassword-error" : undefined}
            {...register("confirmPassword")}
          />
          <FieldError id="confirmNewPassword-error" message={errors.confirmPassword?.message} />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" variant="outline" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <KeyRound aria-hidden="true" />}
          {isPending ? "Updating…" : "Change password"}
        </Button>
      </div>
    </form>
  );
}
