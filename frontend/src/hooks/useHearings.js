import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/axios.js";

export function useHearings(params) {
  return useQuery({
    queryKey: ["hearings", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      Object.entries(params || {}).forEach(([key, value]) => {
        if (value != null && value !== "") searchParams.set(key, value);
      });
      const { data } = await api.get(`/api/hearings?${searchParams.toString()}`);
      // backend returns { hearings, total, ... }
      return data;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true
  });
}

