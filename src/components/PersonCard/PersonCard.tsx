import type { ExtendedPersonCardProps } from "../../types";
import {
  formatTimeInput,
  convertResult,
  formattedTimeToCentiseconds,
} from "../../utils/personCardUtils";
import { useAuth } from "../../context/AuthContext";
import { useState, useMemo, useEffect, useRef } from "react";

// Hooks
import { useEditPermission } from "../../hooks/useEditPermissions";
import { useInputManagement } from "../../hooks/useInputManagement";

// Services
import { useWcifService } from "../../services/wcifService";

// Utils
import { generateInputKey } from "../../utils/personCardUtils";

// Components
import PersonCardHeader from "./PersonCardHeader";
import PersonCardTable from "./PersonCardTable";
import PersonCardTimeSummary from "./PersonCardTimeSummary";
import { toast, Bounce } from "react-toastify";

const PersonCard = ({
  id,
  name,
  results,
  remainingTime: initialRemainingTime,
  usedTime: initialUsedTime,
  extensions = [],
  shouldFocus = false,
  onFocusComplete,
  onSaveComplete,
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

      console.log("Saved person data succesfully");
      //alert("Modifications saved");

      toast.success("Saved succesfully!", {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: false,
        pauseOnHover: false,
        draggable: false,
        progress: undefined,
        theme: "light",
        transition: Bounce,
      });
      setHasUncommittedChanges(false);

      onSaveComplete?.();
    } catch (error) {
      console.error("Error during save:", error);
      //alert(`Error: ${error}`);
      toast.error(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        {
          position: "top-center",
          autoClose: 2000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
          transition: Bounce,
        }
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg px-6 py-2 border-1 shadow-xl border-gray-700 mx-0.5 dark:bg-slate-800 dark:border-slate-600 dark:text-gray-100">
      <PersonCardHeader
        id={id}
        name={name}
        hasEditPermission={hasEditPermission}
        isUpdating={isUpdating}
        hasUncommittedChanges={hasUncommittedChanges}
        saveAllChanges={saveAllChanges}
        handleSaveKeyPress={handleSaveKeyPress}
        saveButtonRef={saveButtonRef}
      />

      <PersonCardTable
        id={id}
        results={results}
        hasEditPermission={hasEditPermission}
        modifiedValues={modifiedValues}
        extensionTimes={extensionTimes}
        getInputValue={getInputValue}
        getDisplayTime={getDisplayTime}
        onInputChange={onInputChange}
        handleInputKeyPress={handleInputKeyPress}
        setInputRef={setInputRef}
      />

      <PersonCardTimeSummary
        remainingTime={remainingTime}
        usedTime={usedTime}
      />
    </div>
  );
};

export default PersonCard;
