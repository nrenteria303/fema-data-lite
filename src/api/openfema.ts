import { type OpenFemaDatasetsResponse } from "./types";

const BASE_URL = "https://www.fema.gov/api/open/v1";
const STORAGE_KEY = "OpenFemaDataSets";

export async function getDatasets(): Promise<OpenFemaDatasetsResponse> {
  if (typeof window !== "undefined") {
    const cachedData = window.sessionStorage.getItem(STORAGE_KEY);

    if (cachedData) {
      try {
        return JSON.parse(cachedData) as OpenFemaDatasetsResponse;
      } catch {
        window.sessionStorage.removeItem(STORAGE_KEY);
      }
    }
  }

  const response = await fetch(`${BASE_URL}/OpenFemaDataSets`);

  if (!response.ok) {
    throw new Error(`Failed to fetch datasets: ${response.status}`);
  }

  const data = (await response.json()) as OpenFemaDatasetsResponse;

  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  return data;
}