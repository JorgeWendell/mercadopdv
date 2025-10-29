import { useQuery } from "@tanstack/react-query";

import { getPaymentMethods } from "@/actions/get-payment-methods";

export function getPaymentMethodsQueryKey() {
  return ["payment-methods"] as const;
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: getPaymentMethodsQueryKey(),
    queryFn: getPaymentMethods,
  });
}

