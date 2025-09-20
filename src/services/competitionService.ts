// src/services/competitionService.ts
import type {
  WCIF,
  PersonCardProps,
  Result,
  Person,
  Event,
  ResultEntry,
} from "../types";

// Helper function to check auth status without React hooks
const isAuthenticated = (): boolean => {
  const accessToken = localStorage.getItem("WCAApp.accessToken");
  const expiry = localStorage.getItem("WCAApp.tokenExpiry");
  return !!accessToken && !!expiry && Date.now() < parseInt(expiry, 10);
};

export class CompetitionService {
  private static async fetchWcif(competitionId: string): Promise<WCIF> {
    const isAuth = isAuthenticated();
    const url = isAuth
      ? `https://www.worldcubeassociation.org/api/v0/competitions/${competitionId}/wcif`
      : `https://www.worldcubeassociation.org/api/v0/competitions/${competitionId}/wcif/public`;

    console.log(`Fetching WCIF from: ${url}, authenticated: ${isAuth}`);

    const options: RequestInit = isAuth
      ? {
          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              "WCAApp.accessToken"
            )}`,
          },
        }
      : {};

    const response = await fetch(url, options);

    if (!response.ok) {
      if (response.status === 401 && isAuth) {
        // Token expired or invalid, clear it and retry with public endpoint
        localStorage.removeItem("WCAApp.accessToken");
        localStorage.removeItem("WCAApp.tokenExpiry");
        localStorage.removeItem("WCAApp.user");
        console.log("Token invalid, falling back to public endpoint");
        return this.fetchWcif(competitionId);
      }
      throw new Error(`Failed to fetch competition data: ${response.status}`);
    }

    return await response.json();
  }

  // ... (a többi metódus változatlan marad)
  private static convertResult(resultValue: number, eventId: string): string {
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
  }

  private static hasValidResults(times: string[]): boolean {
    return times.some(
      (time) => time !== "DNS" && time !== "DNF" && time !== ""
    );
  }

  public static async fetchCompetitionData(competitionId: string): Promise<{
    competitionName: string;
    personsWithResults: PersonCardProps[];
  }> {
    const data = await this.fetchWcif(competitionId);
    const competitionName = data.name;
    const timelimit = data.events[0]?.rounds[0]?.timeLimit?.centiseconds || 0;

    const personsWithResults = data.persons
      .map((person: Person) => {
        const registeredEventIds = person.registration?.eventIds || [];

        const results: Result[] = data.events
          .filter((ev: Event) => registeredEventIds.includes(ev.id))
          .map((ev: Event) => {
            let personResult: ResultEntry | null = null;

            for (const round of ev.rounds) {
              personResult =
                round.results?.find(
                  (r: ResultEntry) =>
                    r.personId === person.registrantId ||
                    r.personId === person.id
                ) || null;
              if (personResult) break;
            }

            if (!personResult) {
              return {
                categoryId: ev.id,
                times: Array(5).fill("DNS"),
                average: "-",
                best: "-",
                sum: 0,
              };
            }

            const attempts = personResult.attempts || [];
            const times = Array(attempts.length).fill("DNS");
            let sumOfAttempts = 0;

            for (let i = 0; i < attempts.length; i++) {
              let resultValue = attempts[i].result;

              sumOfAttempts += resultValue > 0 ? resultValue : 0;
              times[i] = this.convertResult(resultValue, ev.id);
            }

            return {
              categoryId: ev.id,
              times,
              average: this.convertResult(personResult.average, ev.id),
              best: this.convertResult(personResult.best, ev.id),
              sum: sumOfAttempts,
            };
          })
          .filter(
            (result: Result) =>
              this.hasValidResults(result.times) ||
              result.average !== "-" ||
              result.best !== "-"
          );

        if (results.length === 0) {
          return null;
        }

        let restultsSum = 0;
        for (let i = 0; i < results.length; i++) {
          restultsSum += results[i].sum;
        }

        return {
          id: person.registrantId || person.id,
          name: person.name,
          results,
          remainingTime: timelimit - restultsSum,
          usedTime: restultsSum,
        };
      })
      .filter((person): person is PersonCardProps => person !== null);

    return { competitionName, personsWithResults };
  }
}
