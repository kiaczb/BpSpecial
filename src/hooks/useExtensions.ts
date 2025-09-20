// hooks/useExtensions.ts
import { useState, useEffect } from "react";

export const useExtensions = (competitionId: string) => {
  const [extensions, setExtensions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadExtensions = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `https://www.worldcubeassociation.org/api/v0/competitions/${competitionId}/wcif/public`
        );

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
