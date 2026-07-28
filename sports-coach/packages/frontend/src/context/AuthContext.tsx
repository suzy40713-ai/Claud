import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { UserProfileDTO } from "@sports-coach/shared";
import { api } from "../lib/api";

interface AuthContextValue {
  user: UserProfileDTO | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfileDTO | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    try {
      const { user } = await api.me();
      setUser(user);
    } catch {
      setUser(null);
    }
  }

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const { user } = await api.login(email, password);
    setUser(user);
  }

  async function register(email: string, password: string) {
    const { user } = await api.register(email, password);
    setUser(user);
  }

  async function logout() {
    await api.logout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit etre utilise dans un AuthProvider");
  return ctx;
}
