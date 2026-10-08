"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Globe, Loader2, Lock, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { updateProfileAction } from "@/actions/account";
import { LEADERBOARD_NAME } from "@/lib/branding";
import {
  MAX_BIO,
  MAX_DISPLAY_NAME,
  profileFormSchema,
  type ProfileFormValues,
} from "@/lib/validations";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { UserAvatar } from "@/components/user-avatar";
import { FieldError, describedBy } from "@/components/auth/field-error";
import { EmojiPicker } from "@/components/settings/emoji-picker";
import { HuePicker } from "@/components/settings/hue-picker";

export type ProfileFormUser = {
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarEmoji: string | null;
  avatarHue: number | null;
  isPublic: boolean;
};

const NETWORK_ERROR = "Could not reach the server. Please try again.";

/** How close to the bio limit before the counter starts warning. */
const BIO_WARN_AT = 20;

const FIELDS = ["displayName", "bio", "avatarEmoji", "avatarHue", "isPublic"] as const;
type FieldName = (typeof FIELDS)[number];

function isFieldName(value: string): value is FieldName {
  return (FIELDS as readonly string[]).includes(value);
}

function toFormValues(user: ProfileFormUser): ProfileFormValues {
  return {
    displayName: user.displayName ?? "",
    bio: user.bio ?? "",
    avatarEmoji: user.avatarEmoji ?? "",
    avatarHue: user.avatarHue,
    isPublic: user.isPublic,
  };
}

