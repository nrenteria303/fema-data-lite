import type { SchemaFieldDefinition } from "../api/types";

type LatLngLiteral = { lat: number; lng: number };

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

export function getFieldValueWithFallback(
  record: Record<string, unknown>,
  fieldPath: string,
  fallbackPaths?: string,
) {
  const primaryValue = getFieldValue(record, fieldPath);
  const primaryValueIsEmptyStringArray = Array.isArray(primaryValue) && primaryValue.length == 1 && primaryValue[0] == "";

  if (primaryValue != null && primaryValue !== "" && !primaryValueIsEmptyStringArray) {
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

export function renderFieldValue(value: unknown, definition: SchemaFieldDefinition) {
  if (value == null || value === "") {
    return null;
  }

  if (definition.type === "html") {
    return <div dangerouslySetInnerHTML={{ __html: String(value) }} />;
  }

  if (
    definition.type === "iso" &&
    typeof value === "string" &&
    definition.format
  ) {
    const date = new Date(value);

    if (!Number.isNaN(date.getTime())) {
      const formatters = definition.format
        .split(" ")
        .map((segment) => segment.trim())
        .filter(Boolean);

      const parts = formatters.map((formatter) => {
        const [methodName, ...args] = formatter.split("(");
        const normalizedArgs = args
          .join("(")
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

  if (Array.isArray(value)) {
    if (definition.element === "ul") {
      return (
        <ul>
          {value.map((item, itemIndex) => (
            <li key={itemIndex}>{String(item)}</li>
          ))}
        </ul>
      );
    }

    return <span>{value.map((item) => String(item)).join(", ")}</span>;
  }

  return <span>{String(value)}</span>;
}

function isLatLngPair(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number"
  );
}

function toLatLngLiteral(value: unknown): LatLngLiteral | null {
  if (!isLatLngPair(value)) {
    return null;
  }

  return {
    lat: value[1],
    lng: value[0],
  };
}

export function buildMapRegionPaths(
  record: Record<string, unknown>,
  fieldPath: string,
  definition: SchemaFieldDefinition,
) {
  const regionType = getFieldValue(
    record,
    definition.polygonOrMultiPolygon ?? `${fieldPath}.type`,
  );
  const coordinates = getFieldValueWithFallback(
    record,
    definition.coordinates ?? `${fieldPath}.coordinates`,
    definition.useIfNull
  );
  
  // Used as check for when fallback is needed for mapRegion,
  // and if it is, a centerPoint is often used instead
  const originalCoordinatesAreNull = getFieldValue(
    record,
    definition.coordinates ?? `${fieldPath}.coordinates`,
  ) == null;

  const coordinatesAreCenterpoint =
    originalCoordinatesAreNull &&
    coordinates &&
    Array.isArray(coordinates) &&
    coordinates.length === 2 &&
    !isNaN(parseFloat(coordinates[0])) &&
    !isNaN(parseFloat(coordinates[1]));

  if (coordinatesAreCenterpoint) {
    console.log("in centerpoint if:", coordinates)
    return [[{lat: coordinates[1], lng: coordinates[0]}]] as LatLngLiteral[][];
  }

  if (typeof regionType !== "string" || !Array.isArray(coordinates)) {
    return [] as LatLngLiteral[][];
  }

  const normalizedType = regionType.trim().toLowerCase();
  const polygons: LatLngLiteral[][] = [];

  if (normalizedType === "polygon") {
    for (const ring of coordinates) {
      if (!Array.isArray(ring)) {
        continue;
      }

      const path = ring
        .map(toLatLngLiteral)
        .filter((point): point is LatLngLiteral => point !== null);

      if (path.length > 0) {
        polygons.push(path);
      }
    }
  }

  if (normalizedType === "multipolygon") {
    for (const polygon of coordinates) {
      if (!Array.isArray(polygon)) {
        continue;
      }

      for (const ring of polygon) {
        if (!Array.isArray(ring)) {
          continue;
        }

        const path = ring
          .map(toLatLngLiteral)
          .filter((point): point is LatLngLiteral => point !== null);

        if (path.length > 0) {
          polygons.push(path);
        }
      }
    }
  }

  return polygons;
}

export function setCenterPoint(
  record: Record<string, unknown>,
  fieldPath: string,
  definition: SchemaFieldDefinition,
) {
    if (!record || !definition) return null;
    const centerPoint = getFieldValue(
        record,
        definition.centerPoint ?? `${fieldPath}.centerPoint`,
    );
    if (!centerPoint || centerPoint == undefined) return null;
    let cpCoordinates;
    if (Array.isArray(centerPoint)) {
        cpCoordinates = {
          lat: centerPoint[1],
          lng: centerPoint[0],
        };
    } else if (typeof centerPoint == "string") {
        const cpArray = centerPoint.split(",");
        if (cpArray.length != 2) return null;
        cpCoordinates = {
            lat: cpArray[1],
            lng: cpArray[0]
        }
    }
    return cpCoordinates;
};

export function calculateZoom(_z: number) {
    let zoom = 0;
    switch (true) {
    case (_z >= 0 && _z < 0.001):
        zoom = 17;
        break;
    case (_z >= 0.001 && _z < 0.01):
        zoom = 16;
        break;
    case (_z >= 0.01 && _z < 0.1):
        zoom = 15;
        break;
    case (_z >= 0.1 && _z < 1):
        zoom = 14;
        break;
    case (_z > 1 && _z < 5):
        zoom = 13;
        break;
    case (_z >= 5 && _z < 15):
        zoom = 12;
        break;
    case (_z >= 15 && _z < 40):
        zoom = 11;
        break;
    case (_z >= 40 && _z < 100):
        zoom = 10;
        break;
    case (_z >= 100 && _z < 500):
        zoom = 9;
        break;
    case (_z >= 500 && _z < 2000):
        zoom = 8;
        break;
    case (_z >= 2000 && _z < 10000):
        zoom = 7;
        break;
    case _z >= 10000 && _z < 50000:
        zoom = 6;
        break;
    case _z >= 50000:
        zoom = 5;
        break;
    }
    return zoom;
}