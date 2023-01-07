export interface User {
  uuid: string;
}

export interface RawCreds {
  [key: string]: string | number;
}

export interface DerivedCreds {
  [key: string]: {
    value: string;
    derivationFunction: string; // only "poseidon" is supported for now
    inputFields: string[];
  };
}

type FieldsInLeaf = [
  "issuer", // Required. Do not change.
  "secret", // Required. Do not change.
  string,
  string,
  string,
  "scope" // Required. Do not change.
];

export interface IssuerResponse {
  issuer: string;
  secret: string;
  scope: string | number;
  signature: string;
  serializedCreds: string[];
  rawCreds: RawCreds;
  derivedCreds: DerivedCreds;
  fieldsInLeaf: string[]; // FieldsInLeaf
}

// TODO: Change this to match the response from your third-party API
export interface ThirdPartyApiResponse {
  firstName: string;
  middleName: string;
  lastName: string;
  country: string;
  birthdate: string;
  city: string;
  state: string;
  zip: string;
}
