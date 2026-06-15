import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import type { OpenFemaDataset, SchemaFieldDefinition } from "../../api/types";
import entityRecordSchema from "../../schemata/entity-record-schema.json";
import { Pagination } from "../../components/Pagination";

import "./RecordsPage.css";

const PAGE_SIZE = 25;
const BASE_URL = "https://www.fema.gov/api/open";

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

function getFieldValueWithFallback(record: Record<string, unknown>, fieldPath: string, fallbackPaths?: string) {
  const primaryValue = getFieldValue(record, fieldPath);

  if (primaryValue != null && primaryValue !== "") {
    return primaryValue;
  }

  if (!fallbackPaths) {
    return primaryValue;
  }

  for (const fallbackPath of fallbackPaths.split("|")) {
    const fallbackValue = getFieldValue(record, fallbackPath.trim());

    if (fallbackValue != null && fallbackValue !== "") {
      return fallbackValue;
    }
  }

  return primaryValue;
}

function getPayloadRecords(data: unknown, datasetName?: string, webService?: string) {
  if (Array.isArray(data)) {
    return data;
  }

  if (!data || typeof data !== "object") {
    return [];
  }

  const recordPayload = data as Record<string, unknown>;

  if (datasetName && Array.isArray(recordPayload[datasetName])) {
    return recordPayload[datasetName] as Record<string, unknown>[];
  }

  if (webService) {
    const endpointName = webService.split("/").filter(Boolean).pop();

    if (endpointName && Array.isArray(recordPayload[endpointName])) {
      return recordPayload[endpointName] as Record<string, unknown>[];
    }
  }

  return [];
}

function renderFieldValue(value: unknown, definition: SchemaFieldDefinition) {
  if (value == null || value === "") {
    return null;
  }

  if (definition.type === "html") {
    return <div dangerouslySetInnerHTML={{ __html: String(value) }} />;
  }

  if (definition.type === "iso" && typeof value === "string" && definition.format) {
    const date = new Date(value);

    if (!Number.isNaN(date.getTime())) {
      const formatters = definition.format
        .split(" ")
        .map((segment) => segment.trim())
        .filter(Boolean);

      const parts = formatters.map((formatter) => {
        const [methodName, ...args] = formatter.split("(");
        const normalizedArgs = args.join("(")
          .replace(/\)$/, "")
          .split(",")
          .map((arg) => arg.trim())
          .filter(Boolean);

        if (methodName === "toLocaleDateString") {
          return date.toLocaleDateString(normalizedArgs[0] ?? "en-US");
        }

        if (methodName === "toLocaleTimeString") {
          return date.toLocaleTimeString(normalizedArgs[0] ?? "en-US");
        }

        return "";
      });

      return <span>{parts.join(" ")}</span>;
    }
  }

  return <span>{String(value)}</span>;
}

export function RecordsPage() {
  const { datasetName } = useParams<{ datasetName: string }>();
  const location = useLocation();
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const dataset = useMemo(() => {
    return (location.state as { dataset?: OpenFemaDataset } | null)?.dataset;
  }, [location.state]);

  const entitySchema = useMemo(() => {
    const schema = entityRecordSchema.entities as Record<string, SchemaEntity>;
    return schema[datasetName ?? ""];
  }, [datasetName]);

  useEffect(() => {
    if (!datasetName) {
      return;
    }

    async function fetchRecords() {
      try {
        setIsLoading(true);
        setError("");

        const skip = (page - 1) * PAGE_SIZE;
        const requestUrl = dataset?.webService
          ? `${dataset.webService}?$top=${PAGE_SIZE}&$skip=${skip}`
          : `${BASE_URL}/v1/${datasetName}?$top=${PAGE_SIZE}&$skip=${skip}`;
        const response = await fetch(requestUrl);

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = await response.json();
        const payload = getPayloadRecords(data, datasetName, dataset?.webService);
        setRecords(Array.isArray(payload) ? payload : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load records.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecords();
  }, [datasetName, dataset?.webService, page]);

  return (
    <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
      <Link to={`/datasets/${datasetName}`}>Back to dataset</Link>
      <h1>{dataset?.title ?? "Records"}</h1>
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
                const value = getFieldValueWithFallback(record, fieldPath, definition.useIfNull);
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
