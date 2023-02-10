export interface User {
  uuid: string;
}

// All values in Creds are numbers represented as hex strings
export interface Creds {
  customFields: string[]; // 2 items
  iat: string;
  issuerAddress: string;
  scope: string;
  secret: string;
  serializedAsPreimage: string[]; // 6 items
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

export interface HolonymIssuerReturnValue {
  creds: Creds;
  leaf: string; // hex string
  pubkey: {
    x: string; // hex string
    y: string; // hex string
  };
  signature: {
    R8: {
      x: string; // hex string
      y: string; // hex string
    };
    S: string; // hex string
  };
}

type FieldsInLeaf = [
  "issuer", // Required. Do not change.
  "secret", // Required. Do not change.
  string,
  string,
  "iat", // Required. Do not change.
  "scope" // Required. Do not change.
];

export interface IssuerResponse extends HolonymIssuerReturnValue {
  metadata: {
    derivedCreds: DerivedCreds;
    fieldsInLeaf: FieldsInLeaf;
    rawCreds: RawCreds;
  };
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
