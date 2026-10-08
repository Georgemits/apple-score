import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate, formatRelative } from "@/lib/utils";

type AccountDetailsProps = {
  email: string;
  username: string;
  createdAt: Date;
};

/** The read-only facts about the account: email, handle, and when it started. */
export function AccountDetails({ email, username, createdAt }: AccountDetailsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="account-email">Email</Label>
        <Input
          id="account-email"
          type="email"
          value={email}
          readOnly
          aria-describedby="account-email-note"
          className="bg-secondary/60"
        />
        <p id="account-email-note" className="text-xs text-muted-foreground">
          Used to sign in. Never shown on your profile.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="account-username">Username</Label>
        <Input
          id="account-username"
          value={`@${username}`}
          readOnly
          aria-describedby="account-username-note"
          className="bg-secondary/60"
        />
        <p id="account-username-note" className="text-xs text-muted-foreground">
          Usernames are permanent — they&apos;re your public URL.
        </p>
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="account-since">Member since</Label>
        <Input
          id="account-since"
          value={formatDate(createdAt)}
          readOnly
          aria-describedby="account-since-note"
          className="bg-secondary/60 sm:max-w-xs"
        />
        <p id="account-since-note" className="text-xs text-muted-foreground">
          Joined {formatRelative(createdAt)}. Your wallet remembers it well.
        </p>
      </div>
    </div>
  );
}
