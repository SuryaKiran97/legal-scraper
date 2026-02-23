import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/axios.js";

export function useScrapeLogs(limit = 50) {
  return useQuery({
    queryKey: ["scrape-logs", limit],
    queryFn: async () => {
      const { data } = await api.get(`/api/scrape-logs?limit=${limit}`);
      return data;
    },
    staleTime: 0,
    refetchInterval: 10000
  });
}

