import { useMemo, useEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import type { EntityRecordSchema, OpenFemaDataset } from "../api/types";
import entityRecordSchema from "../schemata/entity-record-schema.json";
import { useDatasets } from "../hooks/useDatasets";

import './DatasetPage.css'

export function DatasetPage() {
  const { datasetName } = useParams<{ datasetName: string }>();
  const location = useLocation();
  const { data, isLoading, error } = useDatasets();

  useEffect(() => {
    // Scroll to the top when the component mounts
    window.scrollTo(0, 0);
  }, []);

  const dataset = useMemo(() => {
    const routedDataset = (location.state as { dataset?: OpenFemaDataset } | null)?.dataset;

    if (routedDataset) {
      return routedDataset;
    }

    return data?.OpenFemaDataSets?.find((item) => item.name === datasetName);
  }, [data?.OpenFemaDataSets, datasetName, location.state]);
  
  const recordsAvailable = useMemo(() => {
    const schema = entityRecordSchema as EntityRecordSchema;
    return Boolean(dataset && schema.entities[dataset.name]);
  }, [dataset]);

  if (isLoading) {
    return (
      <main className="dataset-detail__main">
        <Link to="/">Back to datasets</Link>
        <h1>Loading dataset...</h1>
      </main>
    );
  }

  if (error) {
    return (
      <main className="dataset-detail__main">
        <Link to="/">Back to datasets</Link>
        <h1>Error loading dataset.</h1>
      </main>
    );
  }

  if (!dataset) {
    return (
      <main className="dataset-detail__main">
        <Link to="/">Back to datasets</Link>
        <h1>Dataset not found.</h1>
      </main>
    );
  }

  return (
    <main className="dataset-detail__main">
      <Link to="/">Back to datasets</Link>
      <h1>{dataset.title}</h1>
      <p>
        <strong>Dataset name:</strong> {dataset.name}
      </p>
      <p>
        <strong>Theme:</strong> {dataset.theme}
      </p>
      <p>
        <strong>Publisher:</strong> {dataset.publisher}
      </p>
      <p>
        <strong>Records:</strong> {dataset.recordCount?.toLocaleString()}
      </p>
      <p>
        <strong>Records available to view:</strong> {recordsAvailable ? "Yes" : "No"}
      </p>

      {recordsAvailable && (
        <p style={{ marginBlock: "16px" }}>
          <Link to={`/records/${dataset.name}`} state={{ dataset }}>
            View records in {dataset.title}
          </Link>
        </p>
      )}

      <div
        dangerouslySetInnerHTML={{ __html: dataset.description as string }}
        style={{ marginBlock: "16px" }}
      />
      <a
        style={{ marginBottom: "16px", display: "block" }}
        href={dataset.dataDictionary}
        target="_blank"
        rel="noreferrer"
      >
        View Documentation
      </a>
      {dataset.distribution?.length > 0 && (
        <section>
          <h2>Downloads</h2>
          <ul>
            {dataset.distribution.map((item) => (
              <li key={`${item.format}-${item.accessURL}`}>
                <strong>{item.format}</strong>:{" "}
                <a href={item.accessURL} target="_blank" rel="noreferrer">
                  {item.accessURL}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
