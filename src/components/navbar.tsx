import { SiteNav, type NavUser } from "@/components/site-nav";

export function Navbar({ user }: { user: NavUser }) {
  return <SiteNav user={user} />;
}
