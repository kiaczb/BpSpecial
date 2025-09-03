import type { PersonCardProps } from "../../types";
import { convertResult } from "../utils";
const PersonCard = ({
  id,
  name,
  results,
  remainingTime,
  usedTime,
}: PersonCardProps) => {
  // func for colums number
  const getMaxAttempts = () => {
    return Math.max(...results.map((res) => res.times.length), 5);
  };

  const maxAttempts = getMaxAttempts();

  return (
    <div className="bg-white rounded-lg px-6 py-2 border-1 shadow-xl border-gray-700 mx-0.5 dark:bg-sky-900/50 dark:text-gray-50">
      <div className="justify-items-center">
        <h2 className="text-lg font-bold mb-4 dark:text-white">
          ({id}) {name}
        </h2>
      </div>
      <div className="justify-items-stretch">
        <table className="table-auto text-sm w-full dark:text-gray-200">
          <thead className="text-center">
            <tr className="border-collapse border-b-1 border-gray-400">
              <th>Category</th>
              {/* Dynamic column generation */}
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
                {/* Dynamic attempt generation */}
                {res.times.map((time, i) => (
                  <td key={i} className="hidden sm:table-cell py-1">
                    {time != "DNF" ? (
                      time
                    ) : (
                      <>
                        <input
                          type="text"
                          placeholder="DNF"
                          maxLength={8}
                          className="w-15 text-center placeholder-red-600"
                        />
                      </>
                    )}
                  </td>
                ))}
                {/* Empty cells for missing attempts (-) */}
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
    </div>
  );
};

export default PersonCard;
