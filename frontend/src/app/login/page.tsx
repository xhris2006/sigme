"use client";

import { LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@sigem.cm");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-ministry-navy px-4">
      <section className="w-full max-w-md rounded-md border border-white/10 bg-white p-6 shadow-panel">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-ministry-navy text-ministry-gold">
            <LockKeyhole size={22} />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-ministry-gold">SIGEM</p>
            <h1 className="text-xl font-bold text-ministry-navy">Connexion administrateur</h1>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {error ? <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Email</span>
            <input className="focus-ring mt-1 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Mot de passe</span>
            <input className="focus-ring mt-1 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <button disabled={loading} className="focus-ring w-full rounded-md bg-ministry-gold px-4 py-3 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-60">
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
        <p className="mt-4 text-xs text-slate-500">Compte de demonstration: admin@sigem.cm / password123</p>
      </section>
    </main>
  );
}
