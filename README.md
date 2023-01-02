# Example Holonym Issuer

This is an opinionated example of a Holonym Issuer.

To create a Holonym Issuer, fulfill the [Requirements](#requirements).

There are TODOs in the code for guidance. However, it is possible that your issuer will require a different design than that of this example. As long as your issuer fulfills the [Requirements](#requirements), it will be considered for integration with Holonym.

## Local environment setup

This example issuer uses Next.js, TypeScript, and SQLite.

- Node.js ^16.0.0 is recommended

### 1. Install Node dependencies

        npm install

### 2. Environment variables

#### Create .env files

Copy .env.example to .env.local.

        cp .env.example .env.local

Set the environment variables in .env.local.

### Run

Open a terminal window, navigate to the directory of this repo, and run:

        npm run dev

## Requirements

Every issuer run a server that fulfills the following requirements in order to be considered for integration with Holonym.

Every issuer must expose a GET endpoint that returns a JSON object (for any given user) with the following properties:

```TypeScript
{
        issuer: string;
        secret: string;
        scope: number | string; // if string, it is a representation of a number
        signature: string;
        rawCreds: {
            [string]: number | string; // if string, it is a representation of a number
        };
        derivedCreds?: {
            [string]: {
                value: number | string; // if string, it is a representation of a number
                derivationFunction: string; // e.g., "poseidon"
                inputFields: string[];
            };
        };
        fieldsInLeaf: string[];
};
```

The `fieldsInLeaf` includes the names of the fields to be passed as input to the poseidon hash function to produce a leaf in the Merkle tree. The `fieldsInLeaf` property must contain exactly six fields, and certain fields are required: `issuer` must be the 0th element, `secret` must be the 1st element, `scope` must be the 5th element. The remaining three fields are optional. The following is an example of a valid `fieldsInLeaf` array:

```TypeScript
[
    "issuer", // Required.
    "secret", // Required.
    "rawCreds.firstName",
    "rawCreds.middleName",
    "rawCreds.lastName",
    "scope", // Required.
]
```

The syntax used in `fieldsInLeaf` follows the JSON dot notation convention (used by MongoDB, for example). In the above example, `rawCreds.firstName` means that the value of the `firstName` field in the `rawCreds` object is to be used. The `rawCreds` object is the `rawCreds` property of the JSON object returned by the GET endpoint.

The `signature` property is the signature of the poseidon hash of the values of the fields in `fieldsInLeaf`. There is an example in the code, but for illustration, here is some pseudocode for generating the signature:

```TypeScript
signature = sign(poseidon(fieldsInLeaf.map((field) => get(field))));
```

## Frontend considerations

We expect the issuer to implement their own frontend.

## Organization of src folder

- `backend/init.ts` - Initializes resources used by the server. In this example, the only resource used is a database.
- `backend/issuer.ts` - Includes the `Issuer` class that processes requests to the server.
- `backend/constants.ts` - Includes constants used by the server.
- `backend/utils.ts` - Includes utility functions used by the server.
- `pages/api/issuer.ts` - Includes the API request router for the issuer.
