import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { ethers, Wallet } from "ethers";
import { poseidon } from "circomlibjs-old";
import {
  sha256Hash,
  generateSecret,
  getDateAsInt,
  selectUser,
  insertUser,
} from "./utils";
import { dummyUserCreds } from "./constants";
import {
  IssuerResponse,
  RawCreds,
  DerivedCreds,
  ThirdPartyApiResponse,
} from "../types/types";

interface ErrorResponse {
  error: string;
}

export default class Issuer {
  signer: Wallet;
  apiKey: string;

  constructor(privateKey?: string, apiKey?: string) {
    // Create ethers signer
    const _privateKey = privateKey ?? (process.env.PRIVATE_KEY as string);
    this.signer = new ethers.Wallet(_privateKey);
    // Set API key
    this.apiKey = apiKey ?? (process.env.API_KEY as string);
  }

  async handleGetRequest(
    req: NextApiRequest,
    res: NextApiResponse<IssuerResponse | ErrorResponse>
  ) {
    // NOTE: Uncomment if you want to receive dummy credentials in development
    if (process.env.NODE_ENV == "development") {
      const credentials = {
        ...dummyUserCreds,
        issuer: this.signer.address,
        secret: generateSecret(),
        scope: 0,
      };
      const serializedCreds = this.serializeCreds(credentials);
      const signature = await this.signCredentials(serializedCreds);
      const response = {
        ...credentials,
        signature,
        serializedCreds,
      };
      return res.status(200).json(response);
    }

    // userId stands in for an ID that was assigned to the user outside of the
    // Holonym system, during some verification flow. For example, this ID
    // might be created by a 3rd party identity provider when a user completes
    // an identity verification process with that provider.
    const userId = req.query?.userId;
    if (!userId) {
      return res.status(400).json({ error: "No userId specified" });
    }
    if (typeof userId != "string") {
      return res.status(400).json({ error: "userId must be a string" });
    }
    const resp = await this.getUserFrom3rdParyApi(userId);
    if (!resp) {
      return res.status(400).json({ error: "No response from 3rd party API" });
    }
    const validationResult = await this.validateApiResponse(resp);
    if (validationResult.error) {
      return res.status(400).json({ error: validationResult.error });
    }

    const uuid = this.generateUuid(resp);
    const sybilResult = await this.preventSybils(uuid);
    if (sybilResult.error) {
      return res.status(400).json({ error: sybilResult.error });
    }
    const credentials = this.extractCredentials(resp);
    const serializedCreds = this.serializeCreds(credentials);
    const signature = await this.signCredentials(serializedCreds);
    const response = {
      ...credentials,
      signature,
      serializedCreds,
    };
    await this.removeUserFrom3rdPartyApi(userId);
    return res.status(200).json(response);
  }

  async getUserFrom3rdParyApi(userId: string): Promise<ThirdPartyApiResponse | void> {
    try {
      // TODO: Rewrite this to work with your 3rd party identity provider API
      const url = "third-party-api-url";
      const headers = {
        "X-AUTH-CLIENT": this.apiKey,
        "Content-Type": "application/json",
      };
      const resp = await axios.get(url, { headers: headers });
      return resp.data;
    } catch (err: any) {
      console.error(`Error getting user with ID ${userId}`, err.message);
      return;
    }
  }

  /**
   * Ensure that the response from the 3rd party identity provider API includes
   * all expected data and that the data is valid.
   * @param apiResp Response from 3rd party identity provider API (e.g., Veriff)
   */
  async validateApiResponse(apiResp: ThirdPartyApiResponse) {
    // TODO: Add checks to ensure that all expected data is present in apiResp
    // if (!apiResp) {
    //   return { error: "Invalid API response" };
    // }
    return { success: true, error: "" };
  }

  generateUuid(apiResp: ThirdPartyApiResponse) {
    // TODO: Set uuidConstituents to some string of data that uniquely
    // identifies the user. A hash of the string is used as the UUID.
    // It is important that the UUID is a function of the user's data
    // because it is used to prevent Sybil attacks.
    const uuidConstituents = `${apiResp.firstName}${apiResp.lastName}${apiResp.dob}${apiResp.city}${apiResp.state}${apiResp.zip}`;
    const uuid = sha256Hash(Buffer.from(uuidConstituents));
    return uuid;
  }

  async preventSybils(uuid: string) {
    // NOTE: Nothing here needs to change, unless you use a different database
    // Assert user hasn't registered yet
    const user = await selectUser("uuid", uuid);
    if (user) {
      return { error: `User has already registered. UUID: ${uuid}` };
    }
    // Store UUID for Sybil resistance
    try {
      await insertUser(uuid);
      return { success: true };
    } catch (err: any) {
      return { error: err.message };
    }
  }

