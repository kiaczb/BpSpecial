import type { PersonCardProps } from "../types";
import { convertResult } from "../utils/utils";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

// Hooks
import { useEditPermission } from "../hooks/useEditPermissions";
import { useInputManagement } from "../hooks/useInputManagement";

// Services
import { useWcifService } from "../services/wcifService";

// Utils
import {
  getMaxAttempts,
  generateInputKey,
  createPersonExtension,
} from "../utils/personCardUtils";

const PersonCard = ({
  id,
  name,
  results,
  remainingTime,
  usedTime,
}: PersonCardProps) => {
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  const competitionId = "BudapestSpecial2024";
  const hasEditPermission = useEditPermission(competitionId);
  const {
    modifiedValues,
    handleInputChange,
    handleKeyPress,
    setInputRef,
    clearModifiedValues,
  } = useInputManagement();

  const { getWcif, updateWcifExtensions } = useWcifService();
  const maxAttempts = getMaxAttempts(results);

  const saveAllChanges = async (): Promise<void> => {
    if (
      !user ||
      !hasEditPermission ||
      Object.keys(modifiedValues).length === 0
    ) {
      return;
    }

    setIsUpdating(true);

    try {
      // 1. WCIF lekérése
      const wcif = await getWcif(competitionId);
      const existingExtensions = wcif.extensions || [];

      // 2. Régi extension eltávolítása
      const filteredExtensions = existingExtensions.filter(
        (ext: any) => !ext.id.startsWith(`hungarian.times.person.${id}`)
      );

      // 3. Új extension létrehozása
      const personExtension = createPersonExtension(
        id,
        name,
        competitionId,
        modifiedValues
      );

      // 4. Extension hozzáadása és mentés
      const updatedExtensions = [...filteredExtensions, personExtension];
      await updateWcifExtensions(competitionId, updatedExtensions);

      console.log("Személy adatai elmentve");
      alert("Módosítások sikeresen elmentve!");
      clearModifiedValues();
    } catch (error) {
      console.error("Hiba a mentés során:", error);
      alert(`Hiba történt: ${error}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg px-6 py-2 border-1 shadow-xl border-gray-700 mx-0.5 dark:bg-sky-900/50 dark:text-gray-50">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-center dark:text-white">
          ({id}) {name}
        </h2>

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
                  const inputKey = generateInputKey(id, res.categoryId, i);
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
