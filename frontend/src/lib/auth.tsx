"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "./api";

type User = { id: string; name: string; email: string };
type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("sigem_token");
    const storedUser = localStorage.getItem("sigem_user");
    if (storedToken) setToken(storedToken);
    if (storedUser) setUser(JSON.parse(storedUser));
    setLoading(false);
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    user,
    token,
    loading,
    async login(email, password) {
      const payload = await apiFetch<{ token: string; user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      localStorage.setItem("sigem_token", payload.token);
      localStorage.setItem("sigem_user", JSON.stringify(payload.user));
      setToken(payload.token);
      setUser(payload.user);
    },
    logout() {
      localStorage.removeItem("sigem_token");
      localStorage.removeItem("sigem_user");
      setToken(null);
      setUser(null);
      window.location.href = "/login";
    }
  }), [loading, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
