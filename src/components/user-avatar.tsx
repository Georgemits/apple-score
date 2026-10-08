import { cn, hueFromString, initials } from "@/lib/utils";

type AvatarUser = {
  username: string;
  avatarEmoji?: string | null;
  avatarHue?: number | null;
};

type UserAvatarProps = {
  user: AvatarUser;
  /** Pixel size; also sets the font size. */
  size?: number;
  className?: string;
  /** Adds a subtle ring, used on podiums and profile heroes. */
  ring?: boolean;
};

/** The two gradient stops for a hue, used by both the avatar and share cards. */
export function avatarGradient(user: AvatarUser): { from: string; to: string; hue: number } {
  const hue = user.avatarHue ?? hueFromString(user.username);
  return {
    hue,
    from: `hsl(${hue} 85% 62%)`,
    to: `hsl(${(hue + 40) % 360} 80% 48%)`,
  };
}

/**
 * Generated avatar: a stable gradient from the user's chosen hue (or a hash of
 * the username) with either their emoji or their initials on top. No uploads,
 * no remote images, nothing to moderate.
 */
export function UserAvatar({ user, size = 40, className, ring = false }: UserAvatarProps) {
  const { from, to } = avatarGradient(user);
  const emoji = user.avatarEmoji ?? null;

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-semibold text-white",
        ring && "shadow-lg ring-4 ring-background",
        className
      )}
      style={{
        width: size,
        height: size,
        fontSize: emoji ? size * 0.5 : size * 0.38,
        backgroundImage: `linear-gradient(135deg, ${from}, ${to})`,
        textShadow: emoji ? undefined : "0 1px 1px rgba(0,0,0,0.15)",
      }}
      aria-hidden="true"
    >
      {emoji ? <span className="leading-none">{emoji}</span> : initials(user.username)}
    </span>
  );
}
