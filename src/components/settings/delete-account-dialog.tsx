"use client";

import * as React from "react";
import { Loader2, Trash2 } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/auth/password-input";

export function DeleteAccountDialog({ username }: { username: string }) {
  const [open, setOpen] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [confirmation, setConfirmation] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const ready = password.length > 0 && confirmation === "DELETE";

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!ready) return;
    setError(null);
    startTransition(async () => {
      // On success the action signs out and redirects, so this only resolves on failure.
      const result = await deleteAccountAction({ password, confirmation });
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        <Trash2 aria-hidden="true" />
        Delete account
      </Button>
      <AlertDialogContent>
        <form onSubmit={submit} className="space-y-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete @{username}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes your account, your collection, your achievements and your
              follows. There is no undo, and no, we will not remember your Apple Score for you.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {error && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="delete-password">Your password</Label>
            <PasswordInput
              id="delete-password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="delete-confirm">
              Type <span className="font-mono font-semibold">DELETE</span> to confirm
            </Label>
            <Input
              id="delete-confirm"
              autoComplete="off"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel type="button">Keep my account</AlertDialogCancel>
            <Button type="submit" variant="destructive" disabled={!ready || isPending}>
              {isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Trash2 aria-hidden="true" />}
              {isPending ? "Deleting…" : "Delete everything"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
