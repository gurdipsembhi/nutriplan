import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  preferences: { units: "metric" | "imperial" };
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  units: "metric" | "imperial";
  loading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  updateUnits: (units: "metric" | "imperial") => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "nutriplan_token";
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<AuthUser | null>(null);
  const [token,   setToken]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount: hydrate from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) { setLoading(false); return; }

    fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${stored}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(({ user: me }: { user: AuthUser }) => {
        setToken(stored);
        setUser(me);
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
      })
      .finally(() => setLoading(false));
  }, []);

  function login(newToken: string, newUser: AuthUser) {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  async function updateUnits(units: "metric" | "imperial") {
    const t = token ?? localStorage.getItem(TOKEN_KEY);
    if (!t) return;
    const res = await fetch(`${BASE_URL}/api/auth/preferences`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ units }),
    });
    if (res.ok) {
      const { user: updated }: { user: AuthUser } = await res.json();
      setUser(updated);
    }
  }

  const units = user?.preferences.units ?? "metric";

  return (
    <AuthContext.Provider value={{ user, token, units, loading, login, logout, updateUnits }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
