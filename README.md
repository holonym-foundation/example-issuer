# Example Holonym Issuer

To create a Holonym Issuer, follow the TODOs in the code.

NOTE: The issuer is designed to handle GET requests. If your issuer server must handle POST requests during the user verification flow, you will need to add a handler for POST requests.

## Organization of src folder

- `server.js` - Starts the server, registers routes, and handles termination.
- `init.js` - Initializes resources used by the server. In this example, the only resource used is a database.
- `issuer.js` - Includes the `Issuer` class that processes requests to the server.
- `constants.js` - Includes constants used by the server.
- `utils.js` - Includes utility functions used by the server.

## Requirements

- Node.js ^16.0.0

## Local environment setup

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
