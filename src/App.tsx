import PersonCard from "./components/PersonCard";
import type { PersonCardProps, Result, WCIF } from "../types";
import SearchBar from "./components/SearchBar";
import { convertResult, hasValidResults } from "./utils";
import { useEffect, useState } from "react";

function App() {
  const [personResults, setPersonResults] = useState<PersonCardProps[]>([]);
  const [competitionName, setCompetitionName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(
      "https://www.worldcubeassociation.org/api/v0/competitions/BudapestSpecial2024/wcif/public"
    )
      .then((res) => res.json())
      .then((data: WCIF) => {
        setCompetitionName(data.name);
        const timelimit = data.events[0].rounds[0].timeLimit.centiseconds;
        const personsWithResults = data.persons
          .map((person) => {
            // Only registered events
            const registeredEventIds = person.registration?.eventIds || [];

            const results: Result[] = data.events
              .filter((ev) => registeredEventIds.includes(ev.id))
              .map((ev) => {
                // Iterate through all round and look for the competitor
                let personResult = null;

                for (const round of ev.rounds) {
                  personResult = round.results?.find(
                    (r: any) =>
                      r.personId === person.registrantId ||
                      r.personId === person.id
                  );
                  if (personResult) break; // Found it, exit
                }

                // We didn't find the competitotor so he didn't registered to this event
                if (!personResult) {
                  return {
                    categoryId: ev.id,
                    times: Array(5).fill("DNS"),
                    average: "-",
                    best: "-",
                    sum: 0,
                  };
                }

                // Handle attempts
                const attempts = personResult.attempts || [];
                const times = Array(attempts.length).fill("DNS");
                let sumOfAttempts = 0;
                for (let i = 0; i < attempts.length; i++) {
                  sumOfAttempts += attempts[i].result;
                  times[i] = convertResult(attempts[i].result, ev.id);
                }

                return {
                  categoryId: ev.id,
                  times: times,
                  average: convertResult(personResult.average, ev.id),
                  best: convertResult(personResult.best, ev.id),
                  sum: sumOfAttempts,
                };
              })
              // Filter those events which only has DNS
              .filter(
                (result) =>
                  hasValidResults(result.times) ||
                  result.average !== "-" ||
                  result.best !== "-"
              );

            // If there are no valid result we don't show the competitor
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
          //Filter nulls (competitors that has no valid result)
          .filter((person): person is PersonCardProps => person !== null);

        setPersonResults(personsWithResults);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-4">Loading…</div>;

  return (
    <>
      <div className="mb-4">
        <h1 className="text-3xl text-center font-bold m-2 dark:text-white">
          {competitionName}
        </h1>
        <SearchBar />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
        {personResults.map((p) => (
          <PersonCard
            key={p.id}
            id={p.id}
            name={p.name}
            results={p.results}
            remainingTime={p.remainingTime}
            usedTime={p.usedTime}
          />
        ))}
      </div>
    </>
  );
}

export default App;
