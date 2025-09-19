// hooks/useExtensions.ts
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export const useExtensions = (competitionId: string) => {
  const [extensions, setExtensions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { fetchWithAuth } = useAuth();

  useEffect(() => {
    const loadExtensions = async () => {
      setLoading(true);
      try {
        const response = await fetchWithAuth(
          `https://www.worldcubeassociation.org/api/v0/competitions/${competitionId}/wcif/public`
        );
        if (response.ok) {
          const wcif = await response.json();
          setExtensions(wcif.extensions || []);
        }
      } catch (error) {
        console.error("Error loading extensions:", error);
      } finally {
        setLoading(false);
      }
    };

    loadExtensions();
  }, [competitionId, fetchWithAuth]);

  return { extensions, loading };
};