export function ProfileForm({ user }: { user: ProfileFormUser }) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setError,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: toFormValues(user),
  });

  const draft = watch();
  const bioLength = draft.bio.length;
  const bioRemaining = MAX_BIO - bioLength;
  const busy = isPending || isSubmitting;

  const onSubmit = (values: ProfileFormValues) => {
    startTransition(async () => {
      try {
        const result = await updateProfileAction(values);

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

        // The saved values become the new baseline, so the form is clean again.
        reset(values);
        toast.success("Profile saved.", {
          description: values.isPublic
            ? `Looking sharp on ${LEADERBOARD_NAME}.`
            : "Only you can see it. Mysterious.",
        });
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error(NETWORK_ERROR);
      }
    });
  };

  const previewName = draft.displayName.trim() || `@${user.username}`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate aria-busy={busy} className="space-y-7">
      {/* ------------------------------------------------------- Live preview */}
      <div className="flex items-center gap-4 rounded-xl border border-border/70 bg-background/40 p-4 sm:gap-5">
        <UserAvatar
          user={{
            username: user.username,
            avatarEmoji: draft.avatarEmoji || null,
            avatarHue: draft.avatarHue,
          }}
          size={80}
          ring
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold tracking-tight">{previewName}</p>
          <p className="truncate text-sm text-muted-foreground">
            {draft.displayName.trim() ? `@${user.username}` : "Add a display name below"}
          </p>
          <span
            className={cn(
              "mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
              draft.isPublic ? "bg-success/12 text-success" : "bg-secondary text-muted-foreground"
            )}
          >
            {draft.isPublic ? (
              <Globe className="size-3" aria-hidden="true" />
            ) : (
              <Lock className="size-3" aria-hidden="true" />
            )}
            {draft.isPublic ? "Public" : "Private"}
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------- Display name */}
      <div className="space-y-2">
        <Label htmlFor="profile-displayName">Display name</Label>
        <Input
          id="profile-displayName"
          autoComplete="nickname"
          maxLength={MAX_DISPLAY_NAME}
          placeholder="Tim"
          aria-invalid={Boolean(errors.displayName)}
          aria-describedby={describedBy(
            errors.displayName ? "profile-displayName-error" : "profile-displayName-hint"
          )}
          defaultValue={user.displayName ?? ""}
          {...register("displayName")}
        />
        <FieldError id="profile-displayName-error" message={errors.displayName?.message} />
        {!errors.displayName && (
          <p id="profile-displayName-hint" className="text-xs text-muted-foreground">
            Shown next to your handle. Leave it blank to go by @{user.username}.
          </p>
        )}
      </div>

      {/* ---------------------------------------------------------------- Bio */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <Label htmlFor="profile-bio">Bio</Label>
          <span
            id="profile-bio-count"
            aria-hidden="true"
            className={cn(
              "tabular text-xs",
              bioRemaining <= 0
                ? "font-semibold text-destructive"
                : bioRemaining <= BIO_WARN_AT
                  ? "text-warning"
                  : "text-muted-foreground"
            )}
          >
            {bioLength}/{MAX_BIO}
          </span>
        </div>
        <textarea
          id="profile-bio"
          rows={3}
          maxLength={MAX_BIO}
          placeholder="Three MacBooks and no regrets."
          aria-invalid={Boolean(errors.bio)}
          aria-describedby={describedBy(
            errors.bio ? "profile-bio-error" : "profile-bio-hint",
            "profile-bio-live"
          )}
          className="flex min-h-24 w-full resize-y rounded-lg border border-input bg-background/60 px-4 py-2.5 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          defaultValue={user.bio ?? ""}
          {...register("bio")}
        />
        <FieldError id="profile-bio-error" message={errors.bio?.message} />
        {!errors.bio && (
          <p id="profile-bio-hint" className="text-xs text-muted-foreground">
            Up to {MAX_BIO} characters. Brag responsibly.
          </p>
        )}
        {/* Announced only near the limit, so typing is not narrated keystroke by keystroke. */}
        <p id="profile-bio-live" className="sr-only" aria-live="polite">
          {bioRemaining <= BIO_WARN_AT
            ? bioRemaining === 0
              ? "Bio is at the character limit."
              : `${bioRemaining} characters remaining.`
            : ""}
        </p>
      </div>

      {/* -------------------------------------------------------------- Avatar */}
      <div className="space-y-3">
        <div>
          <p id="profile-emoji-label" className="text-sm font-medium leading-none">
            Avatar
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Pick an emoji, or let your initials do the talking.
          </p>
        </div>
        <Controller
          control={control}
          name="avatarEmoji"
          render={({ field }) => (
            <EmojiPicker
              value={field.value}
              onChange={field.onChange}
              labelledBy="profile-emoji-label"
              disabled={busy}
            />
          )}
        />
        <FieldError id="profile-avatarEmoji-error" message={errors.avatarEmoji?.message} />
      </div>

      {/* -------------------------------------------------------------- Colour */}
      <div className="space-y-3">
        <div>
          <p id="profile-hue-label" className="text-sm font-medium leading-none">
            Colour
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            The gradient behind your avatar. Auto picks one from your username.
          </p>
        </div>
        <Controller
          control={control}
          name="avatarHue"
          render={({ field }) => (
            <HuePicker
              value={field.value}
              onChange={field.onChange}
              username={user.username}
              labelledBy="profile-hue-label"
              disabled={busy}
            />
          )}
        />
        <FieldError id="profile-avatarHue-error" message={errors.avatarHue?.message} />
      </div>

      {/* ------------------------------------------------------------- Privacy */}
      <div className="flex items-start justify-between gap-4 rounded-xl border border-border/70 bg-background/40 p-4">
        <div className="min-w-0 space-y-1.5">
          <Label htmlFor="profile-isPublic" className="flex items-center gap-2">
            {draft.isPublic ? (
              <Globe className="size-4 text-muted-foreground" aria-hidden="true" />
            ) : (
              <Lock className="size-4 text-muted-foreground" aria-hidden="true" />
            )}
            Public profile
          </Label>
          <p id="profile-isPublic-help" className="text-pretty text-xs text-muted-foreground">
            Public profiles appear on {LEADERBOARD_NAME} and at /u/{user.username}. Private profiles
            are hidden from everyone but you.
          </p>
        </div>
        <Controller
          control={control}
          name="isPublic"
          render={({ field }) => (
            <Switch
              id="profile-isPublic"
              checked={field.value}
              onCheckedChange={field.onChange}
              aria-describedby="profile-isPublic-help"
              disabled={busy}
              className="mt-0.5"
            />
          )}
        />
      </div>

      {/* -------------------------------------------------------------- Footer */}
      <div className="flex flex-col-reverse gap-3 border-t border-border/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {isDirty ? "You have unsaved changes." : "Everything is saved."}
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          {/* Always mounted: unmounting on click would drop keyboard focus. */}
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              if (isDirty && !busy) reset();
            }}
            aria-disabled={!isDirty || busy || undefined}
            className="w-full aria-disabled:pointer-events-none aria-disabled:opacity-50 sm:w-auto"
          >
            <RotateCcw aria-hidden="true" />
            Discard
          </Button>
          <Button type="submit" disabled={busy} className="w-full sm:w-auto">
            {busy ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <Save aria-hidden="true" />
            )}
            {busy ? "Saving…" : "Save profile"}
          </Button>
        </div>
      </div>
    </form>
  );
}
