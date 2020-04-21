# ari-typescript-examples

Asterisk REST Interface TypeScript Examples

## Usage

This project includes TypeScript versions of the examples published on project https://github.com/asterisk/node-ari-client.
This project uses TypeScript definitions (@types/ari-client) for the ari-client Node.js module.

### Configuration

Set Asterisk instance url and credentials in order to run tests.

```sh
ARI_URL=http://127.0.0.1:8888/ari
ARI_USERNAME=username
ARI_PASSWORD=password
```

These parameters could be easily retrieve by importing src/config.ts:

```javascript
import { url, username, password } from '../src/config';
```

### TypeScript

This project uses TypeScript definitions (@types/ari-client) for the ari-client Node.js module.
Now you can import resources from the library as follows.

```typescript
import Ari, { Channel, Bridge } from 'ari-client';
```

Default module export Ari exposes the connect() function. You can connect to an Asterisk instance as follows:

```typescript
// Using promises (async/await).
const client = await Ari.connect(url, username, password);
// Using callback.
Ari.connect(url, username, password, (err, client) => {});
```

## Test

You can run a series of test against the Asterisk instance defined in .env as follows:

```sh
npm run test
```

IMPORTANT: Do not run these tests against a production Asterisk box.

You could receive warnings like the following when running tests. It is because channels, bridges, endpoints, etc., list is empty.

```sh
  console.warn
    No channels found to check Channel object.
```

This project includes ARI resource files (src/fixtures) from an Asterisk 16.4.0 server. As explained in node-ari-client
documentation (https://github.com/asterisk/node-ari-client/blob/master/README.md), fixtures for ARI resources can be
generated from a local Asterisk instance by running the following:

```bash
$ grunt genfixtures
```

These files are only used during tests to verify that objects received from Asterisk have the expected properties.
