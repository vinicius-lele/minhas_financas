import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "../services/api";

type AuthUser = {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
};

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("authUser");
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
      }
    }
    setLoading(false);
  }, []);

  const login = async (identifier: string, password: string) => {
    const res = await api<{ token: string; user: AuthUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    });
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem("authToken", res.token);
    localStorage.setItem("authUser", JSON.stringify(res.user));
  };

  const register = async (username: string, email: string, password: string, confirmPassword: string) => {
    const res = await api<{ token: string; user: AuthUser }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password, confirmPassword }),
    });
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem("authToken", res.token);
    localStorage.setItem("authUser", JSON.stringify(res.user));
  };

  const logout = async () => {
    try {
      if (token) {
        await api("/api/auth/logout", {
          method: "POST",
        });
      }
    } catch (error) {
      console.error("Erro ao sair da sessão", error);
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    localStorage.removeItem("selectedProfileId");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
