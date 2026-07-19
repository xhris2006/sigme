"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Building2, ClipboardCheck, LayoutDashboard, LogOut, MapPin, Menu, ScrollText, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";

const nav = [
  { href: "/dashboard", label: "Tableau", icon: LayoutDashboard },
  { href: "/enterprises", label: "Entreprises", icon: Building2 },
  { href: "/sites", label: "Sites", icon: MapPin },
  { href: "/permits", label: "Permis", icon: ScrollText },
  { href: "/inspections", label: "Inspections", icon: ClipboardCheck }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { token, loading, user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const isLogin = pathname === "/login";

  useEffect(() => {
    if (!loading && !token && !isLogin) router.replace("/login");
    if (!loading && token && isLogin) router.replace("/dashboard");
  }, [isLogin, loading, router, token]);

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-ministry-pale text-sm text-slate-600">Chargement...</div>;
  }

  if (isLogin) return <>{children}</>;

  return (
    <div className="min-h-screen bg-ministry-pale">
      <aside className="fixed left-0 top-0 z-30 hidden h-full w-72 border-r border-slate-200 bg-ministry-navy text-white lg:block">
        <ShellNav pathname={pathname} user={user?.name} logout={logout} />
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:ml-72 lg:px-8">
        <button className="focus-ring rounded-md p-2 text-ministry-navy lg:hidden" onClick={() => setOpen(true)} aria-label="Ouvrir la navigation">
          <Menu size={22} />
        </button>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ministry-gold">Ministere des Mines</p>
          <h1 className="text-lg font-bold text-ministry-navy">SIGEM</h1>
        </div>
        <button onClick={logout} className="focus-ring hidden items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:flex">
          <LogOut size={16} /> Sortir
        </button>
      </header>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/40" onClick={() => setOpen(false)} aria-label="Fermer" />
          <div className="relative h-full w-80 max-w-[86vw] bg-ministry-navy text-white">
            <button className="focus-ring absolute right-3 top-3 rounded-md p-2" onClick={() => setOpen(false)} aria-label="Fermer la navigation">
              <X size={20} />
            </button>
            <ShellNav pathname={pathname} user={user?.name} logout={logout} />
          </div>
        </div>
      ) : null}

      <main className="pb-24 lg:ml-72 lg:pb-10">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-20 grid grid-cols-5 border-t border-slate-200 bg-white lg:hidden">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-1 px-1 py-2 text-[11px] font-semibold ${active ? "text-ministry-gold" : "text-slate-500"}`}>
              <Icon size={19} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function ShellNav({ pathname, user, logout }: { pathname: string; user?: string; logout: () => void }) {
  return (
    <div className="flex h-full flex-col p-5">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-ministry-gold">SIGEM</p>
        <h2 className="text-2xl font-bold">Gestion Miniere</h2>
      </div>
      <div className="space-y-1">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-md px-3 py-3 text-sm font-semibold ${active ? "bg-white text-ministry-navy" : "text-slate-200 hover:bg-white/10"}`}>
              <Icon size={19} />
              {item.label}
            </Link>
          );
        })}
      </div>
      <div className="mt-auto border-t border-white/15 pt-4">
        <p className="mb-3 text-sm text-slate-300">{user ?? "Administrateur"}</p>
        <button onClick={logout} className="focus-ring flex w-full items-center gap-3 rounded-md px-3 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10">
          <LogOut size={18} /> Deconnexion
        </button>
      </div>
    </div>
  );
}
