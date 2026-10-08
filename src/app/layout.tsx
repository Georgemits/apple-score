import type * as React from "react";
import type { Metadata, Viewport } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { CommandPalette } from "@/components/command-palette";
import { Footer } from "@/components/footer";
import { Toaster } from "@/components/ui/sonner";
import type { NavUser } from "@/components/site-nav";
import { cn } from "@/lib/utils";
import "./globals.css";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const description =
  "Apple Score is the total you've spent on Apple hardware. Track your collection, climb the leaderboard and unlock achievements.";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Apple Score — How much Apple do you own?",
    template: "%s · Apple Score",
  },
  description,
  applicationName: "Apple Score",
  keywords: ["Apple", "collection", "leaderboard", "iPhone", "Mac", "score", "tracker"],
  openGraph: {
    title: "Apple Score",
    description,
    url: appUrl,
    siteName: "Apple Score",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Apple Score", description },
  // The Apple touch icon and Open Graph image are file-based routes
  // (src/app/apple-icon.tsx, src/app/opengraph-image.tsx) that Next wires up.
  icons: { icon: "/apple-score-mark.svg" },
  manifest: "/manifest.webmanifest",
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

async function loadNavUser(): Promise<NavUser> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { username: true, email: true, displayName: true, avatarEmoji: true, avatarHue: true },
  });

  // The session outlived the account; render as signed out.
  return user ?? null;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await loadNavUser();

  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={cn("page-wash flex min-h-dvh flex-col font-sans", user && "pb-tabbar")}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
          >
            Skip to content
          </a>
          <Navbar user={user} />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer signedIn={user !== null} />
          {user && <MobileTabBar />}
          {user && <CommandPalette />}
          {/* Keep toasts clear of the phone tab bar, which sits under them otherwise. */}
          <Toaster
            mobileOffset={user ? { bottom: "calc(5rem + env(safe-area-inset-bottom))" } : undefined}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
