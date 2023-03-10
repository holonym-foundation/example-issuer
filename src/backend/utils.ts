import { createHash } from "crypto";
import assert from "assert";
import { sqlDb } from "./init";

export function sha256Hash(data: Buffer) {
  return createHash("sha256").update(data).digest().toString("hex");
}

/**
 * @param {string} date Must be of form yyyy-mm-dd
 */
export function getDateAsInt(date: string) {
  const [year, month, day] = date.split("-");
  // Make sure Y M D all given
  assert.ok(year && month && day);
  // Make sure date is in a reasonable range, otherwise it's likely the input was malformatted and it's best to be safe by stopping
  assert.ok(parseInt(year) >= 1900 && parseInt(year) <= 2099);
  // 2208988800000 is 70 year offset; Unix timestamps below 1970 are negative and we want to allow from approximately 1900.
  const time = new Date(date).getTime() / 1000 + 2208988800;
  assert.ok(!isNaN(time));
  return time;
}

export function selectUser(column: string, value: string) {
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

export function selectAllUsers() {
  return new Promise((resolve, reject) => {
    const statement = `SELECT * FROM Users`;
    sqlDb.all(statement, (err, row) => {
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
export function runSql(sql: string, params: string[]) {
  return new Promise<void>((resolve, reject) => {
    sqlDb.run(sql, params, (err) => {
      if (err) {
        console.log(err);
        reject(err);
      }
      resolve();
    });
  });
}

export function insertUser(uuid: string) {
  return runSql("INSERT INTO Users (uuid) VALUES (?)", [uuid]);
}
