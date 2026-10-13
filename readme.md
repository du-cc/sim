# MySIMApp API Wrapper

Contains full set of scripts to fully authenticate and interact with MySIMApp's OutSystems API.

> [!WARNING]
>
> Educational purpose only. **DO NOT** use it for unintended purpose. **I AM NOT** responsible to any disciplinary actions caused by this program.

## Questions? Bugs? Issues?

- Submit them via issues. [link](https://github.com/du-cc/sim/issues/new/choose)

## Installation

### Requires NodeJS

Download via git
```bash
git clone https://github.com/du-cc/sim.git
```

## Example Usage
```js
import * as b2c from "../src/b2c.mjs";
import { OutSystems } from "../src/outsystems.mjs";

var url = "REDACTED"; // api full url
var auth = await b2c.authenticate("COOKIE"); // ESTSAUTHPERSISTENT cookie, authenticates Microsoft b2c

var os = new OutSystems();
var os_auth = await os.authenticate(auth.saml, auth.cookie); // authenticates outsystems api

// fetches version info
var versionInfo = {
  moduleVersion: await OutSystems.fetchModuleVersion(),
  apiVersion: await OutSystems.fetchApiVersion(url),
};

var data = {};

var out = await os.interact(url, versionInfo, data); // interacts with api
console.log(JSON.stringify(await out.json()));
```

## Development

This repo has already done the most difficult part (Authentication and VersionData) fetching. You can expand it to interact with more API endpoints (eg: Room Booking).
