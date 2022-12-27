# Example Holonym Issuer

To create a Holonym Issuer, follow the TODOs in the code.

## Requirements

An issuer must fulfill the following requirements in order to be considered for integration with the Holonym frontend.

Every issuer must expose a GET endpoint that returns a JSON object with the following properties:

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

The `signature` property is the signature of the poseidon hash of the values of the fields in `fieldsInLeaf`. In pseudocode, the signature is computed as follows:

```TypeScript
signature = sign(poseidon(fieldsInLeaf.map((field) => get(field))));
```

### Note

The issuer is designed to handle GET requests. If your issuer server must handle POST requests during the user verification flow, you will need to add a handler for POST requests.

## Organization of src folder

- `server.js` - Starts the server, registers routes, and handles termination.
- `init.js` - Initializes resources used by the server. In this example, the only resource used is a database.
- `issuer.js` - Includes the `Issuer` class that processes requests to the server.
- `constants.js` - Includes constants used by the server.
- `utils.js` - Includes utility functions used by the server.

## Local environment setup

- Node.js ^16.0.0 is recommended

### 1. Install Node dependencies

        npm install

### 2. Environment variables

#### Create .env files

Copy .env.example to .env.

        cp .env.example .env

Set the environment variables in .env.

## Run

Open a terminal window, navigate to the directory of this repo, and run:

        npm run start
