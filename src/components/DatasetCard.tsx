import { type OpenFemaDataset } from "../api/types";
import { Link } from "react-router-dom";

interface DatasetCardProps {
  dataset: OpenFemaDataset;
}

export function DatasetCard({ dataset }: DatasetCardProps) {
  return (
    <Link
        to={`/datasets/${dataset.name}`}
        state={{ dataset }}
        style={{
            textDecoration: "none",
            color: "inherit",
        }}
    >
        <article
            style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "16px",
            }}
        >
            <h2>{dataset.title}</h2>

            <p>
                <strong>Theme:</strong> {dataset.theme}
            </p>

            <p>
                <strong>Records:</strong> {dataset.recordCount?.toLocaleString()}
            </p>

            <p>
                <strong>Dataset Searchable:</strong> {dataset.api ? "Yes" : "No"}
            </p>

            <p>{dataset.description.slice(0, 250)}...</p>

        {/* <a href={dataset.dataDictionary} target="_blank" rel="noreferrer">
            View Documentation
        </a> */}
        </article>
    </Link>
  );
}
