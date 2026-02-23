import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/axios.js";

export function useCauseListStatus(params) {
  return useQuery({
    queryKey: ["cause-list-status", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      Object.entries(params || {}).forEach(([key, value]) => {
        if (value != null && value !== "") searchParams.set(key, value);
      });
      const { data } = await api.get(
        `/api/cause-list-status?${searchParams.toString()}`
      );
      // assume data: { liveStatuses, count }
      return data;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true
  });
}

