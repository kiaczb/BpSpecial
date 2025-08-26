export interface PersonCardProps {
  id: number;
  name: string;
  results: Result[];
  remainingTime: number;
  usedTime: number;
}
export interface Result {
  categoryId: string;
  times: number[];
  average: string;
  best: string;
  sum: number;
}
export interface WCIF {
  name: string;
  persons: any[];
  events: any[];
}
