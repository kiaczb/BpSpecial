// src/context/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { AuthContextType, User, CompetitionRole } from "../../types";

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
  const [userRoles, setUserRoles] = useState<CompetitionRole[]>([]);

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

  // Amikor token van, töltsük be a /me endpointot
  useEffect(() => {
    if (!accessToken || !isTokenValid()) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${WCA_API_ORIGIN}/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) {
          console.warn("Failed to fetch /me:", res.status);
          // Ha invalid a token, töröljük
          if (res.status === 401) {
            signOut();
          }
          return;
        }
        const data = await res.json();
        const u = data && data.me ? data.me : data;
        if (!cancelled) {
          setUser(u);
          localStorage.setItem(localStorageKey("user"), JSON.stringify(u));
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
    setUserRoles([]);
    localStorage.removeItem(localStorageKey("accessToken"));
    localStorage.removeItem(localStorageKey("user"));
    localStorage.removeItem(localStorageKey("tokenExpiry"));
  }, []);

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

  // Funkció a felhasználó szerepeinek betöltéséhez egy versenyben
  const loadCompetitionRoles = useCallback(
    async (competitionId: string) => {
      if (!accessToken || !user) return;

      try {
        const response = await fetchWithAuth(
          `https://www.worldcubeassociation.org/api/v0/competitions/${competitionId}/wcif`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch WCIF: ${response.status}`);
        }

        const wcif = await response.json();

        // Megkeressük a felhasználót a persons tömbben
        const currentUser = wcif.persons.find(
          (person: any) =>
            person.wcaUserId === user.id || person.name === user.name
        );

        if (currentUser) {
          const isDelegate = currentUser.roles?.includes("delegate") || false;
          const isOrganizer = currentUser.roles?.includes("organizer") || false;

          setUserRoles([
            {
              competitionId,
              isDelegate,
              isOrganizer,
            },
          ]);
        }
      } catch (error) {
        console.error("Error loading user roles:", error);
      }
    },
    [accessToken, user, fetchWithAuth]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        signIn,
        signOut,
        fetchWithAuth,
        userRoles,
        loadCompetitionRoles,
      }}
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
