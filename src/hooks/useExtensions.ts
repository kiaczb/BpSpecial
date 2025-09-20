// hooks/useExtensions.ts
import { useState, useEffect } from "react";

// Helper function (ugyanaz, mint a CompetitionService-ben)
const isAuthenticated = (): boolean => {
  const accessToken = localStorage.getItem("WCAApp.accessToken");
  const expiry = localStorage.getItem("WCAApp.tokenExpiry");
  return !!accessToken && !!expiry && Date.now() < parseInt(expiry, 10);
};

export const useExtensions = (competitionId: string) => {
  const [extensions, setExtensions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadExtensions = async () => {
      setLoading(true);
      setError(null);
      try {
        const isAuth = isAuthenticated();
        const url = isAuth
          ? `https://www.worldcubeassociation.org/api/v0/competitions/${competitionId}/wcif`
          : `https://www.worldcubeassociation.org/api/v0/competitions/${competitionId}/wcif/public`;

        const options: RequestInit = isAuth
          ? {
              headers: {
                Authorization: `Bearer ${localStorage.getItem(
                  "WCAApp.accessToken"
                )}`,
              },
            }
          : {};

        const response = await fetch(url, options);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const wcif = await response.json();
        setExtensions(wcif.extensions || []);
      } catch (error) {
        console.error("Error loading extensions:", error);
        setError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    loadExtensions();
  }, [competitionId]);

  return { extensions, loading, error };
};
