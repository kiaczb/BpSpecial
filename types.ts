export interface PersonCardProps {
  id: number;
  name: string;
  results: Result[];
  remainingTime: number;
  usedTime: number;
}
export interface Result {
  categoryId: string;
  times: string[];
  average: string;
  best: string;
  sum: number;
}
export interface WCIF {
  name: string;
  persons: any[];
  events: any[];
  extensions: any[];
}
// src/types.ts
export interface FetchWithAuth {
  (url: string, options?: RequestInit): Promise<Response>;
}

// ... egyéb típusok
export interface User {
  id: number;
  name: string;
  wca_id?: string;
  country_iso2?: string;
}

export interface CompetitionRole {
  competitionId: string;
  isDelegate: boolean;
  isOrganizer: boolean;
}

export interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  signIn: () => void;
  signOut: () => void;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
  userRoles: CompetitionRole[];
  loadCompetitionRoles: (competitionId: string) => Promise<void>;
}
