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

// App.tsx
function App() {
  const [personResults, setPersonResults] = useState<PersonCardProps[]>([]);
  const [competitionName, setCompetitionName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const { user, loadCompetitionRoles, userRoles } = useAuth();
  const SELECTED_COMPETITION = import.meta.env.VITE_SELECTED_COMPETITION;

  // Csak egyszer lekérjük az extensions-öket
  const {
    extensions,
    loading: extensionsLoading,
    error: extensionsError,
  } = useExtensions(SELECTED_COMPETITION);

  useEffect(() => {
    CompetitionService.fetchCompetitionData(SELECTED_COMPETITION)
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
        (role) => role.competitionId === SELECTED_COMPETITION
      );
      if (!hasRoles) {
        console.log("Loading competition roles for user:", user.name);
        loadCompetitionRoles(SELECTED_COMPETITION);
      }
    }
  }, [user, loadCompetitionRoles, userRoles]);

  if (loading) return <div className="p-4">Loading competition data…</div>;

  if (extensionsError) {
    console.warn(
      "Extensions loading failed, but continuing without them:",
      extensionsError
    );
  }

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
      <div>{/* <ExtensionManager /> */}</div>
      <div className="mb-4">
        <SearchBar query={query} onChange={setQuery} />
      </div>

      <div className="grid mx-2 grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
        {filteredResults.map((p) => (
          <PersonCard
            key={p.id}
            {...p}
            extensions={extensions}
            extensionsLoading={extensionsLoading}
          />
        ))}
      </div>
    </>
  );
}

export default App;
