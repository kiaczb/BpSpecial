import { formatTimeInput } from "../../utils/personCardUtils";
import type { PersonCardInputProps } from "../../types";

const PersonCardInput = ({
  inputKey,
  value,
  placeholder,
  isModified,
  hasEditPermission,
  onInputChange,
  onKeyPress,
  setInputRef,
}: PersonCardInputProps) => {
  return (
    <input
      ref={(el) => setInputRef(inputKey, el)}
      type="text"
      value={value}
      placeholder={placeholder}
      maxLength={8}
      className={`w-15 text-center placeholder-red-600 text-red-600 border-black border rounded dark:border-gray-400 dark:text-red-400 dark:placeholder-red-400  ${
        isModified ? "bg-yellow-100 dark:bg-slate-900/80" : "dark:bg-slate-800"
      } ${hasEditPermission ? "" : "cursor-not-allowed"}`}
      onChange={(e) => {
        const formatted = formatTimeInput(e.target.value);
        onInputChange(inputKey, formatted);
      }}
      onKeyPress={(e) => onKeyPress(e, inputKey)}
      disabled={!hasEditPermission}
      readOnly={!hasEditPermission}
    />
  );
};

export default PersonCardInput;
