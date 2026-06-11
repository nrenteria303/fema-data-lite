import { useQuery } from "@tanstack/react-query";
import { getDatasets } from "../api/openfema";

export function useDatasets() {
  return useQuery({
    queryKey: ["datasets"],
    queryFn: getDatasets,
  });
}