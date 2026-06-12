import { type DatasetSearchFilters } from "../api/types";

interface SearchFiltersProps {
  filters: DatasetSearchFilters;
  onChange: (filters: DatasetSearchFilters) => void;
  themes: string[];
  publishers: string[];
}

export function SearchFilters({
  filters,
  onChange,
  themes,
  publishers,
}: SearchFiltersProps) {
  const updateFilter = <K extends keyof DatasetSearchFilters>(
    key: K,
    value: DatasetSearchFilters[K],
  ) => {
    onChange({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    onChange({
      keyword: "",
      theme: "",
      publisher: "",
      apiOnly: false,
    });
  };

  return (
    <section
      style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "16px",
        marginBottom: "24px",
        display: "grid",
        gap: "12px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>Filter datasets</h2>
        <button type="button" onClick={resetFilters}>
          Clear filters
        </button>
      </div>

      <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span>Keyword</span>
          <input
            type="text"
            placeholder="Search title, description, or theme"
            value={filters.keyword}
            onChange={(event) => updateFilter("keyword", event.target.value)}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span>Theme</span>
          <select
            value={filters.theme}
            onChange={(event) => updateFilter("theme", event.target.value)}
          >
            <option value="">All themes</option>
            {themes.map((theme) => (
              <option key={theme} value={theme}>
                {theme}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span>Publisher</span>
          <select
            value={filters.publisher}
            onChange={(event) => updateFilter("publisher", event.target.value)}
          >
            <option value="">All publishers</option>
            {publishers.map((publisher) => (
              <option key={publisher} value={publisher}>
                {publisher}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <input
          type="checkbox"
          checked={filters.apiOnly}
          onChange={(event) => updateFilter("apiOnly", event.target.checked)}
        />
        <span>Show API-accessible datasets only</span>
      </label>
    </section>
  );
}