// src/components/PersonCard.tsx
import type { PersonCardProps } from "../../types";
import { convertResult } from "../utils";
import { useAuth } from "../context/AuthContext";
import { useState, useRef, useEffect } from "react";

const PersonCard = ({
  id,
  name,
  results,
  remainingTime,
  usedTime,
}: PersonCardProps) => {
  const { fetchWithAuth, user, userRoles } = useAuth(); // ELTÁVOLÍTVA: loadCompetitionRoles
  const [isUpdating, setIsUpdating] = useState(false);
  const [modifiedValues, setModifiedValues] = useState<{
    [key: string]: string;
  }>({});
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const [hasEditPermission, setHasEditPermission] = useState(false);

  const competitionId = "BudapestSpecial2024";

  // ELTÁVOLÍTVA: a loadCompetitionRoles useEffect

  // Ellenőrizzük, hogy a felhasználónak van-e szerkesztési jogosultsága
  useEffect(() => {
    const competitionRole = userRoles.find(
      (role) => role.competitionId === competitionId
    );
    const canEdit = competitionRole?.isDelegate || competitionRole?.isOrganizer;
    setHasEditPermission(!!canEdit);
  }, [userRoles, competitionId]);

  const getMaxAttempts = () => {
    return Math.max(...results.map((res) => res.times.length), 5);
  };

  const maxAttempts = getMaxAttempts();

  // Fókuszálás a következő inputra
  const focusNextInput = (currentKey: string) => {
    const keys = Object.keys(inputRefs.current);
    const currentIndex = keys.indexOf(currentKey);

    if (currentIndex < keys.length - 1) {
      const nextKey = keys[currentIndex + 1];
      inputRefs.current[nextKey]?.focus();
    }
  };

  // Input érték változás kezelése
  const handleInputChange = (key: string, value: string) => {
    setModifiedValues((prev) => ({ ...prev, [key]: value }));
  };

  // Enter kezelése - következő inputra ugrik
  const handleKeyPress = (e: React.KeyboardEvent, key: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      focusNextInput(key);
    }
  };

  // CSAK AZ ADOTT PERSONCARD MENTÉSE - EGY API HÍVÁS
  const saveAllChanges = async () => {
    if (
      !user ||
      !hasEditPermission ||
      Object.keys(modifiedValues).length === 0
    ) {
      return;
    }

    setIsUpdating(true);

    try {
      // Személyenkénti csoportosítás - egy extension egy személyre
      const personExtension = {
        id: `hungarian.times.person.${id}`,
        specUrl: "https://example.com/hungarian-person-times-extension",
        data: {
          personId: id,
          personName: name,
          competitionId: competitionId,
          modifiedAttempts: [] as any[],
          lastUpdated: new Date().toISOString(),
        },
      };

      // Összegyűjtjük az összes módosítást
      for (const [key, newValue] of Object.entries(modifiedValues)) {
        const match = key.match(/pid-(\d+)-evt-(\w+)-att-(\d+)/);
        if (!match) continue;

        const eventId = match[2];
        const attemptIndex = parseInt(match[3]);
        const roundId = `${eventId}-r1`;

        personExtension.data.modifiedAttempts.push({
          eventId,
          roundId,
          attemptIndex,
          oldValue:
            results.find((r) => r.categoryId === eventId)?.times[
              attemptIndex
            ] || "DNF/DNS",
          newValue,
          modifiedAt: new Date().toISOString(),
        });
      }

      // Elküldjük csak ezt az egy extension-t
      const patchResponse = await fetchWithAuth(
        `https://www.worldcubeassociation.org/api/v0/competitions/${competitionId}/wcif`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ extensions: [personExtension] }),
        }
      );

      if (!patchResponse.ok) {
        const errorText = await patchResponse.text();
        throw new Error(`HTTP hiba: ${patchResponse.status} - ${errorText}`);
      }

      console.log("Személy adatai elmentve egy extension-ben");
      alert("Módosítások sikeresen elmentve!");
      setModifiedValues({});
    } catch (error) {
      console.error("Hiba a mentés során:", error);
      alert(`Hiba történt: ${error}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Input referencia beállítása
  const setInputRef = (key: string, el: HTMLInputElement | null) => {
    inputRefs.current[key] = el;
  };

  // Egyszerű és egyértelmű kulcs generálás
  const generateInputKey = (eventId: string, attemptIndex: number) => {
    return `pid-${id}-evt-${eventId}-att-${attemptIndex}`;
  };

  return (
    <div className="bg-white rounded-lg px-6 py-2 border-1 shadow-xl border-gray-700 mx-0.5 dark:bg-sky-900/50 dark:text-gray-50">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-center dark:text-white">
          ({id}) {name}
        </h2>

        {/* Csak akkor jelenik meg a mentés gomb, ha van szerkesztési jogosultság */}
        {hasEditPermission && (
          <button
            onClick={saveAllChanges}
            disabled={isUpdating || Object.keys(modifiedValues).length === 0}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isUpdating ? "Mentés..." : "Mentés"}
          </button>
        )}
      </div>

      <div className="justify-items-stretch">
        <table className="table-auto text-sm w-full dark:text-gray-200">
          <thead className="text-center">
            <tr className="border-collapse border-b-1 border-gray-400">
              <th>Category</th>
              {Array.from({ length: maxAttempts }, (_, i) => (
                <th key={i} className="hidden sm:table-cell">
                  {i + 1}
                </th>
              ))}
              <th>Average</th>
              <th>Best</th>
            </tr>
          </thead>
          <tbody className="text-center font-bold">
            {results.map((res, idx) => (
              <tr
                key={idx}
                className="border-collapse border-b-1 border-gray-400"
              >
                <td className="py-1">
                  <span
                    className={`cubing-icon event-${res.categoryId} text-2xl`}
                  ></span>
                </td>
                {res.times.map((time, i) => {
                  const inputKey = generateInputKey(res.categoryId, i);
                  const isModified = modifiedValues[inputKey] !== undefined;

                  return (
                    <td key={i} className="hidden sm:table-cell py-1">
                      {time !== "DNF" && time !== "DNS" ? (
                        time
                      ) : (
                        <input
                          ref={(el) => setInputRef(inputKey, el)}
                          type="text"
                          placeholder={time}
                          defaultValue={modifiedValues[inputKey] || ""}
                          maxLength={8}
                          className={`w-15 text-center placeholder-red-600 border rounded ${
                            isModified ? "bg-yellow-100" : ""
                          } ${hasEditPermission ? "" : "cursor-not-allowed"}`}
                          onChange={(e) =>
                            handleInputChange(inputKey, e.target.value)
                          }
                          onKeyPress={(e) => handleKeyPress(e, inputKey)}
                          disabled={!hasEditPermission}
                        />
                      )}
                    </td>
                  );
                })}
                {Array.from(
                  { length: maxAttempts - res.times.length },
                  (_, i) => (
                    <td
                      key={i + res.times.length}
                      className="hidden sm:table-cell py-1"
                    >
                      -
                    </td>
                  )
                )}
                <td className="py-1">{res.average}</td>
                <td className="py-1">{res.best}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="justify-items-stretch mt-3">
        <table className="table-auto w-full">
          <thead className="text-center">
            <tr>
              <th>Remaining</th>
              <th>Used</th>
            </tr>
          </thead>
          <tbody className="text-center">
            <tr>
              <td>{convertResult(remainingTime)}</td>
              <td>{convertResult(usedTime)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {hasEditPermission && Object.keys(modifiedValues).length > 0 && (
        <div className="mt-2 text-xs text-yellow-600">
          {Object.keys(modifiedValues).length} módosított érték vár mentésre
        </div>
      )}
    </div>
  );
};

export default PersonCard;
