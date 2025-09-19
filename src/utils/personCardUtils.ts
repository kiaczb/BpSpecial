import type { Result } from "../types";
import type { ModifiedAttempt, PersonExtension } from "../types";

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

export const createPersonExtension = (
  personId: number,
  name: string,
  competitionId: string,
  modifiedValues: { [key: string]: string }
): PersonExtension => {
  const modifiedAttempts: ModifiedAttempt[] = [];

  for (const [key, newValue] of Object.entries(modifiedValues)) {
    const match = key.match(/pid-(\d+)-evt-(\w+)-att-(\d+)/);
    if (!match) continue;

    const eventId = match[2];
    const attemptIndex = parseInt(match[3]);

    modifiedAttempts.push({
      eventId,
      roundId: `${eventId}-r1`,
      attemptIndex,
      newValue,
      modifiedAt: new Date().toISOString(),
    });
  }

  return {
    id: `hungarian.times.person.${personId}`,
    specUrl: "https://example.com/hungarian-person-times-extension",
    data: {
      personId,
      personName: name,
      competitionId,
      modifiedAttempts,
      lastUpdated: new Date().toISOString(),
    },
  };
};
