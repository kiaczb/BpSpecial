// src/components/PersonCard.tsx
import type { PersonCardProps } from "../../types";
import { convertResult } from "../utils";
import { useAuth } from "../api/AuthContext";
import { useState } from "react";

const PersonCard = ({
  id,
  name,
  results,
  remainingTime,
  usedTime,
}: PersonCardProps) => {
  const { fetchWithAuth, user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  const getMaxAttempts = () => {
    return Math.max(...results.map((res) => res.times.length), 5);
  };

  const maxAttempts = getMaxAttempts();

  const handleTimeUpdate = async (
    personId: number,
    personName: string,
    eventId: string,
    roundId: string,
    attemptIndex: number,
    newValue: string
  ) => {
    if (!user) {
      alert("Be kell jelentkezned az eredmények módosításához");
      return;
    }

    if (!newValue.trim()) {
      return; // Nem változott vagy üres érték
    }

    setIsUpdating(true);

    try {
      // Először lekérjük a jelenlegi WCIF-et
      const response = await fetchWithAuth(
        `https://www.worldcubeassociation.org/api/v0/competitions/BudapestSpecial2024/wcif`
      );

      if (!response.ok) {
        throw new Error(`HTTP hiba a WCIF lekérésnél: ${response.status}`);
      }

      const wcif = await response.json();

      // Készítsük el az extension adatot a megfelelő formátumban
      const extensionId = `hungarian.time.${personId}.${eventId}.${attemptIndex}`;

      // Megnézzük, van-e már extension, ha igen, azt frissítjük
      const existingExtensions = wcif.extensions || [];
      const existingExtensionIndex = existingExtensions.findIndex(
        (ext: any) => ext.id === extensionId
      );

      const newExtension = {
        id: extensionId,
        specUrl: "https://example.com/hungarian-time-extension",
        data: {
          personId,
          personName,
          eventId,
          roundId,
          attemptIndex,
          newValue,
          updatedAt: new Date().toISOString(),
        },
      };

      if (existingExtensionIndex >= 0) {
        // Frissítjük a meglévő extensiont
        existingExtensions[existingExtensionIndex] = newExtension;
      } else {
        // Új extensiont adunk hozzá
        existingExtensions.push(newExtension);
      }

      // Küldjük el a PATCH kérést CSAK az extensions mezővel
      const patchResponse = await fetchWithAuth(
        `https://www.worldcubeassociation.org/api/v0/competitions/BudapestSpecial2024/wcif`,
        {
          method: "PATCH",
          body: JSON.stringify({ extensions: existingExtensions }),
        }
      );

      if (!patchResponse.ok) {
        const errorText = await patchResponse.text();
        console.error("Patch response error:", errorText);
        throw new Error(`HTTP hiba a frissítésnél: ${patchResponse.status}`);
      }

      console.log("Idő frissítve extensionként");
      alert("Idő sikeresen frissítve!");
    } catch (error) {
      console.error("Hiba az idő frissítésekor:", error);
      alert(`Hiba történt: ${error}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg px-6 py-2 border-1 shadow-xl border-gray-700 mx-0.5 dark:bg-sky-900/50 dark:text-gray-50">
      <div className="justify-items-center">
        <h2 className="text-lg font-bold mb-4 text-center dark:text-white">
          ({id}) {name}
        </h2>
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
                {res.times.map((time, i) => (
                  <td key={i} className="hidden sm:table-cell py-1">
                    {time !== "DNF" && time !== "DNS" ? (
                      time
                    ) : (
                      <input
                        type="text"
                        placeholder={time}
                        maxLength={8}
                        className="w-15 text-center placeholder-red-600 border rounded"
                        disabled={isUpdating}
                        onBlur={(e) => {
                          const val = e.target.value.trim();
                          if (val) {
                            handleTimeUpdate(
                              id,
                              name,
                              res.categoryId,
                              `${res.categoryId}-r1`,
                              i,
                              time
                            );
                          }
                        }}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.currentTarget.blur();
                          }
                        }}
                      />
                    )}
                  </td>
                ))}
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
