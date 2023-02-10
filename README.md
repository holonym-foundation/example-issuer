# Example Holonym Issuer

This is an opinionated example of a Holonym Issuer.

To create a Holonym Issuer, fulfill the [Requirements](#requirements).

There are TODOs in the code for guidance. However, it is possible that your issuer will require a different design than the design of this example. As long as your issuer fulfills the [Requirements](#requirements), it will be considered for integration with Holonym.

## Credential issuance flow overview

Holonym is designed to allow issuers seemlessly integrate with the system. The following diagram illustrates the interactions between an issuer and Holonym.

![credential issuance flow diagram](https://www.websequencediagrams.com/cgi-bin/cdraw?lz=dGl0bGUgQ3JlZGVudGlhbCBJc3N1YW5jZSBGbG93CgpJc3N1ZXIgZnJvbnRlbmQtPgAKB2JhY2tlbmQ6IDEuIFVzZXIgc3VibWl0cyBkYXRhCm5vdGUgcmlnaHQgb2YATgUAJwwKMi4ADAhwcm9jZXNzZXMKYW5kIHN0b3JlcyB1c2VyAEIGZW5kIG5vdGUAdRJIb2xvbnltAIEQCTogMwBMCXJlZGlyZWN0AEMHdG8gAB4QCgAvEACBRhI0LgAtCXJldHJpZXYAgQ0NAIFUDgB8Ego1AIIRB2VuY3J5cHRzIGFuZAoAgVoHdGhlaXIgc2lnbmVkAIFaDwA3ITYuIChBZnRlciBpAIMjBykAgnwFCmdlbmVyYXRlcyB6ZXJvIGtub3dsZWRnZSAKcHJvb2ZzIHVzaW5nAG8NCgCCWA0&s=default)

1. User submits data to the issuer. This might involve a form on the issuer's website, a verification flow on a mobile app where the user provides images, or something else. This step is not strictly required since the issuer might have already collected user information, but we expect it is necessary for most cases.
   - _This step is illustrated in the `<IssuerForm />` component in this example issuer._
2. Issuer processes and stores user data. Upon receiving the user data, the issuer backend should store the relevant data. The purpose of this step is to create a record in the issuer's database (or in the database of a third party API used by the issuer) of the user so that the user's data can later be retrieved. Each user should have a unique identifier.
   - _This step is illustrated by the handling of POST requests in the `pages/api/issuer.ts` file._
3. Issuer redirects user to Holonym frontend. Because the user's credentials are encrypted client-side with information restricted to the app.holonym.id domain, the user must be at the Holonym frontend to retrieve their credentials. With the redirect, the issuer must provide the URL of the GET endpoint that will return the user's credentials.
   - _This step is illustrated in the `<IssuerForm />` component._
4. Holonym retrieves user data. Given the `retrievalEndpoint` with the `userId`, Holonym requests the user's data from the issuer's server. At this time, the issuer formats the user's credentials and signs them so that they can be used to generate trusted zero knowledge proofs.
   - _This step is illustrated by the handling of GET requests in the `pages/api/issuer.ts` file._

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

This will start a local server at http://localhost:3000 (or higher if port 3000 is already in use). The frontend can be accessed at http://localhost:3000/ and an API can be accessed at http://localhost:3000/api/.

## Requirements

At minimum, an issuer must do 2 things to integrate with Holonym:

- Run a server that meets the requirements below.
- Direct users to the Holonym frontend to retrieve their credentials.

### Server requirements

Every issuer must expose a GET endpoint that returns a JSON object (for any given user) with the following properties:

```TypeScript
{
    creds: {
        customFields: string[]; // 2 items
        iat: string;
        issuerAddress: string;
        scope: string;
        secret: string;
        serializedAsPreimage: string[]; // 6 items
    };
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
};
```

These properties are already in the return value of the `issue` function from the `holonym-wasm-issuer` package. When calling `issue`, you just need to specify a private key and two custom fields in the issued leaf.

We also encourage issuers to add a `metadata` field to the JSON object that includes, at minimum, a `rawCreds` object. This will allow Holonym to display the user's data in the app. We also encourage issuers to include a `derivedCreds` field and a `fieldsInLeaf` field in the metadata object so that developers who are dealing with the object can easily reconstruct the issued leaf for Merkle proofs. For example:

```TypeScript
{
    metadata: {
        rawCreds: {
            name: string;
            birthdate: string;
        };
        derivedCreds: {
            streetHash: {
                value: string;
                derivationFunction: string;
                inputFields: string[];
            };
        };
        fieldsInLeaf: string[];
    };
    creds: {
        // ...
    };
    leaf: string; // hex string
    pubkey: {
        // ...
    };
    signature: {
        // ...
    };
};
```

This example issuer includes a `metadata` field with all of the recommended properties.

More info on the properties of the `metadata` field:

`rawCreds` is an object containing the unaltered credentials. For example, a "raw" credential might be a user's first name, "John".

`derivedCreds` is an object containing the derived credentials. For example, a derived credential might be a hash of the concatenation of the user's first name, middle name, and last name. The purpose of `derivedCreds` is to allow issuers to pack more than 2 credentials into a single leaf.

`fieldsInLeaf` includes the names of the fields to be passed as input to the poseidon hash function to produce a leaf in the Merkle tree. The `fieldsInLeaf` property must contain exactly six fields, and certain fields are required: `issuer` must be the 0th element, `secret` must be the 1st element, `scope` must be the 5th element. The remaining three fields are optional. The following is an example of a valid `fieldsInLeaf` array:

```TypeScript
[
    "issuer", // Required.
    "secret", // Required.
    "rawCreds.firstName",
    "rawCreds.middleName",
    "iat", // Required.
    "scope", // Required.
]
```

The syntax used in `fieldsInLeaf` follows the JSON dot notation convention (used by MongoDB, for example). In the above example, `rawCreds.firstName` means that the value of the `firstName` field in the `rawCreds` object is to be used.

### Redirect requirements

In order for a user to use their credentials with Holonym, the user must retrieve them from the Holonym frontend.

Once a user has registered with the issuer, the issuer must redirect the user to the following URL:

```bash
https://app.holonym.id/mint/external/store?retrievalEndpoint=<retrievalEndpoint>
```

where `<retrievalEndpoint>` is the base64-encoded URL of the endpoint from which the user's credentials can be retrieved. For example, the url might be `https://example.com/api/issuer?userId=0`, so the `retrievalEndpoint` would be `aHR0cHM6Ly9leGFtcGxlLmNvbS9hcGkvaXNzdWVyP3VzZXJJZD0x`.

#### Pull request

You will need to submit a pull request to the [Holonym frontend](https://github.com/holonym-foundation/zk-frontend/) to add your issuer to the issuer whitelist.

In your PR, please include:

1. The type of credential you are adding (e.g., "university degree").
2. The issuer address (i.e., the `issuerAddress` property on the `creds` object described above).
3. A link to the GitHub repo of your issuer.
4. The name of your organization (if applicable).

## Issuer frontend considerations

We expect the issuer to implement their own frontend since the UI/UX needs of each issuer will likely be idiosyncratic. However, we provide a simple frontend in this example issuer to illustrate how the frontend fits into the credential issuance flow.

## Organization of `src` folder

- `backend/init.ts` - Initializes resources used by the server. In this example, the only resource used is a database.
- `backend/issuer.ts` - Includes the `Issuer` class that processes GET requests to the server.
- `backend/constants.ts` - Includes constants used by the server.
- `backend/utils.ts` - Includes utility functions used by the server.
- `pages/api/issuer.ts` - Includes the API request router for the issuer.
- `pages/api/mock-provider.ts` - Includes a mock 3rd party identity provider used by the example issuer.
- `pages/index.tsx` - Includes the example frontend for the issuer.

## Support and feedback

If you have questions, feedback, or run into issues, hop into our [Discord server](https://discord.gg/zPzsEAXrQt) and leave a message in the #issuers channel.
