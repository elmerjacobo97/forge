import { Account, Client, Functions, TablesDB } from "appwrite";

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const account = new Account(client);
const tablesDB = new TablesDB(client);
const functions = new Functions(client);

export { client, account, tablesDB, functions };
