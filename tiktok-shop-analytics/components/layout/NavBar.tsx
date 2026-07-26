import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/auth/LogoutButton";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/import", label: "Import" },
];

export async function NavBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-neutral-200">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="font-semibold text-neutral-900">
          TikTok Shop Analytics
        </Link>
        <nav className="flex items-center gap-6">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-neutral-600 hover:text-neutral-900"
            >
              {link.label}
            </Link>
          ))}
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-neutral-500">{user.email}</span>
              <LogoutButton />
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
