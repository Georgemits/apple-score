"use client";

import * as React from "react";
import { Loader2, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { deleteAccountAction } from "@/actions/account";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError, describedBy } from "@/components/auth/field-error";
import { PasswordInput } from "@/components/auth/password-input";

const CONFIRM_WORD = "DELETE";
const NETWORK_ERROR = "Could not reach the server. Your account is still here.";

type Errors = { form?: string; password?: string; confirmation?: string };

export function DeleteAccountDialog({ username }: { username: string }) {
  const [open, setOpen] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [confirmation, setConfirmation] = React.useState("");
  const [errors, setErrors] = React.useState<Errors>({});
  const [isPending, startTransition] = React.useTransition();

  const confirmed = confirmation.trim() === CONFIRM_WORD;
  const ready = password.length > 0 && confirmed;

  const onOpenChange = (next: boolean) => {
    // Never let the dialog vanish mid-delete.
    if (isPending) return;
    setOpen(next);
    if (!next) {
      setPassword("");
      setConfirmation("");
      setErrors({});
    }
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!ready) {
      setErrors({
        password: password.length === 0 ? "Enter your password to confirm." : undefined,
        confirmation: confirmed ? undefined : `Type ${CONFIRM_WORD} to confirm.`,
      });
      return;
    }
    setErrors({});

    startTransition(async () => {
      try {
        // On success the action signs out and redirects, so a result only
        // ever comes back when something stopped the deletion.
        const result = await deleteAccountAction({
          password,
          confirmation: confirmation.trim(),
        });
        if (!result || result.ok) return;

        const fieldErrors = result.fieldErrors ?? {};
        setErrors({
          form: result.error,
          password: fieldErrors.password?.[0],
          confirmation: fieldErrors.confirmation?.[0],
        });
        toast.error(result.error);
      } catch (error) {
        // Auth.js signals its redirect by throwing; let Next handle that one.
        if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) throw error;
        console.error(error);
        setErrors({ form: NETWORK_ERROR });
        toast.error(NETWORK_ERROR);
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full sm:w-auto">
          <Trash2 aria-hidden="true" />
          Delete account
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <form onSubmit={submit} noValidate aria-busy={isPending} className="space-y-5">
          <AlertDialogHeader>
            <span
              className="flex size-10 items-center justify-center rounded-xl bg-destructive/12 text-destructive"
              aria-hidden="true"
            >
              <TriangleAlert className="size-5" />
            </span>
            <AlertDialogTitle className="tracking-tight">Delete @{username}?</AlertDialogTitle>
            <AlertDialogDescription className="text-pretty">
              This permanently removes your account, your collection, your achievements and your
              follows. Your Apple Score goes back to $0 — the hard way. There is no undo.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {errors.form && (
            <p
              role="alert"
              className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {errors.form}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="delete-password">Your password</Label>
            <PasswordInput
              id="delete-password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={describedBy(errors.password && "delete-password-error")}
              disabled={isPending}
            />
            <FieldError id="delete-password-error" message={errors.password} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="delete-confirm">
              Type <span className="font-mono font-semibold">{CONFIRM_WORD}</span> to confirm
            </Label>
            <Input
              id="delete-confirm"
              autoComplete="off"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              placeholder={CONFIRM_WORD}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              aria-invalid={Boolean(errors.confirmation)}
              aria-describedby={describedBy(errors.confirmation && "delete-confirm-error")}
              disabled={isPending}
              className="font-mono"
            />
            <FieldError id="delete-confirm-error" message={errors.confirmation} />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={isPending}>
              Keep my account
            </AlertDialogCancel>
            <Button type="submit" variant="destructive" disabled={!ready || isPending}>
              {isPending ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 aria-hidden="true" />
              )}
              {isPending ? "Deleting…" : "Delete everything"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
