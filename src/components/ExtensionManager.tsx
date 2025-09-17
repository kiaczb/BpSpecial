// src/components/ExtensionManager.tsx
import { useState } from "react";
import { useAuth } from "../api/AuthContext";

const ExtensionManager = () => {
  const { fetchWithAuth, user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState("");

  const writeExtension = async () => {
    if (!user) {
      alert("You need to be logged in to update extensions");
      return;
    }

    setIsUpdating(true);
    setMessage("");

    try {
      const patchData = {
        extensions: [
          {
            id: "HungarianExtension.Test",
            specUrl: "https://example.com/hungarian-extension",
            data: {
              testData: {
                activityId: 2,
                description: "Test data " + new Date().toLocaleString(),
              },
            },
          },
        ],
      };

      const response = await fetchWithAuth(
        `https://www.worldcubeassociation.org/api/v0/competitions/BudapestSpecial2024/wcif`,
        {
          method: "PATCH",
          body: JSON.stringify(patchData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setMessage("Sikeresen írva az extensions-be!");
      console.log("Extension written successfully");
    } catch (error) {
      console.error("Error writing extension:", error);
      setMessage(`Hiba történt: ${error}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const readExtensions = async () => {
    if (!user) {
      alert("You need to be logged in to read extensions");
      return;
    }

    setIsUpdating(true);
    setMessage("");

    try {
      const response = await fetchWithAuth(
        `https://www.worldcubeassociation.org/api/v0/competitions/BudapestSpecial2024/wcif`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const wcif = await response.json();
      const extensions = wcif.extensions || [];

      if (extensions.length === 0) {
        setMessage("Nincsenek extensions a WCIF-ben.");
      } else {
        setMessage(`Extensions found: ${extensions.length}`);
        console.log("Extensions:", extensions);
      }
    } catch (error) {
      console.error("Error reading extensions:", error);
      setMessage(`Hiba történt: ${error}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-md mb-4">
      <h2 className="text-lg font-bold mb-2">Extension Kezelő</h2>
      <div className="flex space-x-2 mb-2">
        <button
          onClick={writeExtension}
          disabled={isUpdating}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
        >
          Extension Írása
        </button>
        <button
          onClick={readExtensions}
          disabled={isUpdating}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
        >
          Extension Olvasása
        </button>
      </div>
      {message && (
        <div
          className={`p-2 rounded ${
            message.includes("Hiba")
              ? "bg-red-100 text-red-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {message}
        </div>
      )}
      {isUpdating && <div className="text-blue-600 mt-2">Folyamatban...</div>}
    </div>
  );
};

export default ExtensionManager;
