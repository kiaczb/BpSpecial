import { useState, useRef } from "react";
import type { InputManagementReturn } from "../types";

export const useInputManagement = (): InputManagementReturn => {
  const [modifiedValues, setModifiedValues] = useState<{
    [key: string]: string;
  }>({});
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handleInputChange = (key: string, value: string): void => {
    setModifiedValues((prev) => ({ ...prev, [key]: value }));
  };

  const focusNextInput = (currentKey: string): void => {
    const keys = Object.keys(inputRefs.current);
    const currentIndex = keys.indexOf(currentKey);

    if (currentIndex < keys.length - 1) {
      const nextKey = keys[currentIndex + 1];
      inputRefs.current[nextKey]?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, key: string): void => {
    if (e.key === "Enter") {
      e.preventDefault();
      focusNextInput(key);
    }
  };

  const setInputRef = (key: string, el: HTMLInputElement | null): void => {
    inputRefs.current[key] = el;
  };

  return {
    modifiedValues,
    handleInputChange,
    handleKeyPress,
    setInputRef,
    focusNextInput,
  };
};
