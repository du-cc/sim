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
npm install https://github.com/du-cc/sim.git
```

## Example Usage
```js
const SIM = require("sim");
const OutSystems = SIM.OutSystems;
const b2c = SIM.B2c;

var url = "REDACTED"; // api full url
var auth = await b2c.authenticate("COOKIE"); // ESTSAUTHPERSISTENT cookie, authenticates Microsoft b2c

var os = new OutSystems();

// authenticate via b2c's saml
var os_auth = await os.authenticate(auth.saml, auth.cookie);
// OR use existing credentials
var os_2 = new Outsystems(csrf, nrCookies);

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

### Integrations
- [sim-calendar](https://github.com/du-cc/sim-calendar) - Extracts class schedule and convert them into .ics file.

### AI
- Code: None
- Other: Assist on analyzing network traffic