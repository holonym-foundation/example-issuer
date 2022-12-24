import { sqlDb } from "./init.js";
import express from "express";
import cors from "cors";
import Issuer from "./issuer.js";

// ------------- Setup express app ------------- //
const app = express();
var corsOptions = {
  origin: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// TODO: Set your routes here.
const issuer = new Issuer();
app.get("issuer/credentials", (req, res) => issuer.handleGetRequest(req, res));

// ------------- Start server ------------- //
const PORT = process.env.PORT ?? 3000;
const server = app.listen(PORT, (err) => {
  if (err) throw err;
  console.log(`Server running, exposed at http://127.0.0.1:${PORT}`);
});

// ------------- Close server and database on SIGTERM or SIGINT ------------- //
async function terminate() {
  try {
    sqlDb.close();
    console.log("Closed database connection");
  } catch (err) {
    console.log(err);
    console.log("An error occurred while attempting to close the database");
  }
  console.log(`Closing server`);
  server.close(() => {
    console.log(`Closed server`);
    process.exit(0);
  });
}
process.on("SIGTERM", terminate);
process.on("SIGINT", terminate);
