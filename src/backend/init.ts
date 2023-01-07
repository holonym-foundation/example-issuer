import { dirname } from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";
import dotenv from "dotenv";
dotenv.config();

// NOTE: sqlite3 will work for prototyping, but we suggest you use a more
// robust database in production.
async function initializeDatabase() {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const sqlDbPath =
    process.env.PATH_TO_SQLITE_DB ?? `${__dirname}/../../database/db.sqlite3`;
  const sqlDb = new sqlite3.Database(sqlDbPath);
  await new Promise<void>((resolve) => {
    sqlDb.serialize(() => {
      const columns = `(uuid TEXT)`;
      sqlDb.prepare(`CREATE TABLE IF NOT EXISTS Users ${columns}`).run().finalize();
      resolve();
    });
  });
  return sqlDb;
}

let sqlDb: sqlite3.Database;
initializeDatabase().then((result) => {
  if (result) {
    sqlDb = result;
  } else {
    console.log("Database initialization failed");
  }
});

// ------------- Close database on SIGTERM or SIGINT ------------- //
async function terminate() {
  try {
    sqlDb.close();
    console.log("Closed database connection");
  } catch (err) {
    console.log(err);
    console.log("An error occurred while attempting to close the database");
  }
}
process.on("SIGTERM", terminate);
process.on("SIGINT", terminate);

export { sqlDb };
