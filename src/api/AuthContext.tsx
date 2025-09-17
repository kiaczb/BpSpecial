// src/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

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
const localStorageKey = (key: string) => `WCAApp.${key}`;
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    localStorage.getItem(localStorageKey("accessToken"))
  );
  const [user, setUser] = useState<User | null>(() => {
    const u = localStorage.getItem(localStorageKey("user"));
    return u ? JSON.parse(u) : null;
  });

  // Token expiry kezelése
  const isTokenValid = () => {
    const expiry = localStorage.getItem(localStorageKey("tokenExpiry"));
    return !!accessToken && !!expiry && Date.now() < parseInt(expiry, 10);
  };

  // Ha redirectből jött token a hash-ben, mentsük el
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;

    const params = new URLSearchParams(hash);
    const tokenFromUrl = params.get("access_token");
    const expiresIn = params.get("expires_in");

    if (tokenFromUrl && expiresIn) {
      const expiryTime = Date.now() + parseInt(expiresIn, 10) * 1000;

      setAccessToken(tokenFromUrl);
      localStorage.setItem(localStorageKey("accessToken"), tokenFromUrl);
      localStorage.setItem(
        localStorageKey("tokenExpiry"),
        expiryTime.toString()
      );

      // Töröljük a hash-t
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

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
      const token =
        accessToken ?? localStorage.getItem(localStorageKey("accessToken"));
      if (!token) throw new Error("Not authenticated");

      // Ellenőrizzük, hogy érvényes-e a token
      const expiry = localStorage.getItem(localStorageKey("tokenExpiry"));
      if (!expiry || Date.now() >= parseInt(expiry, 10)) {
        signOut();
        throw new Error("Token expired");
      }

      const headers = new Headers(options.headers ?? {});
      headers.set("Authorization", `Bearer ${token}`);

      // Ha van body, állítsuk be a Content-Type-ot
      if (options.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }

      const res = await fetch(url, { ...options, headers });

      // Ha unauthorized, kijelentkeztetjük a felhasználót
      if (res.status === 401) {
        signOut();
        throw new Error("Authentication failed");
      }

      return res;
    },
    [accessToken, signOut]
  );

  return (
    <AuthContext.Provider
      value={{ user, accessToken, signIn, signOut, fetchWithAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
