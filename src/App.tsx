import { useEffect, useState } from "react";
import PersonCard from "./components/PersonCard";
import SearchBar from "./components/SearchBar";
import { fetchCompetitionData } from "./api/fetchWcif";
import type { PersonCardProps } from "../types";

function App() {
  const [personResults, setPersonResults] = useState<PersonCardProps[]>([]);
  const [competitionName, setCompetitionName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetchCompetitionData("BudapestSpecial2024")
      .then(({ competitionName, personsWithResults }) => {
        setCompetitionName(competitionName);
        setPersonResults(personsWithResults);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4">Loading…</div>;

  // 👇 keresés névben vagy id-ben
  const filteredResults = personResults.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.id.toString().includes(query)
  );

  return (
    <>
      <div className="mb-4">
        <h1 className="text-3xl text-center font-bold m-2 dark:text-white">
          {competitionName}
        </h1>
        <SearchBar query={query} onChange={setQuery} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
        {filteredResults.map((p) => (
          <PersonCard key={p.id} {...p} />
        ))}
      </div>
    </>
  );
}

export default App;
