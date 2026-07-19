"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Building2, ChevronDown, ClipboardCheck, Gem, LayoutDashboard, LogOut, MapPin, Menu, ScrollText, Search, Settings, UserCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
};

const defaultNotifications: NotificationItem[] = [
  { id: "n1", title: "Rapport disponible", message: "Le rapport mensuel de conformité a été généré.", time: "Il y a 10 min", unread: true },
  { id: "n2", title: "Inspection à venir", message: "2 inspections sont prévues aujourd’hui sur le site de Kribi.", time: "Il y a 1 h", unread: true },
  { id: "n3", title: "Mise à jour du système", message: "Les paramètres de notification ont été synchronisés.", time: "Hier", unread: false }
];

function readNotifications() {
  if (typeof window === "undefined") return defaultNotifications;
  const raw = window.localStorage.getItem("sigem_notifications");
  if (!raw) return defaultNotifications;
  try {
    return JSON.parse(raw) as NotificationItem[];
  } catch {
    return defaultNotifications;
  }
}

const nav = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/enterprises", label: "Entreprises", icon: Building2 },
  { href: "/sites", label: "Sites miniers", icon: MapPin },
  { href: "/permits", label: "Permis", icon: ScrollText },
  { href: "/inspections", label: "Inspections", icon: ClipboardCheck }
];

