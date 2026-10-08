"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { toggleFollowAction } from "@/actions/social";
import { celebrateUpdate } from "@/components/celebrations";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FollowButtonProps = {
  username: string;
  initialFollowing: boolean;
  className?: string;
  size?: "sm" | "default" | "lg";
};

export function FollowButton({
  username,
  initialFollowing,
  className,
  size = "sm",
}: FollowButtonProps) {
  const router = useRouter();
  const [following, setFollowing] = React.useState(initialFollowing);
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => setFollowing(initialFollowing), [initialFollowing]);

  const toggle = () => {
    const next = !following;
    setFollowing(next);
    startTransition(async () => {
      const result = await toggleFollowAction({ username });
      if (!result.ok) {
        setFollowing(!next);
        toast.error(result.error);
        return;
      }
      setFollowing(result.data.following);
      if (result.data.following) {
        toast.success(`Following @${username}.`, {
          description: "They now show up on your Following board.",
        });
      }
      celebrateUpdate({
        score: 0,
        productCount: 0,
        delta: 0,
        milestone: null,
        tier: null,
        unlocked: result.data.unlocked,
        rank: null,
      });
      router.refresh();
    });
  };

  return (
    <Button
      type="button"
      variant={following ? "outline" : "default"}
      size={size}
      onClick={toggle}
      disabled={isPending}
      aria-pressed={following}
      className={cn(className)}
    >
      {following ? <Check aria-hidden="true" /> : <UserPlus aria-hidden="true" />}
      {following ? "Following" : "Follow"}
    </Button>
  );
}
