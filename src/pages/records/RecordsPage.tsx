import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import entityRecordSchema from "../../schemata/entity-record-schema.json";
import { Pagination } from "../../components/Pagination";

const PAGE_SIZE = 25;
const BASE_URL = "https://www.fema.gov/api/open/v1";

interface SchemaFieldDefinition {
  type: string;
  element: string;
  label?: string;
}

interface SchemaEntity {
  [fieldPath: string]: SchemaFieldDefinition;
}

function getFieldValue(record: Record<string, unknown>, fieldPath: string) {
  const segments = fieldPath.split(".");
  let current: unknown = record;

  for (const segment of segments) {
    if (current == null) {
      return undefined;
    }

    if (segment.includes("[")) {
      const [key, indexPart] = segment.split("[");
      const index = Number(indexPart.replace("]", ""));
      const container = current as Record<string, unknown>;
      const collection = container[key] as unknown[] | undefined;
      current = collection?.[index];
    } else {
      current = (current as Record<string, unknown>)[segment];
    }
  }

  return current;
}

function renderFieldValue(value: unknown, definition: SchemaFieldDefinition) {
  if (value == null || value === "") {
    return null;
  }

  if (definition.type === "html") {
    return <div dangerouslySetInnerHTML={{ __html: String(value) }} />;
  }

  return <span>{String(value)}</span>;
}

export function RecordsPage() {
  const { datasetName } = useParams<{ datasetName: string }>();
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const entitySchema = useMemo(() => {
    const schema = entityRecordSchema.entities as Record<string, SchemaEntity>;
    return schema[datasetName ?? ""];
  }, [datasetName]);

  useEffect(() => {
    if (!datasetName) {
      setError("No dataset selected.");
      setIsLoading(false);
      return;
    }

    async function fetchRecords() {
      try {
        setIsLoading(true);
        setError("");

        const skip = (page - 1) * PAGE_SIZE;
        const response = await fetch(`${BASE_URL}/${datasetName}?$top=${PAGE_SIZE}&$skip=${skip}`);

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = await response.json();
        setRecords(Array.isArray(data) ? data : data?.[datasetName] ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load records.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecords();
  }, [datasetName, page]);

  return (
    <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
      <Link to="/">Back to datasets</Link>
      <h1>{datasetName ?? "Records"}</h1>
      <p>Browsing records from the selected dataset.</p>

      {isLoading && <p>Loading records...</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {!isLoading && !error && records.length === 0 && <p>No records found.</p>}

      <Pagination currentPage={page} pageSize={PAGE_SIZE} totalItems={1000} onPageChange={setPage} />

      <div style={{ display: "grid", gap: "12px", marginBlock: "20px" }}>
        {records.map((record, index) => (
          <article key={`${record.id ?? index}`} style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "16px" }}>
            {entitySchema &&
              Object.entries(entitySchema).map(([fieldPath, definition]) => {
                const value = getFieldValue(record, fieldPath);
                const renderedValue = renderFieldValue(value, definition);

                if (!renderedValue) {
                  return null;
                }

                const content = (
                  <>
                    {definition.label && <strong>{definition.label}: </strong>}
                    {renderedValue}
                  </>
                );

                if (definition.element === "h3") {
                  return <h3 key={fieldPath}>{content}</h3>;
                }

                if (definition.element === "div") {
                  return <div key={fieldPath}>{content}</div>;
                }

                return <p key={fieldPath}>{content}</p>;
              })}
          </article>
        ))}
      </div>

      <Pagination currentPage={page} pageSize={PAGE_SIZE} totalItems={1000} onPageChange={setPage} />
    </main>
  );
}
