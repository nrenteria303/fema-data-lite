import { useDatasets } from "./hooks/useDatasets";

function App() {
  const { data, isLoading, error } = useDatasets();

  if (isLoading) {
    return <h1>Loading datasets...</h1>;
  }

  if (error) {
    return <h1>Error loading datasets.</h1>;
  }

  return (
    <main>
      <h1>OpenFEMA Explorer</h1>

      <pre>{JSON.stringify(data, null, 2)}</pre>
    </main>
  );
}

export default App;
