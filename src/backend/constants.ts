import { DerivedCreds, RawCreds } from "../types/types";

// TODO: For testing purposes, update the following fields to match the
// fields you extract from the API response.
export const dummyUserCreds: {
  rawCreds: RawCreds;
  derivedCreds: DerivedCreds;
  fieldsInLeaf: string[];
} = {
  rawCreds: {
    firstName: "Satoshi",
    middleName: "Bitcoin",
    lastName: "Nakamoto",
    country: "US",
    birthdate: "1950-01-01",
    completedAt: "2022-09-16",
  },
  derivedCreds: {
    nameHash: {
      value:
        "10661486706529852150200226111599067623527314510572034955353660669031775117943",
      derivationFunction: "poseidon",
      inputFields: ["rawCreds.firstName", "rawCreds.middleName", "rawCreds.lastName"],
    },
  },
  fieldsInLeaf: [
    "issuer", // Required. Do not change.
    "secret", // Required. Do not change.
    "derivedCreds.nameHash.value",
    "rawCreds.birthdate",
    "rawCreds.completedAt",
    "scope", // Required. Do not change.
  ],
};
