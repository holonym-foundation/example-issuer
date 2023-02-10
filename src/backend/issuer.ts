import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { ethers } from "ethers";
import { poseidon } from "circomlibjs-old";
import { issue } from "holonym-wasm-issuer";
import { sha256Hash, getDateAsInt, selectUser, insertUser } from "./utils";
import { dummyUserCreds } from "./constants";
import { IssuerResponse, ThirdPartyApiResponse } from "../types/types";

interface ErrorResponse {
  error: string;
}

export default class Issuer {
  constructor() {}

  async handleGetRequest(
    req: NextApiRequest,
    res: NextApiResponse<IssuerResponse | ErrorResponse>
  ) {
    // NOTE: Uncomment if you want to receive dummy credentials in development
    if (process.env.NODE_ENV == "development") {
      const issuedObject = issue(
        process.env.ISSUER_PRIVATE_KEY as string,
        getDateAsInt(dummyUserCreds.rawCreds.birthdate as string).toString(),
        dummyUserCreds.derivedCreds.nameHash.value
      );
      const response = {
        ...issuedObject,
        metadata: dummyUserCreds,
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
    const issuedObject = issue(
      process.env.ISSUER_PRIVATE_KEY as string,
      getDateAsInt(credentials.rawCreds.birthdate).toString(),
      credentials.derivedCreds.nameHash.value
    );
    const response = {
      ...issuedObject,
      metadata: dummyUserCreds,
    };
    await this.removeUserFrom3rdPartyApi(userId);
    return res.status(200).json(response);
  }

  async getUserFrom3rdParyApi(userId: string): Promise<ThirdPartyApiResponse | void> {
    try {
      // TODO: Rewrite this function to work with your 3rd party identity provider API.
      // set url to the endpoint of your 3rd party identity provider API
      const url = "http://localhost:3000/api/mock-provider";
      const headers = {
        "X-AUTH-CLIENT": process.env.API_KEY as string,
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
    const uuidConstituents = `${apiResp.firstName}${apiResp.lastName}${apiResp.birthdate}${apiResp.city}${apiResp.state}${apiResp.zip}`;
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
    const birthdate = apiResp.birthdate ?? "";
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
        "derivedCreds.nameHash.value",
        "iat", // Required. Do not change.
        "scope", // Required. Do not change.
      ],
    };
  }

  async removeUserFrom3rdPartyApi(userId: string) {
    try {
      // TODO: Rewrite this function to work with your identity provider.
      const url = "third-party-api-url";
      const resp = await axios.delete(url, {
        headers: {
          "X-AUTH-CLIENT": process.env.API_KEY as string,
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
