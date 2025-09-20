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
  persons: Person[];
  events: Event[];
  extensions?: Extension[];
}

export interface Person {
  id: number;
  registrantId?: number;
  name: string;
  registration?: {
    eventIds: string[];
  };
}

export interface Event {
  id: string;
  rounds: Round[];
}

export interface Round {
  results?: ResultEntry[];
  timeLimit?: {
    centiseconds: number;
  };
  extensions?: any[];
}

export interface ResultEntry {
  personId: number;
  attempts: Attempt[];
  average: number;
  best: number;
}

export interface Attempt {
  result: number;
}

export interface Extension {
  id: string;
  specUrl: string;
  data: any;
}

export interface FetchWithAuth {
  (url: string, options?: RequestInit): Promise<Response>;
}

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
  fetchWithAuth: FetchWithAuth;
  userRoles: CompetitionRole[];
  loadCompetitionRoles: (competitionId: string) => Promise<void>;
}

export interface InputManagementReturn {
  modifiedValues: { [key: string]: string };
  handleInputChange: (key: string, value: string) => void;
  handleKeyPress: (e: React.KeyboardEvent, key: string) => void;
  setInputRef: (key: string, el: HTMLInputElement | null) => void;
  focusNextInput: (currentKey: string) => void;
}
