import { useAuth } from "../context/AuthContext";
import type { WCIF } from "../types";

export const useWcifService = () => {
  const { fetchWithAuth } = useAuth();

  const getWcif = async (competitionId: string): Promise<WCIF> => {
    const response = await fetchWithAuth(
      `https://www.worldcubeassociation.org/api/v0/competitions/${competitionId}/wcif`
    );

    if (!response.ok) {
      throw new Error(`HTTP hiba a WCIF lekérésnél: ${response.status}`);
    }

    return (await response.json()) as WCIF;
  };

  const updateWcifExtensions = async (
    competitionId: string,
    extensions: any[]
  ): Promise<Response> => {
    const response = await fetchWithAuth(
      `https://www.worldcubeassociation.org/api/v0/competitions/${competitionId}/wcif`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ extensions }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP hiba: ${response.status} - ${errorText}`);
    }

    return response;
  };

  return {
    getWcif,
    updateWcifExtensions,
  };
};
