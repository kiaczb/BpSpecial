// src/api/wcifExtensions.ts
import type { FetchWithAuth } from "../../types";

export const writeExtension = async (
  fetchWithAuth: FetchWithAuth,
  competitionId: string,
  extensionData: any
) => {
  const response = await fetchWithAuth(
    `https://www.worldcubeassociation.org/api/v0/competitions/${competitionId}/wcif`,
    {
      method: "PATCH",
      body: JSON.stringify(extensionData),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to write extension: ${response.statusText}`);
  }

  return response.json();
};

export const readExtensions = async (
  fetchWithAuth: FetchWithAuth,
  competitionId: string
) => {
  const response = await fetchWithAuth(
    `https://www.worldcubeassociation.org/api/v0/competitions/${competitionId}/wcif`
  );

  if (!response.ok) {
    throw new Error(`Failed to read WCIF: ${response.statusText}`);
  }

  const wcif = await response.json();
  return wcif.extensions || [];
};
