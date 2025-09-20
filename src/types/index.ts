export interface PersonCardProps {
  id: number;
  name: string;
  results: Result[];
  remainingTime: number;
  usedTime: number;
}

export interface ExtendedPersonCardProps extends PersonCardProps {
  extensions?: Extension[];
  extensionsLoading?: boolean;
  shouldFocus?: boolean;
  onFocusComplete?: () => void;
  onSaveComplete?: () => void;
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
  setInputRef: (key: string, el: HTMLInputElement | null) => void;
  focusNextInput: (currentKey: string) => void;
  inputRefs: { [key: string]: HTMLInputElement | null };
}

export interface SearchBarProps {
  query: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
}

export interface PersonCardHeaderProps {
  id: number;
  name: string;
  hasEditPermission: boolean;
  isUpdating: boolean;
  hasUncommittedChanges: boolean;
  saveAllChanges: () => void;
  handleSaveKeyPress: (e: React.KeyboardEvent) => void;
  saveButtonRef: React.RefObject<HTMLButtonElement | null>;
}

export interface PersonCardInputProps {
  inputKey: string;
  value: string;
  placeholder: string;
  isModified: boolean;
  hasEditPermission: boolean;
  onInputChange: (key: string, value: string) => void;
  onKeyPress: (e: React.KeyboardEvent, key: string) => void;
  setInputRef: (key: string, el: HTMLInputElement | null) => void;
}
