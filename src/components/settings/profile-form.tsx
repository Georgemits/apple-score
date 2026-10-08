"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { updateProfileAction } from "@/actions/account";
import {
  AVATAR_HUES,
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
import { UserAvatar, avatarGradient } from "@/components/user-avatar";
import { FieldError } from "@/components/auth/field-error";
import { EmojiPicker } from "@/components/settings/emoji-picker";

type ProfileFormProps = {
  user: {
    username: string;
    displayName: string | null;
    bio: string | null;
    avatarEmoji: string | null;
    avatarHue: number | null;
    isPublic: boolean;
  };
};

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setError,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: user.displayName ?? "",
      bio: user.bio ?? "",
      avatarEmoji: user.avatarEmoji ?? "",
      avatarHue: user.avatarHue,
      isPublic: user.isPublic,
    },
  });

  const draft = watch();
  const bioLength = draft.bio?.length ?? 0;

  const onSubmit = (values: ProfileFormValues) => {
    startTransition(async () => {
      const result = await updateProfileAction(values);
      if (!result.ok) {
        toast.error(result.error);
        for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
          const message = messages?.[0];
          if (!message) continue;
          if (field === "displayName" || field === "bio" || field === "avatarEmoji" || field === "avatarHue") {
            setError(field, { message });
          }
        }
        return;
      }
      toast.success("Profile saved.");
      reset(values);
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <div className="flex items-center gap-5">
        <UserAvatar
          user={{
            username: user.username,
            avatarEmoji: draft.avatarEmoji || null,
            avatarHue: draft.avatarHue,
          }}
          size={80}
          ring
        />
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{draft.displayName || `@${user.username}`}</p>
          <p className="truncate text-sm text-muted-foreground">
            {draft.displayName ? `@${user.username}` : "Add a display name below"}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          maxLength={MAX_DISPLAY_NAME}
          placeholder="Tim"
          aria-invalid={Boolean(errors.displayName)}
          aria-describedby={errors.displayName ? "displayName-error" : "displayName-hint"}
          {...register("displayName")}
        />
        <FieldError id="displayName-error" message={errors.displayName?.message} />
        {!errors.displayName && (
          <p id="displayName-hint" className="text-xs text-muted-foreground">
            Shown next to your handle. Leave blank to use @{user.username}.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <Label htmlFor="bio">Bio</Label>
          <span
            className={cn("tabular text-xs", bioLength > MAX_BIO ? "text-destructive" : "text-muted-foreground")}
            aria-live="polite"
          >
            {bioLength}/{MAX_BIO}
          </span>
        </div>
        <textarea
          id="bio"
          rows={3}
          maxLength={MAX_BIO + 20}
          placeholder="Three MacBooks and no regrets."
          aria-invalid={Boolean(errors.bio)}
          aria-describedby={errors.bio ? "bio-error" : undefined}
          className="flex w-full resize-none rounded-lg border border-input bg-background/60 px-4 py-2.5 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 md:text-sm"
          {...register("bio")}
        />
        <FieldError id="bio-error" message={errors.bio?.message} />
      </div>

      <div className="space-y-3">
        <Label>Avatar</Label>
        <Controller
          control={control}
          name="avatarEmoji"
          render={({ field }) => <EmojiPicker value={field.value} onChange={field.onChange} />}
        />
        <FieldError id="avatarEmoji-error" message={errors.avatarEmoji?.message} />
      </div>

      <div className="space-y-3">
        <Label>Colour</Label>
        <Controller
          control={control}
          name="avatarHue"
          render={({ field }) => (
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Avatar colour">
              <button
                type="button"
                onClick={() => field.onChange(null)}
                aria-pressed={field.value === null}
                className={cn(
                  "h-10 rounded-full border px-3 text-xs font-medium transition-colors",
                  field.value === null
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background/60 text-muted-foreground hover:text-foreground"
                )}
              >
                Auto
              </button>
              {AVATAR_HUES.map((hue) => {
                const gradient = avatarGradient({ username: user.username, avatarHue: hue });
                return (
                  <button
                    key={hue}
                    type="button"
                    onClick={() => field.onChange(hue)}
                    aria-pressed={field.value === hue}
                    aria-label={`Hue ${hue}`}
                    className={cn(
                      "size-10 rounded-full border-2 transition-transform hover:scale-110",
                      field.value === hue ? "border-foreground ring-2 ring-accent/50" : "border-transparent"
                    )}
                    style={{ backgroundImage: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
                  />
                );
              })}
            </div>
          )}
        />
      </div>

      <div className="flex items-start justify-between gap-4 rounded-xl border border-border/70 bg-background/40 p-4">
        <div className="space-y-1">
          <Label htmlFor="isPublic">Public profile</Label>
          <p className="text-xs text-muted-foreground">
            Public profiles appear on Band for Band and at /u/{user.username}. Private profiles
            are hidden from everyone but you.
          </p>
        </div>
        <Controller
          control={control}
          name="isPublic"
          render={({ field }) => (
            <Switch id="isPublic" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending || !isDirty}>
          {isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Save aria-hidden="true" />}
          {isPending ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </form>
  );
}
