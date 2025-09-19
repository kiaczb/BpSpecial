import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import type { CompetitionRole } from "../types";

export const useEditPermission = (competitionId: string): boolean => {
  const { userRoles } = useAuth();
  const [hasEditPermission, setHasEditPermission] = useState(false);

  useEffect(() => {
    const competitionRole = userRoles.find(
      (role: CompetitionRole) => role.competitionId === competitionId
    );
    const canEdit = competitionRole?.isDelegate || competitionRole?.isOrganizer;
    setHasEditPermission(!!canEdit);
  }, [userRoles, competitionId]);

  return hasEditPermission;
};
