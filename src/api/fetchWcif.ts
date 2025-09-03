import type { WCIF, PersonCardProps, Result } from "../../types";
import { convertResult, hasValidResults } from "../utils";

let data: WCIF;

export async function fetchCompetitionData(competitionId: string): Promise<{
  competitionName: string;
  personsWithResults: PersonCardProps[];
}> {
  const response = await fetch(
    `https://www.worldcubeassociation.org/api/v0/competitions/${competitionId}/wcif/public`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch competition data");
  }

  data = await response.json();

  const competitionName = data.name;
  const timelimit = data.events[0].rounds[0].timeLimit.centiseconds;

  const personsWithResults = data.persons
    .map((person) => {
      const registeredEventIds = person.registration?.eventIds || [];

      const results: Result[] = data.events
        .filter((ev) => registeredEventIds.includes(ev.id))
        .map((ev) => {
          let personResult = null;
          for (const round of ev.rounds) {
            personResult = round.results?.find(
              (r: any) =>
                r.personId === person.registrantId || r.personId === person.id
            );
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
            sumOfAttempts += attempts[i].result;
            times[i] = convertResult(attempts[i].result, ev.id);
          }

          return {
            categoryId: ev.id,
            times,
            average: convertResult(personResult.average, ev.id),
            best: convertResult(personResult.best, ev.id),
            sum: sumOfAttempts,
          };
        })
        .filter(
          (result) =>
            hasValidResults(result.times) ||
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

// function readDnfFromExtensions(time: number) {
//   const extensions = data.extensions.map((extension) => {});
// }