  /**
   * Extract the desired credentials from the response from the 3rd party API.
   */
  extractCredentials(apiResp: ThirdPartyApiResponse) {
    // TODO: Rewrite this function to work with your identity provider.
    // NOTE: Poseidon can only has 6 items. If you want to include more items,
    // you will need to create intermediate hashes. `nameHash` is an example of
    // intermediate hash.
    const firstName = apiResp.firstName ?? "";
    const middleName = apiResp.middleName ?? "";
    const lastName = apiResp.lastName ?? "";
    const birthdate = apiResp.dob ?? "";
    const country = apiResp.country ?? "";
    const completedAt = new Date().toISOString().split("T")[0];
    // NOTE: If you are hashing strings, it is easiest to convert them to
    // buffers and then to big number strings, as shown below. If you are
    // hashing numbers, you can convert them to big number strings directly.
    const nameHash = poseidon(
      [
        Buffer.from(firstName, "utf8"),
        Buffer.from(middleName, "utf8"),
        Buffer.from(lastName, "utf8"),
      ].map((x) => ethers.BigNumber.from(x).toString())
    ).toString();
    return {
      issuer: this.signer.address,
      secret: generateSecret(),
      scope: 0,
      // The raw credentials. These can be either strings or numbers. They
      // can be used as inputs to a leaf. They will be displayed as "nyms"
      // on the user's profile page on app.holonym.id.
      rawCreds: {
        firstName,
        middleName,
        lastName,
        country,
        birthdate,
        completedAt,
      },
      // The derived credentials. These are intermediate hashes. Each one can
      // be used as either (a) an input to another derived credential or
      // (b) an input to a leaf.
      derivedCreds: {
        nameHash: {
          value: nameHash,
          derivationFunction: "poseidon", // only poseidon is supported
          inputFields: [
            "rawCreds.firstName",
            "rawCreds.middleName",
            "rawCreds.lastName",
          ],
        },
      },
      // The names of fields in the leaf. This must contain 6 elements,
      // and the order matters.
      fieldsInLeaf: [
        "issuer", // Required. Do not change.
        "secret", // Required. Do not change.
        "rawCreds.birthdate",
        "rawCreds.completedAt",
        "derivedCreds.nameHash.value",
        "scope", // Required. Do not change.
      ],
    };
  }

  /**
   * Serialize the credentials into the 6 field elements they will be as the preimage to the leaf.
   * @param {Object} creds Object containing a full string representation of every credential.
   * @returns 6 string representations of the preimage's 6 field elements, in order
   */
  serializeCreds(credentials: {
    issuer: string;
    secret: string;
    scope: string | number;
    rawCreds: RawCreds;
    derivedCreds: DerivedCreds;
    fieldsInLeaf: string[];
  }) {
    // NOTE: Nothing needs to change here if the fields in leaf are strings or numbers
    const leafInputs = [];
    for (const name of credentials.fieldsInLeaf) {
      if (name == "issuer" || name == "secret" || name == "scope") {
        leafInputs.push(credentials[name]);
      } else if (name.includes("rawCreds")) {
        const rawCred = credentials.rawCreds[name.split(".")[1]];
        // NOTE: If the raw credential is a date (represented as a string)
        // that you want to represent as a number, you will have to implement
        // a specific check for that field. You can use the `getDateAsInt`
        // function for the conversion, as shown below.
        if (name.includes("birthdate") || name.includes("completedAt")) {
          leafInputs.push(getDateAsInt(rawCred as string));
          continue;
        }
        if (typeof rawCred == "string" && parseInt(rawCred).toString() == "NaN") {
          leafInputs.push(Buffer.from(rawCred, "utf-8"));
        } else {
          leafInputs.push(rawCred);
        }
      } else if (name.includes("derivedCreds")) {
        leafInputs.push(credentials.derivedCreds[name.split(".")[1]].value);
      }
    }
    return leafInputs.map((x) => ethers.BigNumber.from(x).toString());
  }

  async signCredentials(serializedCreds: string[]) {
    // NOTE: Nothing needs to change here
    const leafAsBigInt = poseidon(serializedCreds);
    const leaf = ethers.utils.arrayify(ethers.BigNumber.from(leafAsBigInt));

    const signature = await this.signer.signMessage(leaf);
    return signature;
  }

  async removeUserFrom3rdPartyApi(userId: string) {
    try {
      // TODO: Rewrite this function to work with your identity provider.
      const url = "third-party-api-url";
      const resp = await axios.delete(url, {
        headers: {
          "X-AUTH-CLIENT": this.apiKey,
          "Content-Type": "application/json",
        },
      });
      return resp.data;
    } catch (err: any) {
      console.log(err.message);
      return {};
    }
  }
}