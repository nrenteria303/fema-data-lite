// import {getDisasterDeclarations} from "../api/openfema.ts";

const Layout = async () => {
    const response = await fetch(
      "https://www.fema.gov/api/open/v1/OpenFemaDataSets",
    );

    const data = await response.json();

    return <pre>{JSON.stringify(data, null, 2)}</pre>;
}

export default Layout