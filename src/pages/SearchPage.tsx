import { useMemo, useState } from "react";
import { DatasetCard } from "../components/DatasetCard";
import { SearchFilters } from "../components/SearchFilters";
import { type DatasetSearchFilters } from "../api/types";
import { useDatasets } from "../hooks/useDatasets";
import { type EntityRecordSchema } from "../api/types";
import entityRecordSchema from "../schemata/entity-record-schema.json";

const defaultFilters: DatasetSearchFilters = {
  keyword: "",
  theme: "",
  publisher: "",
  recordsAvailable: false,
};

export function SearchPage() {
  const { data, isLoading, error } = useDatasets();

  const [filters, setFilters] = useState<DatasetSearchFilters>(defaultFilters);

  const datasets = useMemo(() => data?.OpenFemaDataSets ?? [], [data?.OpenFemaDataSets]);

  const themes = useMemo(() => {
    return Array.from(
      new Set(
        datasets
          .map((dataset) => dataset.theme)
          .filter((theme): theme is string => Boolean(theme)),
      ),
    ).sort((left, right) => left.localeCompare(right));
  }, [datasets]);

  const publishers = useMemo(() => {
    return Array.from(
      new Set(
        datasets
          .map((dataset) => dataset.publisher)
          .filter((publisher): publisher is string => Boolean(publisher)),
      ),
    ).sort((left, right) => left.localeCompare(right));
  }, [datasets]);

  const filteredDatasets = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase();

    return datasets.filter((dataset) => {
      const matchesKeyword =
        !keyword ||
        [dataset.title, dataset.description, dataset.theme, dataset.publisher, dataset.name]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(keyword));

      const matchesTheme =
        !filters.theme || dataset.theme?.toLowerCase() === filters.theme.toLowerCase();

      const matchesPublisher =
        !filters.publisher ||
        dataset.publisher?.toLowerCase() === filters.publisher.toLowerCase();

      const recordsAvailable = () => {
        const schema = entityRecordSchema as EntityRecordSchema;
        return Boolean(schema.entities[dataset.name]);
      };
      const matchesRecordsAvailable = !filters.recordsAvailable || recordsAvailable();

      return matchesKeyword && matchesTheme && matchesPublisher && matchesRecordsAvailable;
    });
  }, [datasets, filters]);

  if (isLoading) {
    return <h1>Loading datasets...</h1>;
  }

  if (error) {
    return <h1>Error loading datasets.</h1>;
  }

  return (
    <main
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "24px",
      }}
    >
      <h1>FEMA Data Lite</h1>

      <p style={{ marginBottom: "16px" }}>
        Browse FEMA datasets available through OpenFEMA. Click on the dataset cards below to view more details, and even browse through their related records. 
      </p>

      <SearchFilters
        filters={filters}
        onChange={setFilters}
        themes={themes}
        publishers={publishers}
      />

      <p style={{ marginBottom: "16px" }}>
        Showing {filteredDatasets.length} of {datasets.length} datasets
      </p>

      {filteredDatasets.map((dataset) => (
        <DatasetCard key={dataset.id} dataset={dataset} />
      ))}
    </main>
  );
}
