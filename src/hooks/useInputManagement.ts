// src/hooks/useInputManagement.ts
import { useState, useRef, useCallback } from "react";
import type { InputManagementReturn } from "../types";

export const useInputManagement = (): InputManagementReturn => {
  const [modifiedValues, setModifiedValues] = useState<{
    [key: string]: string;
  }>({});
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handleInputChange = useCallback((key: string, value: string): void => {
    setModifiedValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setInputRef = useCallback(
    (key: string, el: HTMLInputElement | null): void => {
      inputRefs.current[key] = el;
    },
    []
  );

  const focusNextInput = useCallback((currentKey: string): void => {
    const keys = Object.keys(inputRefs.current);
    const currentIndex = keys.indexOf(currentKey);

    if (currentIndex < keys.length - 1) {
      const nextKey = keys[currentIndex + 1];
      const nextInput = inputRefs.current[nextKey];
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    }
  }, []);

  return {
    modifiedValues,
    handleInputChange,
    setInputRef,
    focusNextInput,
    inputRefs: inputRefs.current,
  };
};
