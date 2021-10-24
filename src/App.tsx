import React from "react";
import { Admin, Resource, ListGuesser } from "react-admin";
import ParseClientService from "./services/ParseClientService";
import { UserCreate } from "./operations/users";

const dataProvider = ParseClientService({
  URL: process.env.REACT_APP_PARSE_URL || "",
  APP_ID: process.env.REACT_APP_PARSE_APP_ID || "",
  JAVASCRIPT_KEY: process.env.REACT_APP_PARSE_JAVASCRIPT_KEY || "",
});

const App = () => (
  <Admin dataProvider={dataProvider}>
    <Resource name="users" list={ListGuesser} create={UserCreate} />
  </Admin>
);

export default App;
