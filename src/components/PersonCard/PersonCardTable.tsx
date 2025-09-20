import { generateInputKey, getMaxAttempts } from "../../utils/personCardUtils";
import type { Result } from "../../types";
import PersonCardInput from "./PersonCardInput";

interface PersonCardTableProps {
  id: number;
  results: Result[];
  hasEditPermission: boolean;
  modifiedValues: { [key: string]: string };
  extensionTimes: { [key: string]: number };
  getInputValue: (eventId: string, attemptIndex: number) => string;
  getDisplayTime: (
    eventId: string,
    attemptIndex: number,
    originalTime: string
  ) => string;
  onInputChange: (key: string, value: string) => void;
  handleInputKeyPress: (e: React.KeyboardEvent, key: string) => void;
  setInputRef: (key: string, el: HTMLInputElement | null) => void;
}

const PersonCardTable = ({
  id,
  results,
  hasEditPermission,
  modifiedValues,
  getInputValue,
  getDisplayTime,
  onInputChange,
  handleInputKeyPress,
  setInputRef,
}: PersonCardTableProps) => {
  const maxAttempts = getMaxAttempts(results);

  return (
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
                      <PersonCardInput
                        inputKey={inputKey}
                        value={inputValue}
                        placeholder={time}
                        isModified={isModified}
                        hasEditPermission={hasEditPermission}
                        onInputChange={onInputChange}
                        onKeyPress={handleInputKeyPress}
                        setInputRef={setInputRef}
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
  );
};

export default PersonCardTable;
