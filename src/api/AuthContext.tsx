// src/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

interface User {
  id: number;
  name: string;
  wca_id?: string;
  country_iso2?: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  signIn: () => void;
  signOut: () => void;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const WCA_ORIGIN = import.meta.env.VITE_WCA_ORIGIN;
const WCA_API_ORIGIN = import.meta.env.VITE_WCA_API_ORIGIN;
const CLIENT_ID = import.meta.env.VITE_WCA_CLIENT_KEY;
const REDIRECT_URI = window.location.origin;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(() => localStorage.getItem("accessToken"));
  const [user, setUser] = useState<User | null>(() => {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  });

  // Ha redirectből jött token a hash-ben, mentsük el
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    const params = new URLSearchParams(hash);
    const tokenFromUrl = params.get("access_token");
    if (tokenFromUrl) {
      setAccessToken(tokenFromUrl);
      localStorage.setItem("accessToken", tokenFromUrl);
      // töröljük a hash-t
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Amikor token van, töltsük be a /me endpointot (toleráljuk a data.me / data különbséget)
  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${WCA_API_ORIGIN}/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) {
          console.warn("Failed to fetch /me:", res.status);
          return;
        }
        const data = await res.json();
        const u = data && data.me ? data.me : data;
        if (!cancelled) {
          setUser(u);
          localStorage.setItem("user", JSON.stringify(u));
        }
      } catch (err) {
        console.error("Error loading /me:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const signIn = useCallback(() => {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      response_type: "token",
      redirect_uri: REDIRECT_URI,
      scope: "public manage_competitions",
    });
    window.location.href = `${WCA_ORIGIN}/oauth/authorize?${params.toString()}`;
  }, []);

  const signOut = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
  }, []);

  // Robust headers merging: használjunk Headers objektumot
  const fetchWithAuth = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const token = accessToken ?? localStorage.getItem("accessToken");
      if (!token) throw new Error("Not authenticated");

      const headers = new Headers(options.headers ?? {});
      headers.set("Authorization", `Bearer ${token}`);

      const res = await fetch(url, { ...options, headers });
      return res;
    },
    [accessToken]
  );

  return (
    <AuthContext.Provider value={{ user, accessToken, signIn, signOut, fetchWithAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
