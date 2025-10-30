import { useQuery } from "@tanstack/react-query";
import { getDiscards } from "@/actions/get-discards";

interface UseDiscardsParams {
  startDate?: Date;
  endDate?: Date;
  productName?: string;
  reason?: string;
}

export function useDiscards(params: UseDiscardsParams = {}) {
  return useQuery({
    queryKey: ["discards", params],
    queryFn: () => getDiscards(params),
  });
}

