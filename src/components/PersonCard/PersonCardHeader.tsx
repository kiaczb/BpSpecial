import type { CSSProperties } from "react";
import { BeatLoader } from "react-spinners";
import type { PersonCardHeaderProps } from "../../types";

const PersonCardHeader = ({
  id,
  name,
  hasEditPermission,
  isUpdating,
  hasUncommittedChanges,
  saveAllChanges,
  handleSaveKeyPress,
  saveButtonRef,
}: PersonCardHeaderProps) => {
  const override: CSSProperties = {
    display: "block",
    margin: "0 auto",
  };

  return (
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
  );
};

export default PersonCardHeader;
