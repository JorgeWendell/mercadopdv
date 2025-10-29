import { useQuery } from "@tanstack/react-query";

import { getUsers, GetUsersParams } from "@/actions/get-users";

export function getUsersQueryKey(params?: GetUsersParams) {
  return ["users", params ?? {}] as const;
}

export function useUsers(params?: GetUsersParams) {
  return useQuery({
    queryKey: getUsersQueryKey(params),
    queryFn: () => getUsers(params),
  });
}


