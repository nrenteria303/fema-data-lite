import { useMemo } from "react";
import { Link } from "react-router-dom";

import { type EntityRecordSchema, type OpenFemaDataset } from "../api/types";
import entityRecordSchema from "../schemata/entity-record-schema.json";

import "./DatasetCard.css";

interface DatasetCardProps {
  dataset: OpenFemaDataset;
}

export function DatasetCard({ dataset }: DatasetCardProps) {
  const recordsAvailable = useMemo(() => {
    const schema = entityRecordSchema as EntityRecordSchema;
    return Boolean(schema.entities[dataset.name]);
  }, [dataset.name]);

  const cardClassNames = useMemo(() => {
    const str = "dataset-card";
    return recordsAvailable ? str + " dataset-card--highlight" : str;
  }, [recordsAvailable]);

  return (
    <Link
      to={`/datasets/${dataset.name}`}
      state={{ dataset }}
      className="dataset-link"
    >
      <article className={cardClassNames}>
        <h2>{dataset.title}</h2>

        <p>
          <strong>Theme:</strong> {dataset.theme}
        </p>

        <p>
          <strong>Records:</strong> {dataset.recordCount?.toLocaleString()}
        </p>

        <p className={recordsAvailable ? "blue-text" : ""}>
          <strong>Records Available to View:</strong>{" "}
          {recordsAvailable ? "Yes" : "No"}
        </p>

        <p>{dataset.description.slice(0, 250)}...</p>
      </article>
    </Link>
  );
}
