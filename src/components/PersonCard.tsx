import type { PersonCardProps, Extension } from "../types";
import {
  formatTimeInput,
  convertResult,
  formattedTimeToCentiseconds,
} from "../utils/personCardUtils";
import { useAuth } from "../context/AuthContext";
import { useState, useMemo, useEffect, useRef } from "react";

// Hooks
import { useEditPermission } from "../hooks/useEditPermissions";
import { useInputManagement } from "../hooks/useInputManagement";

// Services
import { useWcifService } from "../services/wcifService";

// Utils
import { getMaxAttempts, generateInputKey } from "../utils/personCardUtils";

import type { CSSProperties } from "react";
import { BeatLoader } from "react-spinners";

// Extend the PersonCardProps interface locally
interface ExtendedPersonCardProps extends PersonCardProps {
  extensions?: Extension[];
  extensionsLoading?: boolean;
  shouldFocus?: boolean;
  onFocusComplete?: () => void;
}

const PersonCard = ({
  id,
  name,
  results,
  remainingTime: initialRemainingTime,
  usedTime: initialUsedTime,
  extensions = [],
  shouldFocus = false,
  onFocusComplete,
}: ExtendedPersonCardProps) => {
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasUncommittedChanges, setHasUncommittedChanges] = useState(false);

  const competitionId = "BudapestSpecial2024";
  const hasEditPermission = useEditPermission(competitionId);
  const { modifiedValues, handleInputChange, setInputRef, inputRefs } =
    useInputManagement();

  const saveButtonRef = useRef<HTMLButtonElement>(null);

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

  // Fókusz az első inputra, ha kell
  useEffect(() => {
    if (shouldFocus && hasEditPermission) {
      // Megkeressük az első DNF attempt-et
      const firstDnfAttempt = results.flatMap((res) =>
        res.times
          .map((time, timeIndex) => ({ res, time, timeIndex }))
          .filter(({ time }) => time === "DNF")
          .map(({ res, timeIndex }) => ({
            eventId: res.categoryId,
            attemptIndex: timeIndex,
          }))
      )[0];

      if (firstDnfAttempt) {
        const firstInputKey = generateInputKey(
          id,
          firstDnfAttempt.eventId,
          firstDnfAttempt.attemptIndex
        );
        const inputElement = inputRefs[firstInputKey];

        if (inputElement) {
          setTimeout(() => {
            inputElement.focus();
            inputElement.select();
            onFocusComplete?.();
          }, 100);
        } else {
          onFocusComplete?.();
        }
      } else {
        onFocusComplete?.();
      }
    }
  }, [shouldFocus, hasEditPermission, results, id, onFocusComplete, inputRefs]);

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

  // Input kezelés módosítása - Enterrel Save gombra ugrás
  const handleInputKeyPress = (e: React.KeyboardEvent, key: string): void => {
    if (e.key === "Enter") {
      e.preventDefault();

      const keys = Object.keys(inputRefs);
      const currentIndex = keys.indexOf(key);

      if (currentIndex < keys.length - 1) {
        // Következő input
        const nextKey = keys[currentIndex + 1];
        const nextInput = inputRefs[nextKey];
        if (nextInput) {
          nextInput.focus();
          nextInput.select();
        }
      } else {
        // Utolsó inputnál Save gombra ugrás
        saveButtonRef.current?.focus();
      }
    }
  };

  // Save gomb Enter kezelése
  const handleSaveKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isUpdating && hasUncommittedChanges) {
      e.preventDefault();
      saveAllChanges();
    }
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

  const override: CSSProperties = {
    display: "block",
    margin: "0 auto",
  };

  return (
    <div className="bg-white rounded-lg px-6 py-2 border-1 shadow-xl border-gray-700 mx-0.5 dark:bg-slate-800 dark:border-slate-600 dark:text-gray-100">
      {/* Fejléc rész */}
      <div className="flex items-center justify-center mb-4 relative">
        <h2 className="text-lg font-bold text-center dark:text-white">
          ({id}) {name}
        </h2>

        {hasEditPermission && (
          <button
            ref={saveButtonRef}
            onClick={saveAllChanges}
            onKeyPress={handleSaveKeyPress}
            disabled={isUpdating || !hasUncommittedChanges}
            hidden={!hasUncommittedChanges && !isUpdating}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-4 rounded text-l disabled:bg-gray-600 disabled:cursor-not-allowed absolute right-0 flex items-center justify-center min-w-[80px] dark:bg-green-700 dark:hover:bg-green-600 dark:disabled:bg-slate-700"
            tabIndex={hasUncommittedChanges || isUpdating ? 0 : -1}
          >
            {isUpdating ? (
              <BeatLoader size={8} color="#ffffff" cssOverride={override} />
            ) : (
              "Save"
            )}
          </button>
        )}
      </div>

      <div className="justify-items-stretch">
        <table className="table-auto text-sm w-full dark:text-gray-200">
          <thead className="text-center">
            <tr className="border-collapse border-b-1 border-gray-400 dark:border-slate-600">
              <th className="dark:text-gray-300">Category</th>
              {Array.from({ length: maxAttempts }, (_, i) => (
                <th key={i} className="hidden sm:table-cell dark:text-gray-300">
                  {i + 1}
                </th>
              ))}
              <th className="dark:text-gray-300">Average</th>
              <th className="dark:text-gray-300">Best</th>
            </tr>
          </thead>
          <tbody className="text-center font-bold">
            {results.map((res, idx) => (
              <tr
                key={idx}
                className="border-collapse border-b-1 border-gray-400 dark:border-slate-600"
              >
                <td className="py-1">
                  <span
                    className={`cubing-icon event-${res.categoryId} text-2xl dark:text-white`}
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
                      className={`text-[14.5px] hidden sm:table-cell py-1 ${
                        isDNF || isDNS
                          ? "text-red-500 dark:text-red-400"
                          : "text-black dark:text-gray-100"
                      }`}
                    >
                      {!isDNF || !hasEditPermission ? (
                        displayTime
                      ) : (
                        <input
                          ref={(el) => setInputRef(inputKey, el)}
                          type="text"
                          value={inputValue}
                          placeholder={time}
                          maxLength={8}
                          className={`w-15 text-center placeholder-red-600 text-red-600 border-black border rounded dark:border-gray-400 dark:text-red-400 dark:placeholder-red-400  ${
                            isModified
                              ? "bg-yellow-100 dark:bg-slate-900/80"
                              : "dark:bg-slate-800"
                          } ${hasEditPermission ? "" : "cursor-not-allowed"}`}
                          onChange={(e) => {
                            const formatted = formatTimeInput(e.target.value);
                            onInputChange(inputKey, formatted);
                          }}
                          onKeyPress={(e) => handleInputKeyPress(e, inputKey)}
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
                      className="hidden sm:table-cell py-1 dark:text-gray-400"
                    >
                      -
                    </td>
                  )
                )}
                <td
                  className={`text-[14.5px] ${
                    res.average == "DNF" || res.average == "DNS"
                      ? "text-red-600 dark:text-red-400"
                      : "text-black dark:text-gray-100"
                  }`}
                >
                  {res.average}
                </td>
                <td
                  className={`text-[14.5px] ${
                    res.best == "DNF" || res.best == "DNS"
                      ? "text-red-600 dark:text-red-400"
                      : "text-black dark:text-gray-100"
                  }`}
                >
                  {res.best}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Idők rész */}
      <div className="justify-items-stretch mt-3">
        <table className="table-auto w-full">
          <thead className="text-center">
            <tr>
              <th className="dark:text-gray-300">Remaining</th>
              <th className="dark:text-gray-300">Used</th>
            </tr>
          </thead>
          <tbody className="text-center">
            <tr>
              <td className="dark:text-gray-100">
                {convertResult(remainingTime)}
              </td>
              <td className="dark:text-gray-100">{convertResult(usedTime)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PersonCard;
