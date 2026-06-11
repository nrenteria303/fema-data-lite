const BASE_URL = "https://www.fema.gov/api/open/v1";

export async function getDatasets() {
  const response = await fetch(
    `${BASE_URL}/OpenFemaDataSets`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch datasets");
  }

  return response.json();
}