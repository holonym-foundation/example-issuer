import { createHash, randomBytes } from "crypto";
import assert from "assert";
import { sqlDb } from "./init.js";

export function sha256Hash(data) {
  return createHash("sha256").update(data).digest().toString("hex");
}

export function generateSecret(numBytes = 16) {
  return "0x" + randomBytes(numBytes).toString("hex");
}

/**
 * @param {string} date Must be of form yyyy-mm-dd
 */
export function getDateAsInt(date) {
  // Format input
  const [year, month, day] = date.split("-");
  assert.ok(year && month && day); // Make sure Y M D all given
  assert.ok(year >= 1900 && year <= 2099); // Make sure date is in a reasonable range, otherwise it's likely the input was malformatted and it's best to be safe by stopping -- we can always allow more edge cases if needed later
  const time = new Date(date).getTime() / 1000 + 2208988800; // 2208988800000 is 70 year offset; Unix timestamps below 1970 are negative and we want to allow from approximately 1900.
  assert.ok(!isNaN(time));
  return time;
}

export function selectUser(column, value) {
  return new Promise((resolve, reject) => {
    const statement = `SELECT * FROM Users WHERE ${column}=?`;
    sqlDb.get(statement, value, (err, row) => {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

/**
 * Run the given SQL command with the given parameters.
 * Helpful for UPDATEs and INSERTs.
 */
export function runSql(sql, params) {
  return new Promise((resolve, reject) => {
    sqlDb.run(sql, params, (err) => {
      if (err) {
        console.log(err);
        reject(err);
      }
      resolve();
    });
  });
}

export function insertUser(uuid) {
  return runSql("INSERT INTO Users (uuid) VALUES (?)", [uuid]);
}
