import type { PersonCardProps, Extension } from "../types";
import {
  formatTimeInput,
  convertResult,
  formattedTimeToCentiseconds,
} from "../utils/personCardUtils";
import { useAuth } from "../context/AuthContext";
import { useState, useMemo } from "react";

// Hooks
import { useEditPermission } from "../hooks/useEditPermissions";
import { useInputManagement } from "../hooks/useInputManagement";

// Services
import { useWcifService } from "../services/wcifService";

// Utils
import { getMaxAttempts, generateInputKey } from "../utils/personCardUtils";

// Extend the PersonCardProps interface locally
interface ExtendedPersonCardProps extends PersonCardProps {
  extensions?: Extension[];
  extensionsLoading?: boolean;
}

const PersonCard = ({
  id,
  name,
  results,
  remainingTime: initialRemainingTime,
  usedTime: initialUsedTime,
  extensions = [],
}: ExtendedPersonCardProps) => {
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasUncommittedChanges, setHasUncommittedChanges] = useState(false);

  const competitionId = "BudapestSpecial2024";
  const hasEditPermission = useEditPermission(competitionId);
  const { modifiedValues, handleInputChange, handleKeyPress, setInputRef } =
    useInputManagement();

  // input change-nél mindig jelezzük, hogy van új változtatás
  const onInputChange = (key: string, value: string) => {
    const formatted = formatTimeInput(value);

    // Ha a formázott érték 0 vagy 0.00 → DNF / üres
    if (formatted === "0" || formatted === "0.00" || formatted === "") {
      handleInputChange(key, ""); // üres string → visszaáll a DNF/placeholder
    } else {
      handleInputChange(key, formatted);
    }

    setHasUncommittedChanges(true);
  };

  const { getWcif, updateWcifExtensions } = useWcifService();
  const maxAttempts = getMaxAttempts(results);

  // Extension-ből származó idők kinyerése és centisecond konverziója
  const extensionTimes = useMemo(() => {
    const times: { [key: string]: number } = {};

    // Megkeressük a személy extension-ét
    const personExtension = extensions.find(
      (ext) => ext.id === `hungarian.times.person.${id}`
    );

    if (!personExtension) return times;

    // Minden módosított attempt-ot feldolgozunk
    personExtension.data.modifiedAttempts.forEach((attempt: any) => {
      const key = generateInputKey(id, attempt.eventId, attempt.attemptIndex);
      times[key] = parseInt(attempt.newValue, 10);
    });

    return times;
  }, [extensions, id]);

  // Dinamikus időszámítás - most már az extension időket is figyelembe veszi
  const { remainingTime, usedTime } = useMemo(() => {
    let totalUsedTime = initialUsedTime;
    let totalRemainingTime = initialRemainingTime;

    // 1. Extension-ből származó idők hozzáadása
    Object.values(extensionTimes).forEach((centiseconds) => {
      if (centiseconds > 0) {
        totalRemainingTime -= centiseconds;
        totalUsedTime += centiseconds;
      }
    });

    // 2. Módosított értékek hozzáadása (ha vannak)
    Object.values(modifiedValues).forEach((formattedTime) => {
      const centiseconds = formattedTimeToCentiseconds(formattedTime);
      if (centiseconds > 0) {
        totalRemainingTime -= centiseconds;
        totalUsedTime += centiseconds;
      }
    });

    return {
      remainingTime: Math.max(-1, totalRemainingTime),
      usedTime: totalUsedTime,
    };
  }, [initialRemainingTime, initialUsedTime, extensionTimes, modifiedValues]);

  // Input mező értékének meghatározása
  const getInputValue = (eventId: string, attemptIndex: number): string => {
    const modifiedKey = generateInputKey(id, eventId, attemptIndex);

    // 1. Ha van módosított érték
    if (modifiedValues[modifiedKey] !== undefined) {
      return modifiedValues[modifiedKey];
    }

    // 2. Ha van extension érték és az nem DNF/DNS
    if (extensionTimes[modifiedKey] !== undefined) {
      const centiseconds = extensionTimes[modifiedKey];
      const converted = convertResult(centiseconds, eventId);
      if (converted !== "DNF" && converted !== "DNS") {
        return converted;
      }
    }

    // 3. Alapértelmezett: üres string
    return "";
  };

  // DNF-ek helyettesítése extensions-ből
  const getDisplayTime = (
    eventId: string,
    attemptIndex: number,
    originalTime: string
  ): string => {
    const inputValue = getInputValue(eventId, attemptIndex);
    if (inputValue) return inputValue;
    return originalTime;
  };

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

      // 2. Megkeressük a személy meglévő extension-jét
      const existingPersonExtension = existingExtensions.find(
        (ext: any) => ext.id === `hungarian.times.person.${id}`
      );

      // 3. Meglévő módosítások betöltése (ha vannak)
      const existingModifiedAttempts = existingPersonExtension
        ? existingPersonExtension.data.modifiedAttempts
        : [];

      // 4. Új módosítások hozzáadása/módosítása
      const updatedModifiedAttempts = [...existingModifiedAttempts];

      for (const [key, formattedValue] of Object.entries(modifiedValues)) {
        const match = key.match(/pid-(\d+)-evt-(\w+)-att-(\d+)/);
        if (!match) continue;

        const eventId = match[2];
        const attemptIndex = parseInt(match[3]);
        const centiseconds = formattedTimeToCentiseconds(formattedValue);

        // Megkeressük, hogy ez az attempt már létezik-e
        const existingIndex = updatedModifiedAttempts.findIndex(
          (attempt: any) =>
            attempt.eventId === eventId && attempt.attemptIndex === attemptIndex
        );

        if (existingIndex !== -1) {
          // Módosítjuk a meglévőt
          updatedModifiedAttempts[existingIndex] = {
            ...updatedModifiedAttempts[existingIndex],
            newValue: centiseconds.toString(),
            modifiedAt: new Date().toISOString(),
          };
        } else {
          // Új attempt hozzáadása
          updatedModifiedAttempts.push({
            eventId,
            roundId: `${eventId}-r1`,
            attemptIndex,
            newValue: centiseconds.toString(),
            modifiedAt: new Date().toISOString(),
          });
        }
      }

      // 5. Új extension létrehozása
      const personExtension = {
        id: `hungarian.times.person.${id}`,
        specUrl: "https://example.com/hungarian-person-times-extension",
        data: {
          personId: id,
          personName: name,
          competitionId,
          modifiedAttempts: updatedModifiedAttempts,
          lastUpdated: new Date().toISOString(),
        },
      };

      // 6. Régi extension eltávolítása és új hozzáadása
      const filteredExtensions = existingExtensions.filter(
        (ext: any) => ext.id !== `hungarian.times.person.${id}`
      );

      const updatedExtensions = [...filteredExtensions, personExtension];
      await updateWcifExtensions(competitionId, updatedExtensions);

      console.log("Személy adatai elmentve");
      alert("Módosítások sikeresen elmentve!");
      setHasUncommittedChanges(false);
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
            disabled={isUpdating || !hasUncommittedChanges}
            hidden={!hasUncommittedChanges && !isUpdating}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isUpdating ? "Saving..." : "Save"}
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
                  const inputValue = getInputValue(res.categoryId, i);
                  const isDNF = time === "DNF";
                  const isDNS = time === "DNS";
                  const displayTime = getDisplayTime(res.categoryId, i, time);

                  return (
                    <td
                      key={i}
                      className={`hidden sm:table-cell py-1 ${
                        isDNF || isDNS ? "text-red-600" : "text-black"
                      }`}
                    >
                      {!isDNF || !hasEditPermission ? (
                        // Ha az eredeti nem DNF/DNS → csak szöveg
                        displayTime
                      ) : (
                        // Ha eredeti DNF/DNS → input mező (extensionből jövő értékkel feltöltve)
                        <input
                          ref={(el) => setInputRef(inputKey, el)}
                          type="text"
                          value={inputValue}
                          placeholder={time}
                          maxLength={8}
                          className={`w-15 text-center placeholder-red-600 text-red-600 border-black border rounded ${
                            isModified ? "bg-yellow-100" : ""
                          } ${hasEditPermission ? "" : "cursor-not-allowed"}`}
                          onChange={(e) => {
                            const formatted = formatTimeInput(e.target.value);
                            onInputChange(inputKey, formatted);
                          }}
                          onKeyPress={(e) => handleKeyPress(e, inputKey)}
                          disabled={!hasEditPermission}
                          readOnly={!hasEditPermission}
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
                <td
                  className={`${
                    res.average == "DNF" || res.average == "DNS"
                      ? "text-red-600"
                      : "text-black"
                  }`}
                >
                  {res.average}
                </td>
                <td
                  className={`${
                    res.best == "DNF" || res.best == "DNS"
                      ? "text-red-600"
                      : "text-black"
                  }`}
                >
                  {res.best}
                </td>
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
    </div>
  );
};

export default PersonCard;
