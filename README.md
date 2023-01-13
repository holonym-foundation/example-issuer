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
4. Holonym retrieves user data. Given the `retrievalEndpoint` with the `userId`, Holonym requests the user's data from the issuer's server. At this time, the issuer formats the user's credentials and signs them so that they can be used to generate zero knowledge proofs.
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

`issuer` must be the issuer's blockchain address. It must belong to the account that generated the `signature`.

`secret` is a 16 byte secret represented as a hex string.

`scope` represents the scope of the credentials being issued. A scope of `0` means that the credentials are valid anywhere. A different scope means that the credentials are only valid for a specific domain. We recommend setting scope to `0`.

`signature` is the signature of the poseidon hash of the values of the fields in `fieldsInLeaf`. There is an example in the code, but for illustration, here is some pseudocode for generating the signature:

```TypeScript
signature = sign(poseidon(fieldsInLeaf.map((field) => get(field))));
```

`rawCreds` is an object containing the unaltered credentials. For example, a "raw" credential might be a user's first name, "John".

`derivedCreds` is an object containing the derived credentials. For example, a derived credential might be a hash of the concatenation of the user's first name, middle name, and last name. The purpose of `derivedCreds` is to allow issuers to pack more than 3 credentials into a single leaf.

`fieldsInLeaf` includes the names of the fields to be passed as input to the poseidon hash function to produce a leaf in the Merkle tree. The `fieldsInLeaf` property must contain exactly six fields, and certain fields are required: `issuer` must be the 0th element, `secret` must be the 1st element, `scope` must be the 5th element. The remaining three fields are optional. The following is an example of a valid `fieldsInLeaf` array:

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

### Redirect requirements

In order for a user to use their credentials with Holonym, the user must retrieve them from the Holonym frontend.

Once a user has registered with the issuer, the issuer must redirect the user to the following URL:

```bash
https://app.holonym.id/mint/external/store?retrievalEndpoint=<retrievalEndpoint>
```

where `<retrievalEndpoint>` is the base64-encoded URL of the endpoint from which the user's credentials can be retrieved. For example, the url might be `https://example.com/api/issuer?userId=0`, so the `retrievalEndpoint` would be `aHR0cHM6Ly9leGFtcGxlLmNvbS9hcGkvaXNzdWVyP3VzZXJJZD0x`.

#### Pull request

You will need to submit a pull request to the [Holonym frontend](https://github.com/holonym-foundation/zk-frontend/) to add your credential type to the list of whitelisted credential types.

In your PR, please include:

1. The type of credential you are adding (e.g., "university degree").
2. A link to the GitHub repo of your issuer.
3. The name of your organization (if applicable).

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
