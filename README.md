# ari-typescript-examples

Asterisk REST Interface TypeScript Examples

## Introduction

This project includes TypeScript versions of the examples published on project https://github.com/asterisk/node-ari-client.
It uses the TypeScript definitions @types/ari-client for the ari-client Node.js module. The purpose of the @types/ari-client
definitions and these examples is to facilitate the development of applications based on ARI.

### Configuration

Before running any example or tests, you have to create a .env file at the root of the project and set the
URL and credentials of the development Asterisk box you want to connect to.

```sh
ARI_URL=http://127.0.0.1:8888/ari
ARI_USERNAME=username
ARI_PASSWORD=password
```

These parameters can be easily retrieved by importing src/config.ts:

```javascript
import { url, username, password } from '../src/config';
```

> Note: in order to setup your Asterisk to use ARI, follow the instructions in https://wiki.asterisk.org/wiki/display/AST/Asterisk+Configuration+for+ARI.

## Running Examples

Examples in folder src/examples are divided into callbacks and promises. The callbacks folder contains the TypeScript versions of
the examples published on https://github.com/asterisk/node-ari-client using callback functions. The promises folder contains the
TypeScript version of the same examples, but using promises and async/await syntax.

```sh
+-- examples
| +-- callbacks
| +-- promises
```

You can run any of these examples by executing the command:

```sh
npm run dev example-file [promises/callbacks]
```

Just replace "example-file" with the name of the example file you want to run (bridge, mwi, etc.), followed by the corresponding
version (promises or callbacks). By default promises versions are run if no version parameter is passed.

### TypeScript

This project uses TypeScript definitions (@types/ari-client) for the ari-client Node.js module.
In TypeScript you can import resources from the library as follows.

```typescript
import Ari, { Channel, Bridge } from 'ari-client';
```

Default module export "Ari" exposes the connect() function. You can connect to an Asterisk instance as follows:

```typescript
// Using promises (async/await).
const client = await Ari.connect(url, username, password);
console.log(`Now connected to ${url}`);

// Using a callback function.
Ari.connect(url, username, password, (err, client) => {
    console.log(`Now connected to ${url}`);
});
```

## Running Test

You can run a series of tests against the Asterisk instance defined in .env file as follows:

```sh
npm run test
```

#### IMPORTANT: Do not run these tests against a production Asterisk box.

If you receive warnings like the following when running tests, it is because the corresponding Asterisk primitive object list is empty.

```sh
  console.warn
    No channels found to check Channel object.
```

You can find in src/fixtures folder the ARI resource files of an Asterisk 16.4.0. As explained in node-ari-client
documentation (https://github.com/asterisk/node-ari-client/blob/master/README.md), fixtures for ARI resources can be
generated from a local Asterisk instance by running the following:

```bash
$ grunt genfixtures
```

These files are only used during tests to verify that objects received from the Asterisk box have the expected properties.
