import { createBrowserRouter } from "react-router-dom";

import { SearchPage } from "../pages/SearchPage";
import { DatasetPage } from "../pages/DatasetPage";
import { RecordsPage } from "../pages/records/RecordsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <SearchPage />,
  },
  {
    path: "/datasets/:datasetName",
    element: <DatasetPage />,
  },
  {
    path: "/records/:datasetName",
    element: <RecordsPage />,
  },
]);
