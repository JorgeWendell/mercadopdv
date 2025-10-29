import { useQuery } from "@tanstack/react-query";

import { getCurrentRole } from "@/actions/get-current-role";

export function getCurrentRoleQueryKey() {
  return ["current-role"] as const;
}

export function useCurrentRole() {
  return useQuery({
    queryKey: getCurrentRoleQueryKey(),
    queryFn: getCurrentRole,
  });
}


