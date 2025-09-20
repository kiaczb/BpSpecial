import type { Result } from "../types";

export const getMaxAttempts = (results: Result[]): number => {
  return Math.max(...results.map((res) => res.times.length), 5);
};

export const generateInputKey = (
  personId: number,
  eventId: string,
  attemptIndex: number
): string => {
  return `pid-${personId}-evt-${eventId}-att-${attemptIndex}`;
};

export function formatTimeInput(value: string): string {
  const digits = value.replace(/\D/g, "");

  if (!digits) return "";

  if (digits.length <= 2) {
    return `0.${digits.padStart(2, "0")}`;
  }

  if (digits.length <= 4) {
    const seconds = digits.slice(0, -2);
    const centis = digits.slice(-2);
    return `${parseInt(seconds, 10)}.${centis}`;
  }

  const minutes = digits.slice(0, -4);
  const seconds = digits.slice(-4, -2);
  const centis = digits.slice(-2);
  return `${parseInt(minutes, 10)}:${seconds}.${centis}`;
}
export const convertResult = (
  resultValue: number,
  eventId?: string
): string => {
  if (resultValue === -1) return "DNF";
  if (resultValue === -2) return "DNS";
  if (resultValue === 0) return "";

  if (eventId === "333fm") {
    return resultValue.toString();
  }

  const minutes = Math.floor(resultValue / 6000);
  const seconds = Math.floor((resultValue % 6000) / 100);
  const centiseconds = resultValue % 100;

  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, "0")}.${centiseconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${seconds}.${centiseconds.toString().padStart(2, "0")}`;
};

export const hasValidResults = (times: string[]): boolean => {
  return times.some((time) => time !== "DNS" && time !== "DNF" && time !== "");
};
export const formattedTimeToCentiseconds = (formattedTime: string): number => {
  if (formattedTime === "DNF" || formattedTime === "DNS") {
    return -1;
  }

  const normalized = formattedTime.replace(",", ".");

  const parts = normalized.split(":");

  let totalCentiseconds = 0;

  if (parts.length === 1) {
    const [seconds, centis] = parts[0].split(".");
    totalCentiseconds =
      parseInt(seconds || "0", 10) * 100 + parseInt(centis || "0", 10);
  } else if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10);
    const [seconds, centis] = parts[1].split(".");
    totalCentiseconds =
      minutes * 6000 +
      parseInt(seconds || "0", 10) * 100 +
      parseInt(centis || "0", 10);
  }

  return totalCentiseconds;
};
