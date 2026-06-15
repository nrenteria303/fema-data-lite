export interface DatasetDistribution {
  format: string;
  accessURL: string;
  datasetSize: string;
}

export interface EntitySchemaFieldDefinition {
  type: string;
  element: string;
  label?: string;
  useIfNull?: string;
  format?: string;
}

export interface EntitySchema {
  [fieldPath: string]: EntitySchemaFieldDefinition;
}

export interface EntityRecordSchema {
  entities: Record<string, EntitySchema>;
}

export interface OpenFemaDataset {
  id: string;
  identifier: string;
  name: string;
  title: string;
  description: string;
  webService: string;
  dataDictionary: string;
  modified: string;
  publisher: string;
  theme: string;
  recordCount: number;
  version: number;
  api: boolean;
  distribution: DatasetDistribution[];
}

export interface SearchableDataset extends OpenFemaDataset {
  searchable: boolean;
}

export interface OpenFemaDatasetsResponse {
  metadata: {
    count: number;
  };
  OpenFemaDataSets: OpenFemaDataset[];
}

export interface DatasetSearchFilters {
  keyword: string;
  theme: string;
  publisher: string;
  apiOnly: boolean;
}

export interface SchemaFieldDefinition {
  type: string;
  element: string;
  label?: string;
  useIfNull?: string;
  format?: string;
}