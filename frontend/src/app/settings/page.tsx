"use client";

import { Bell, Download, Save, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

type SettingsPreferences = {
  emailNotifications: boolean;
  pushNotifications: boolean;
  autoRefresh: boolean;
  compactView: boolean;
};

const defaultPreferences: SettingsPreferences = {
  emailNotifications: true,
  pushNotifications: true,
  autoRefresh: true,
  compactView: false
};

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<SettingsPreferences>(defaultPreferences);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("sigem_settings");
    if (!raw) return;
    try {
      setPrefs({ ...defaultPreferences, ...JSON.parse(raw) });
    } catch {
      setPrefs(defaultPreferences);
    }
  }, []);

  const savePreferences = () => {
    if (typeof window !== "undefined") window.localStorage.setItem("sigem_settings", JSON.stringify(prefs));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const handleTestNotification = () => {
    const notifications = JSON.parse(window.localStorage.getItem("sigem_notifications") ?? "[]");
    const next = [{
      id: `test-${Date.now()}`,
      title: "Test de notification",
      message: "Les préférences de notification sont bien enregistrées.",
      time: "À l’instant",
      unread: true
    }, ...notifications].slice(0, 6);
    window.localStorage.setItem("sigem_notifications", JSON.stringify(next));
    window.dispatchEvent(new Event("sigem:notify"));
  };

  const exportPreferences = () => {
    const blob = new Blob([JSON.stringify({ prefs, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sigem-settings.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-panel">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-ministry-blue">Paramètres</p>
            <h2 className="mt-2 text-2xl font-extrabold text-ministry-navy">Gérez vos préférences et notifications</h2>
          </div>
          <button onClick={savePreferences} className="flex items-center gap-2 rounded-xl bg-ministry-blue px-4 py-2.5 text-sm font-semibold text-white shadow-lg">
            <Save size={16} /> {saved ? "Enregistré" : "Enregistrer"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-panel">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-100 text-amber-600">
                <Bell size={20} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-ministry-navy">Préférences de notifications</h3>
                <p className="text-sm text-slate-500">Choisissez ce que vous souhaitez recevoir.</p>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { key: "emailNotifications", label: "Notifications par email", description: "Recevoir les alertes importantes par e-mail" },
                { key: "pushNotifications", label: "Notifications instantanées", description: "Afficher les rappels dans l’interface" },
                { key: "autoRefresh", label: "Actualisation automatique", description: "Recharger les tableaux de bord automatiquement" },
                { key: "compactView", label: "Affichage compact", description: "Réduire l’espacement des cartes" }
              ].map((item) => (
                <label key={item.key} className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 p-4">
                  <div>
                    <p className="font-semibold text-ministry-navy">{item.label}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                  </div>
                  <input type="checkbox" checked={prefs[item.key as keyof SettingsPreferences]} onChange={() => setPrefs((current) => ({ ...current, [item.key]: !current[item.key as keyof SettingsPreferences] }))} className="mt-1 h-5 w-5 rounded border-slate-300 text-ministry-blue focus:ring-ministry-blue" />
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-panel">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-green-100 text-green-600">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-ministry-navy">Sécurité et accès</h3>
                <p className="text-sm text-slate-500">Contrôlez votre environnement d’utilisation.</p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              La session reste active jusqu’à ce que vous vous déconnectiez. Les préférences sont sauvegardées localement dans votre navigateur.
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-panel">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-100 text-ministry-blue">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-ministry-navy">Actions rapides</h3>
                <p className="text-sm text-slate-500">Testez les fonctions principales.</p>
              </div>
            </div>
            <div className="space-y-3">
              <button onClick={handleTestNotification} className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-ministry-navy hover:bg-slate-50">
                <span>Tester une notification</span>
                <Bell size={16} />
              </button>
              <button onClick={exportPreferences} className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-ministry-navy hover:bg-slate-50">
                <span>Exporter les paramètres</span>
                <Download size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
