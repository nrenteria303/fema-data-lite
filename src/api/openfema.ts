import { type OpenFemaDatasetsResponse } from "./types";

const BASE_URL = "https://www.fema.gov/api/open/v1";

export async function getDatasets(): Promise<OpenFemaDatasetsResponse> {
  const response = await fetch(
    `${BASE_URL}/OpenFemaDataSets`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch datasets: ${response.status}`
    );
  }

  return response.json();
}