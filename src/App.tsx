import { useEffect, useState, useRef } from "react";
import PersonCard from "./components/PersonCard/PersonCard";
import SearchBar from "./components/SearchBar";
import LoginBar from "./components/LoginBar";
import ExtensionManager from "./components/ExtensionManager";
import { CompetitionService } from "./services/competitionService";
import type { PersonCardProps } from "./types";
import { useAuth } from "./context/AuthContext";
import { useExtensions } from "./hooks/useExtensions";
import { ToastContainer, Slide } from "react-toastify";

function App() {
  const [personResults, setPersonResults] = useState<PersonCardProps[]>([]);
  const [competitionName, setCompetitionName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const { user, loadCompetitionRoles, userRoles } = useAuth();
  const [focusedPersonId, setFocusedPersonId] = useState<number | null>(null);
  const SELECTED_COMPETITION = import.meta.env.VITE_SELECTED_COMPETITION;

  const searchInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (!loading && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [loading]);

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

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      const foundPerson = personResults.find(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.id.toString().includes(searchQuery)
      );
      if (foundPerson) {
        setFocusedPersonId(foundPerson.id);
      }
    }
  };

  const handleFocusComplete = () => {
    setFocusedPersonId(null);
  };

  const handleSaveComplete = () => {
    if (searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }, 100);
    }
  };

  return (
    <>
      <ToastContainer
        position="top-center"
        autoClose={1200}
        hideProgressBar
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss={false}
        draggable={false}
        pauseOnHover={false}
        theme="light"
        transition={Slide}
      />
      <div className="mb-3">
        <LoginBar competitionName={competitionName} />
      </div>
      <div>
        <ExtensionManager />
      </div>
      <div className="mb-4">
        <SearchBar
          query={query}
          onChange={setQuery}
          onSearch={handleSearch}
          ref={searchInputRef}
        />
      </div>

      <div className="grid mx-2 grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
        {filteredResults.map((p) => (
          <PersonCard
            key={p.id}
            {...p}
            extensions={extensions}
            extensionsLoading={extensionsLoading}
            shouldFocus={focusedPersonId === p.id}
            onFocusComplete={handleFocusComplete}
            onSaveComplete={handleSaveComplete}
          />
        ))}
      </div>
    </>
  );
}

export default App;
