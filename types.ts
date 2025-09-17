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