const titles: Record<string, string> = {
  dashboard: "Tableau de bord",
  enterprises: "Entreprises",
  sites: "Sites miniers",
  permits: "Permis",
  inspections: "Inspections",
  settings: "Paramètres"
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { token, loading, user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const isLogin = pathname === "/login";

  useEffect(() => {
    if (!loading && !token && !isLogin) router.replace("/login");
    if (!loading && token && isLogin) router.replace("/dashboard");
  }, [isLogin, loading, router, token]);

  useEffect(() => {
    setNotifications(readNotifications());
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem("sigem_notifications", JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    const handleNotify = () => {
      const next = readNotifications();
      setNotifications(next);
    };
    window.addEventListener("sigem:notify", handleNotify);
    return () => window.removeEventListener("sigem:notify", handleNotify);
  }, []);

  const unreadCount = notifications.filter((item) => item.unread).length;

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-ministry-pale text-sm text-slate-600">Chargement...</div>;
  }

  if (isLogin) return <>{children}</>;

  return (
    <div className="min-h-screen bg-ministry-pale">
      <aside className="fixed left-0 top-0 z-30 hidden h-full w-72 bg-[linear-gradient(180deg,#061b3a_0%,#08264d_56%,#061832_100%)] text-white lg:block">
        <ShellNav pathname={pathname} user={user?.name} logout={logout} />
      </aside>

      <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200/70 bg-white/90 px-4 backdrop-blur-xl lg:ml-72 lg:px-8">
        <div className="flex items-center gap-5">
          <button className="focus-ring rounded-md p-2 text-ministry-navy" onClick={() => setOpen(true)} aria-label="Ouvrir la navigation">
            <Menu size={23} />
          </button>
          <h1 className="hidden text-xl font-extrabold text-ministry-navy sm:block">{currentTitle(pathname)}</h1>
        </div>
        <div className="flex flex-1 items-center justify-end gap-3 md:gap-5">
          <label className="relative hidden w-full max-w-xs md:block">
            <Search className="pointer-events-none absolute right-4 top-3.5 text-slate-500" size={18} />
            <input className="focus-ring h-12 w-full rounded-xl border border-slate-100 bg-slate-50/90 px-4 pr-11 text-sm text-slate-700 shadow-sm" placeholder="Rechercher..." />
          </label>
          <div className="relative">
            <button className="focus-ring relative rounded-xl p-2.5 text-ministry-navy hover:bg-slate-100" aria-label="Notifications" onClick={() => setShowNotifications((value) => !value)}>
              <Bell size={21} />
              {unreadCount > 0 ? <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-ministry-blue text-[10px] font-bold text-white">{unreadCount}</span> : null}
            </button>
            {showNotifications ? (
              <div className="absolute right-0 top-14 z-50 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-extrabold text-ministry-navy">Notifications</p>
                    <p className="text-xs text-slate-500">{unreadCount} non lues</p>
                  </div>
                  <button className="text-xs font-semibold text-ministry-blue" onClick={() => setNotifications((items) => items.map((item) => ({ ...item, unread: false })))}>
                    Tout marquer lu
                  </button>
                </div>
                <div className="space-y-2">
                  {notifications.length === 0 ? (
                    <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">Aucune notification pour le moment.</div>
                  ) : notifications.map((item) => (
                    <button key={item.id} className="w-full rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-left" onClick={() => setNotifications((items) => items.map((entry) => entry.id === item.id ? { ...entry, unread: false } : entry))}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-ministry-navy">{item.title}</p>
                          <p className="mt-1 text-xs text-slate-600">{item.message}</p>
                        </div>
                        {item.unread ? <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-ministry-blue" /> : null}
                      </div>
                      <p className="mt-2 text-[11px] text-slate-400">{item.time}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <div className="hidden h-8 w-px bg-slate-200 sm:block" />
          <div className="hidden items-center gap-3 sm:flex">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-slate-200 text-slate-500">
              <UserCircle size={28} />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-extrabold text-ministry-navy">{user?.name?.split(" ")[0] ?? "Admin"}</p>
              <p className="text-xs text-slate-500">Administrateur</p>
            </div>
            <ChevronDown size={17} className="text-ministry-navy" />
          </div>
        </div>
      </header>

      {false ? (
        <button className="focus-ring rounded-md p-2 text-ministry-navy lg:hidden" onClick={() => setOpen(true)} aria-label="Ouvrir la navigation">
          <Menu size={22} />
        </button>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/40" onClick={() => setOpen(false)} aria-label="Fermer" />
          <div className="relative h-full w-80 max-w-[86vw] bg-[linear-gradient(180deg,#061b3a_0%,#08264d_56%,#061832_100%)] text-white">
            <button className="focus-ring absolute right-3 top-3 rounded-md p-2" onClick={() => setOpen(false)} aria-label="Fermer la navigation">
              <X size={20} />
            </button>
            <ShellNav pathname={pathname} user={user?.name} logout={logout} />
          </div>
        </div>
      ) : null}

      <main className="pb-24 lg:ml-72 lg:pb-10">
        <div className="mx-auto max-w-[1380px] px-4 py-7 sm:px-6 lg:px-8">{children}</div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-20 grid grid-cols-5 border-t border-slate-200 bg-white/95 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-1 px-1 py-2 text-[11px] font-semibold ${active ? "text-ministry-blue" : "text-slate-500"}`}>
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
    <div className="flex h-full flex-col p-4">
      <div className="mb-8 flex items-center gap-3 px-2 pt-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl text-ministry-gold">
          <Gem size={36} strokeWidth={1.8} />
        </div>
        <div>
          <h2 className="text-3xl font-extrabold leading-none">SIGEM</h2>
          <p className="mt-1 text-[11px] font-medium text-white/85">Systeme de Gestion Miniere</p>
        </div>
      </div>
      <div className="space-y-2">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={`flex items-center gap-4 rounded-xl px-4 py-3.5 text-[15px] font-semibold transition ${active ? "bg-ministry-blue text-white shadow-[0_12px_30px_rgba(37,99,235,0.35)]" : "text-white/88 hover:bg-white/10"}`}>
              <Icon size={20} strokeWidth={2.1} />
              {item.label}
            </Link>
          );
        })}
        <div className="pt-2">
          <Link href="/settings" className={`flex items-center gap-4 rounded-xl px-4 py-3.5 text-[15px] font-semibold transition ${pathname.startsWith("/settings") ? "bg-ministry-blue text-white shadow-[0_12px_30px_rgba(37,99,235,0.35)]" : "text-white/88 hover:bg-white/10"}`}>
            <Settings size={20} /> Paramètres
          </Link>
        </div>
      </div>
      <div className="mt-auto rounded-xl border-t border-white/10 bg-white/5 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white">
            <UserCircle size={30} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold text-white">{user?.split(" ")[0] ?? "Admin"}</p>
            <p className="text-xs text-white/70">Administrateur</p>
          </div>
          <ChevronDown size={16} />
        </div>
        <button onClick={logout} className="focus-ring flex w-full items-center gap-3 rounded-md px-1 py-2 text-sm font-semibold text-white/75 hover:text-white">
          <LogOut size={18} /> Deconnexion
        </button>
      </div>
    </div>
  );
}

function currentTitle(pathname: string) {
  const segment = pathname.split("/").filter(Boolean)[0] ?? "dashboard";
  return titles[segment] ?? "SIGEM";
}
