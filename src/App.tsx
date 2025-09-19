// App.tsx
import { useEffect, useState } from "react";
import PersonCard from "./components/PersonCard";
import SearchBar from "./components/SearchBar";
import LoginBar from "./components/LoginBar";
import ExtensionManager from "./components/ExtensionManager";
import { CompetitionService } from "./services/competitionService";
import type { PersonCardProps } from "./types";
import { useAuth } from "./context/AuthContext";
import { useExtensions } from "./hooks/useExtensions";

function App() {
  const [personResults, setPersonResults] = useState<PersonCardProps[]>([]);
  const [competitionName, setCompetitionName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const { user, loadCompetitionRoles, userRoles } = useAuth();

  // Csak egyszer lekérjük az extensions-öket
  const { extensions, loading: extensionsLoading } = useExtensions(
    "BudapestSpecial2024"
  );

  useEffect(() => {
    CompetitionService.fetchCompetitionData("BudapestSpecial2024")
      .then(({ competitionName, personsWithResults }) => {
        setCompetitionName(competitionName);
        setPersonResults(personsWithResults);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user) {
      const hasRoles = userRoles.some(
        (role) => role.competitionId === "BudapestSpecial2024"
      );
      if (!hasRoles) {
        console.log("Loading competition roles for user:", user.name);
        loadCompetitionRoles("BudapestSpecial2024");
      }
    }
  }, [user, loadCompetitionRoles, userRoles]);

  if (loading || extensionsLoading) return <div className="p-4">Loading…</div>;

  const filteredResults = personResults.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.id.toString().includes(query)
  );

  return (
    <>
      <div className="mb-3">
        <LoginBar competitionName={competitionName} />
      </div>

      {/* <div className="mb-4">
        <ExtensionManager extensions={extensions} />
      </div> */}

      <div className="mb-4">
        <SearchBar query={query} onChange={setQuery} />
      </div>

      <div className="grid mx-2 grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
        {filteredResults.map((p) => (
          <PersonCard key={p.id} {...p} extensions={extensions} />
        ))}
      </div>
    </>
  );
}

export default App;
