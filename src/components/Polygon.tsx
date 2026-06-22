import {
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { GoogleMapsContext } from "@vis.gl/react-google-maps";
import {} from "@react-google-maps/api";

interface PolygonProps extends google.maps.PolygonOptions {
  paths: google.maps.LatLngLiteral[];
}

export const Polygon = forwardRef<google.maps.Polygon | null, PolygonProps>(
  (props, ref) => {
    const { paths, ...options } = props;

    // Access the underlying map instance from context
    const context = useContext(GoogleMapsContext);
    const map = context?.map;

    const polygonRef = useRef<google.maps.Polygon | null>(null);

    // Initialize and update the polygon instance
    useEffect(() => {
      if (!map) return;

      // Create the native Google Map Polygon object
      const polygon = new google.maps.Polygon({
        ...options,
        paths,
        map,
      });

      polygonRef.current = polygon;

      // Clean up overlay when component unmounts
      return () => {
        polygon.setMap(null);
      };
    }, [map]);

    // Synchronize changes to options or paths over time
    useEffect(() => {
      if (!polygonRef.current) return;
      polygonRef.current.setOptions(options);
      polygonRef.current.setPaths(paths);
    }, [options, paths]);

    // Expose the native instance to parent components via a ref
    useImperativeHandle(ref, () => polygonRef.current!);

    return null;
  },
);

Polygon.displayName = "Polygon";
