import { useMemo } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import type { OpenFemaDataset } from "../api/types";
import { useDatasets } from "../hooks/useDatasets";

export function DatasetPage() {
  const { datasetName } = useParams<{ datasetName: string }>();
  const location = useLocation();
  const { data, isLoading, error } = useDatasets();

  const dataset = useMemo(() => {
    const routedDataset = (location.state as { dataset?: OpenFemaDataset } | null)?.dataset;

    if (routedDataset) {
      return routedDataset;
    }

    return data?.OpenFemaDataSets?.find((item) => item.name === datasetName);
  }, [data?.OpenFemaDataSets, datasetName, location.state]);

  if (isLoading) {
    return (
      <main style={{ maxWidth: "960px", margin: "0 auto", padding: "24px" }}>
        <h1>Loading dataset...</h1>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ maxWidth: "960px", margin: "0 auto", padding: "24px" }}>
        <h1>Error loading dataset.</h1>
      </main>
    );
  }

  if (!dataset) {
    return (
      <main style={{ maxWidth: "960px", margin: "0 auto", padding: "24px" }}>
        <h1>Dataset not found.</h1>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: "960px", margin: "0 auto", padding: "24px" }}>
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
        <strong>Dataset Searchable:</strong> {dataset.api ? "Yes" : "No"}
      </p>

      {dataset.api && (
        <p style={{ marginBlock: "16px" }}>
          <Link to={`/records/${dataset.name}`}>
            View records in {dataset.title}
          </Link>
        </p>
      )}

      <div
        dangerouslySetInnerHTML={{ __html: dataset.description as string }}
        style={{ marginBottom: "16px" }}
      />

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
