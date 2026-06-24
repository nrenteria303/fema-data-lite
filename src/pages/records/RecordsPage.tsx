import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import type {
  OpenFemaDataset,
  SchemaEntity,
} from "../../api/types";
import entityRecordSchema from "../../schemata/entity-record-schema.json";
import { Pagination } from "../../components/Pagination";

import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { Polygon } from "../../components/Polygon";

// Functions used to parse and output data in records results
import {
  calculateZoom,
  setCenterPoint,
  buildMapRegionPaths,
  renderFieldValue,
  getFieldValueWithFallback
} from "../../utilities/recordsFunctions";

import "./RecordsPage.css";

const PAGE_SIZE = 25;
const BASE_URL = "https://www.fema.gov/api/open";

function getPayloadRecords(
  data: unknown,
  datasetName?: string,
  webService?: string,
) {
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

export function RecordsPage() {
  const { datasetName } = useParams<{ datasetName: string }>();
  const location = useLocation();
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const apiKey = import.meta.env.VITE_GMAPS_API_KEY;
  
  const dataset = useMemo(() => {
    return (location.state as { dataset?: OpenFemaDataset } | null)?.dataset;
  }, [location.state]);
        
  const recordCount = dataset?.recordCount;

  const [page, setPage] = useState(1);

  const handlePageChange = (value: number) => {
    const val = Number(value);
    if (isNaN(val) || !recordCount) {
      setPage(1);
      return;
    } else {
      const totalPages = Math.max(1, Math.ceil(recordCount / PAGE_SIZE));
      if (val < 1) setPage(1);
      else if (val > totalPages) setPage(totalPages);
      else setPage(val);
    }
  }
    
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
        const payload = getPayloadRecords(
          data,
          datasetName,
          dataset?.webService,
        );
        setRecords(Array.isArray(payload) ? payload : []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load records.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecords();
  }, [datasetName, dataset?.webService, page]);

  const containerClasses = useMemo(() => {
    let str = "records-container";
    if (isLoading) str += " records-container--loading";
    return str;
  }, [isLoading]);

  return (
    <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
      <Link to={`/datasets/${datasetName}`}>Back to dataset</Link>
      <h1>{dataset?.title ?? "Records"}</h1>
      <p>Browsing records from the selected dataset.</p>
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {!isLoading && !error && records.length === 0 && <p>No records found.</p>}

      <Pagination
        currentPage={page}
        pageSize={PAGE_SIZE}
        totalItems={recordCount || 0}
        isLoading={isLoading}
        inputId="1"
        onPageChange={handlePageChange}
      />

      <section className={containerClasses}>
        {isLoading && (
          <div className="records-loader" aria-live="polite">
            <span>Loading records...</span>
            <div className="records-loader__anim"></div>
          </div>
        )}
        <div className="records-list">
          {records.map((record, index) => (
            <article
              key={`${record.id ?? index}`}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "16px",
              }}
            >
              {entitySchema &&
                Object.entries(entitySchema).map(([fieldPath, definition]) => {
                  if (definition.type === "mapRegion") {
                    return null;
                  }

                  const value = getFieldValueWithFallback(
                    record,
                    fieldPath,
                    definition.useIfNull,
                  );
                  const renderedValue = renderFieldValue(value, definition);

                  if (!renderedValue) {
                    return null;
                  }

                  const content = (
                    <>
                      {definition.label && (
                        <strong>{definition.label}: </strong>
                      )}
                      {renderedValue}
                    </>
                  );

                  if (definition.element === "h3") {
                    return <h3 key={fieldPath}>{content}</h3>;
                  }

                  if (definition.element === "div") {
                    return <div key={fieldPath}>{content}</div>;
                  }

                  if (definition.element === "ul") {
                    return (
                      <div key={fieldPath}>
                        {definition.label && (
                          <strong>{definition.label}:</strong>
                        )}
                        {renderedValue}
                      </div>
                    );
                  }

                  return <p key={fieldPath}>{content}</p>;
                })}

              {entitySchema &&
                Object.entries(entitySchema)
                  .filter(([, definition]) => definition.type === "mapRegion")
                  .map(([fieldPath, definition]) => {
                    const polygons = buildMapRegionPaths(
                      record,
                      fieldPath,
                      definition,
                    );

                    // If Polygon coordinates in record data are null but a centerPoint exists as a fallback,
                    // we render centerpoint as an AdvancedMarker
                    if (
                      polygons.length === 1 && 
                      Array.isArray(polygons[0]) && 
                      polygons[0].length == 1 && 
                      Array.isArray(polygons[0]) && 
                      polygons[0][0].lat && 
                      polygons[0][0].lng
                    ) {
                      // console.log("centerPoint polygons value:", polygons)
                      const centerPoint = polygons[0][0];
                      const mapId:string = typeof record.id == "string" ? record.id : (Array.isArray(record.id) && typeof record.id[0] == "string") ? record.id[0] : "map-id";
                      return (
                        <div
                          key={`${fieldPath}-map`}
                          style={{
                            width: "100%",
                            minHeight: 320,
                            marginTop: 16,
                            border: "1px solid #ddd",
                            borderRadius: 8,
                            overflow: "hidden",
                          }}
                        >
                          <APIProvider apiKey={apiKey}>
                            <Map
                              style={{ width: "100%", height: "620px" }}
                              defaultZoom={18}
                              defaultCenter={centerPoint}
                              mapId={mapId}
                            >
                              <AdvancedMarker position={centerPoint} />
                            </Map>
                          </APIProvider>
                        </div>
                      );
                    }

                    if (polygons.length === 0 || !apiKey) {
                      return null;
                    }

                    const center = setCenterPoint(
                      record,
                      "centerPoint",
                      definition,
                    ) ||
                      polygons[0]?.[0] || { lat: 0, lng: 0 };
                    
                    const zoomVar: string = definition?.zoomDependentOn ?? "";
                    const zoomValue = zoomVar && String(zoomVar) ? calculateZoom(Number(record[zoomVar])) : 4;

                    return (
                      <div
                        key={`${fieldPath}-map`}
                        style={{
                          width: "100%",
                          minHeight: 320,
                          marginTop: 16,
                          border: "1px solid #ddd",
                          borderRadius: 8,
                          overflow: "hidden",
                        }}
                      >
                        <APIProvider apiKey={apiKey}>
                          <Map
                            style={{ width: "100%", height: "620px" }}
                            defaultCenter={center}
                            defaultZoom={zoomValue}
                            gestureHandling="greedy"
                            disableDefaultUI
                          >
                            {polygons.map((path, polygonIndex) => (
                              <Polygon
                                key={polygonIndex}
                                paths={path}
                                strokeColor="#1976d2"
                                strokeOpacity={0.8}
                                strokeWeight={2}
                                fillColor="#1976d2"
                                fillOpacity={0.2}
                              />
                            ))}
                          </Map>
                        </APIProvider>
                      </div>
                    );
                  })}
            </article>
          ))}
        </div>
      </section>

      <Pagination
        currentPage={page}
        pageSize={PAGE_SIZE}
        totalItems={recordCount || 0}
        isLoading={isLoading}
        inputId="2"
        onPageChange={handlePageChange}
      />
    </main>
  );
}
