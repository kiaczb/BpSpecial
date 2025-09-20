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
import { toast, Slide } from "react-toastify";

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

  const competitionId = import.meta.env.VITE_SELECTED_COMPETITION;
  const hasEditPermission = useEditPermission(competitionId);
  const { modifiedValues, handleInputChange, setInputRef, inputRefs } =
    useInputManagement();

  const saveButtonRef = useRef<HTMLButtonElement>(null);

  const onInputChange = (key: string, value: string) => {
    const formatted = formatTimeInput(value);

    if (formatted === "0" || formatted === "0.00" || formatted === "") {
      handleInputChange(key, "");
    } else {
      handleInputChange(key, formatted);
    }

    setHasUncommittedChanges(true);
  };

  const { getWcif, updateWcifExtensions } = useWcifService();

  useEffect(() => {
    if (shouldFocus && hasEditPermission) {
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

  const extensionTimes = useMemo(() => {
    const times: { [key: string]: number } = {};

    const personExtension = extensions.find(
      (ext) => ext.id === `budapestSpecial.times.person.${id}`
    );

    if (!personExtension) return times;

    personExtension.data.modifiedAttempts.forEach((attempt: any) => {
      const key = generateInputKey(id, attempt.eventId, attempt.attemptIndex);
      times[key] = parseInt(attempt.newValue, 10);
    });

    return times;
  }, [extensions, id]);

  const { remainingTime, usedTime } = useMemo(() => {
    let totalUsedTime = initialUsedTime;
    let totalRemainingTime = initialRemainingTime;

    Object.values(extensionTimes).forEach((centiseconds) => {
      if (centiseconds > 0) {
        totalRemainingTime -= centiseconds;
        totalUsedTime += centiseconds;
      }
    });

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

  const getInputValue = (eventId: string, attemptIndex: number): string => {
    const modifiedKey = generateInputKey(id, eventId, attemptIndex);

    if (modifiedValues[modifiedKey] !== undefined) {
      return modifiedValues[modifiedKey];
    }

    if (extensionTimes[modifiedKey] !== undefined) {
      const centiseconds = extensionTimes[modifiedKey];
      const converted = convertResult(centiseconds, eventId);
      if (converted !== "DNF" && converted !== "DNS") {
        return converted;
      }
    }

    return "";
  };

  const getDisplayTime = (
    eventId: string,
    attemptIndex: number,
    originalTime: string
  ): string => {
    const inputValue = getInputValue(eventId, attemptIndex);
    if (inputValue) return inputValue;
    return originalTime;
  };

  const handleInputKeyPress = (e: React.KeyboardEvent, key: string): void => {
    if (e.key === "Enter") {
      e.preventDefault();

      const keys = Object.keys(inputRefs);
      const currentIndex = keys.indexOf(key);

      if (currentIndex < keys.length - 1) {
        const nextKey = keys[currentIndex + 1];
        const nextInput = inputRefs[nextKey];
        if (nextInput) {
          nextInput.focus();
          nextInput.select();
        }
      } else {
        saveButtonRef.current?.focus();
      }
    }
  };

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
      const wcif = await getWcif(competitionId);
      const existingExtensions = wcif.extensions || [];

      const existingPersonExtension = existingExtensions.find(
        (ext: any) => ext.id === `budapestSpecial.times.person.${id}`
      );

      const existingModifiedAttempts = existingPersonExtension
        ? existingPersonExtension.data.modifiedAttempts
        : [];

      const updatedModifiedAttempts = [...existingModifiedAttempts];

      for (const [key, formattedValue] of Object.entries(modifiedValues)) {
        const match = key.match(/pid-(\d+)-evt-(\w+)-att-(\d+)/);
        if (!match) continue;

        const eventId = match[2];
        const attemptIndex = parseInt(match[3]);
        const centiseconds = formattedTimeToCentiseconds(formattedValue);

        const existingIndex = updatedModifiedAttempts.findIndex(
          (attempt: any) =>
            attempt.eventId === eventId && attempt.attemptIndex === attemptIndex
        );

        if (existingIndex !== -1) {
          updatedModifiedAttempts[existingIndex] = {
            ...updatedModifiedAttempts[existingIndex],
            newValue: centiseconds.toString(),
          };
        } else {
          updatedModifiedAttempts.push({
            eventId,
            roundId: `${eventId}-r1`,
            attemptIndex,
            newValue: centiseconds.toString(),
          });
        }
      }

      const personExtension = {
        id: `budapestSpecial.times.person.${id}`,
        specUrl: "https://example.com/hungarian-person-times-extension",
        data: {
          personId: id,
          personName: name,
          modifiedAttempts: updatedModifiedAttempts,
        },
      };

      const filteredExtensions = existingExtensions.filter(
        (ext: any) => ext.id !== `budapestSpecial.times.person.${id}`
      );

      const updatedExtensions = [...filteredExtensions, personExtension];
      await updateWcifExtensions(competitionId, updatedExtensions);

      console.log("Saved person data succesfully");

      toast.success("Saved succesfully!", {
        position: "top-center",
        autoClose: 1200,
        hideProgressBar: true,
        closeOnClick: false,
        pauseOnHover: false,
        draggable: false,
        progress: undefined,
        theme: "light",
        transition: Slide,
      });
      setHasUncommittedChanges(false);

      onSaveComplete?.();
    } catch (error) {
      console.error("Error during save:", error);

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
          transition: Slide,
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
