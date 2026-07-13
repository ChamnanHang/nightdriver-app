import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getDriverMe, getMe } from "../api/client";
import type { Driver, Role, User } from "../types";

interface AuthState {
  token: string | null;
  role: Role | null;
  user: User | null;
  driver: Driver | null;
  loading: boolean;
  login: (token: string, role: Role) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [role, setRole] = useState<Role | null>(localStorage.getItem("role") as Role | null);
  const [user, setUser] = useState<User | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (r: Role) => {
    try {
      if (r === "customer") {
        const res = await getMe();
        setUser(res.data);
      } else {
        const res = await getDriverMe();
        setDriver(res.data);
      }
    } catch {
      // token invalid
      localStorage.clear();
      setToken(null);
      setRole(null);
    }
  }, []);

  useEffect(() => {
    if (token && role) {
      fetchProfile(role).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (t: string, r: Role) => {
    localStorage.setItem("token", t);
    localStorage.setItem("role", r);
    setToken(t);
    setRole(r);
    await fetchProfile(r);
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setRole(null);
    setUser(null);
    setDriver(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ token, role, user, driver, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
