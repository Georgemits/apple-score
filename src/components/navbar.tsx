import { auth } from "@/auth";
import { SiteNav } from "@/components/site-nav";

export async function Navbar() {
  const session = await auth();
  const user = session?.user
    ? { username: session.user.username, email: session.user.email ?? "" }
    : null;

  return <SiteNav user={user} />;
}
