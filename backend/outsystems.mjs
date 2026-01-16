import { log, request, parseCookies, store } from "./misc.mjs";
import * as b2c from "./b2c.mjs";

var MICROSOFT_LOGIN_COOKIE = await store("get", "MICROSOFT_LOGIN_COOKIE");
if (MICROSOFT_LOGIN_COOKIE == null) {
  log(
    "outsystems.mjs",
    "SCRIPT",
    "ERROR",
    "No Microsoft Login Cookie Detected.",
    "error"
  ) & process.exit();
}

var CSRF = await store("get", "csrf");

var nr_expire = await store("get", "nr_expire");
var nr_cookies = await store("get", "nr_cookies");

async function getVersion(module, endpoint) {
  // var moduleInfo_req = await request("get", `https://simattendance.simge.edu.sg/StudentApp/moduleservices/moduleinfo?${moduleVersion}`)
  log("outsystems.mjs", "INFO", "FUNC", "getVersion", "info");
  log("outsystems.mjs", "INFO", "STATUS", "Getting version info", "info");

  var map = JSON.parse(await store("get", "map", null, "json", false));

  if (!map[module]) {
    log(
      "outsystems.mjs",
      "getVersion",
      "ERROR",
      `(MODULE: ${module}) not found in map.js!`,
      "error"
    ) & process.exit();
  }
  if (!map[module].endpoints[endpoint]) {
    log(
      "outsystems.mjs",
      "getVersion",
      "ERROR",
      `(ENDPOINT: ${endpoint}) not found in map.js!`,
      "error"
    ) & process.exit();
  }

  log("outsystems.mjs", "getVersion", "FETCH", "apiVersion, moduleVersion");

  var apiVersion = map[module].apiVersion[endpoint];
  var moduleVersion = map.moduleVersion;

  log("outsystems.mjs", "getVersion", "EXTRACT", `apiVersion: ${apiVersion}`);
  log(
    "outsystems.mjs",
    "getVersion",
    "EXTRACT",
    `moduleVersion: ${moduleVersion}`
  );

  log("outsystems.mjs", "INFO", "STATUS", "Validating version info", "info");
  var validation_body =
    "universal" in map[module].mockData
      ? map[module].mockData.universal
      : map[module].mockData[endpoint];
  validation_body.versionInfo.moduleVersion = moduleVersion;
  validation_body.versionInfo.apiVersion = apiVersion;

  log("outsystems.mjs", "getVersion", "FETCH", "validation");

  // one line cuz i feel like it
  // flow:
  // var validation = await request(map[module].method, `https://simattendance.simge.edu.sg/StudentApp/${map[module].path}${map[module].endpoints[endpoint]}`, null, true, JSON.stringify(validation_body),"application/json")
  // validation = await validation.text()
  // validation = JSON.parse(validation)
  var validation = JSON.parse(
    await (
      await request(
        map[module].method,
        `https://simattendance.simge.edu.sg/StudentApp/${map[module].path}${map[module].endpoints[endpoint]}`,
        null,
        true,
        JSON.stringify(validation_body),
        "application/json"
      )
    ).text()
  ).versionInfo;

  var apiValidation = validation.hasApiVersionChanged;
  var moduleValidation = validation.hasModuleVersionChanged;

  log(
    "outsystems.mjs",
    "getVersion",
    "EXTRACT",
    `apiValidation: ${apiValidation}`
  );
  log(
    "outsystems.mjs",
    "getVersion",
    "EXTRACT",
    `moduleValidation: ${moduleValidation}`
  );

  if (apiValidation) {
    log(
      "outsystems.mjs",
      "INFO",
      "STATUS",
      "apiVersion changed. Fetching a new one.",
      "info"
    );
    // flow of oneline:
    // var latestApiVersion = await request("get", `https://simattendance.simge.edu.sg/StudentApp/scripts/${map[module].script}`)
    // latestApiVersion = await latestApiVersion.text()
    // var regex = new RegExp(`["'](${map[module].path.replace("/", "/")}${map[module].endpoints[endpoint]})["']\\s*,\\s*["']([a-zA-Z0-9\\-_]{22})["']`)
    // latestApiVersion = latestApiVersion.match(regex)[2]
    log("outsystems.mjs", "getVersion", "FETCH", "latestApiVersion");
    var latestApiVersion = (
      await (
        await request(
          "get",
          `https://simattendance.simge.edu.sg/StudentApp/scripts/${map[module].script}`
        )
      ).text()
    ).match(
      new RegExp(
        `["'](${map[module].path.replace("/", "/")}${
          map[module].endpoints[endpoint]
        })["']\\s*,\\s*["']([a-zA-Z0-9\\-_]{22})["']`
      )
    )[2];

    log(
      "outsystems.mjs",
      "getVersion",
      "EXTRACT",
      `latestApiVersion: ${latestApiVersion}`
    );

    map[module].apiVersion[endpoint] = latestApiVersion;
    await store("write", "map", JSON.stringify(map, null, 2), "json", false);
  }

  if (moduleValidation) {
    log(
      "outsystems.mjs",
      "INFO",
      "STATUS",
      "moduleVersion changed. Fetching a new one.",
      "info"
    );

    log("outsystems.mjs", "getVersion", "FETCH", "latestModuleVersion");

    var latestModuleVersion = (
      await (
        await request(
          "get",
          `https://simattendance.simge.edu.sg/StudentApp/moduleservices/moduleversioninfo?_=${Date.now()}`
        )
      ).json()
    ).versionToken;

    log(
      "outsystems.mjs",
      "getVersion",
      "EXTRACT",
      `latestModuleVersion: ${latestModuleVersion}`
    );

    map.moduleVersion = latestModuleVersion;
    await store("write", "map", JSON.stringify(map, null, 2), "json", false);
  }

  log("outsystems.mjs", "INFO", "STATUS", "versionInfo is valid!", "success");
  return {
    apiVersion: map[module].apiVersion[endpoint],
    moduleVersion: map.moduleVersion,
  };
}

async function authenticate(cookie) {
  // Authenticate via b2c
  var SAML_simCookies = await b2c.authenticate(cookie);
  var SAML = SAML_simCookies[0];
  var simCookies = SAML_simCookies[1];
  // logging in to SIM, formally
  // "We are in."
  log("outsystems.mjs", "SIM-Auth", "STATUS", "Logging in into SIM", "info");
  log("outsystems.mjs", "SIM-Auth", "FETCH", "token");
  var token_req = await request(
    "post",
    "https://simattendance.simge.edu.sg/IdP/SSO.aspx",
    simCookies,
    true,
    `SAMLResponse=${encodeURIComponent(SAML)}`,
    "application/x-www-form-urlencoded",
    CSRF
  );
  var token_text = await token_req.text();

  // I have decided to leave this because I had been debugging this DAMN **** ****ING issue for 2 DAYS STRAIGHT (IM NOT KIDDING)
  // The problem is my dumbass mind thinking I can hijack authentication url by changing intended form_post to query, so that I can extract code and session values
  // Then the MICROSOFT decides that everything need to be untouched, and rejected my request BY GIVING ME AN INVALID SAML, NOT 400 or something, A BASE64 ENCRYPTED STRING
  // I first thought it is session cookies problem, I tried, and tried, even reading Microsoft's entraID, Azure AD B2C docs, retrying to recapture fresh packets, still nothing...
  // After tinkering for SO LONG, I suddenly recognised that pattern is base64, I tried to decode it..
  // AND... I finally know that it is an invalid SAMLRequest... WHAT THE **** MAN
  // The info... It is useless. I just think of everything but still NO
  // Then I thought of.. everything has been modified so it is NEARLY EQUAL to original, authentic request, the remaining modified and not authentic thing is the form_post and query
  // Tried to undo it with a new method by hijacking the form_post response...
  // Works.................
  // Thanks for listening (reading) to my TED Talk :)
  if (token_text.includes("UNABLE")) {
    console.log("outsystems.mjs", "ASS");
    process.exit();
  }
  log("outsystems.mjs", "INFO", "STATUS", "Log in success!", "success");

  var token = token_text.match(
    /MobileCloseInAppPoint\.aspx\?token\=(.*?)\"/
  )[1];
  log("outsystems.mjs", "SIM-Auth", "EXTRACT", `token: ${token}`);

  // FINALLY getting nr1 and nr2 cookies YAY :D
  log("outsystems.mjs", "SIM-Auth", "FETCH", "nr1, nr2, csrf");
  var samlLogin_arg = {
    versionInfo: {
      moduleVersion: "5w6hotJEIxu2zmE6tm9zzw",
      apiVersion: "JrmMN0bhBbVx9IoXpgkwnA",
    },
    viewName: "IdP.LoginStudentIdP",
    inputParameters: {
      Token: token,
      RememberLogin: true,
    },
  };
  var samlLogin = await request(
    "post",
    "https://simattendance.simge.edu.sg/StudentApp/screenservices/IdPMobile/IdPMobileFlow/SamlLogin/ActionUserLogin_Mobile",
    simCookies,
    true,
    JSON.stringify(samlLogin_arg),
    "application/json",
    CSRF
  );

  var nr_cookies = samlLogin.headers.getSetCookie();
  var nr_cookies_age = Infinity;
  // remove max age other shit
  for (let i = 0; i < nr_cookies.length; i++) {
    // extracting max age
    var age = Number(nr_cookies[i].match(/Max-Age=(.*?)\;/)[1]);
    nr_cookies_age = nr_cookies_age > age ? age : nr_cookies_age;
    nr_cookies[i] = nr_cookies[i].replace(/ Max-Age=.*/g, "");
  }

  nr_expire = new Date();
  nr_expire.setSeconds(nr_expire.getSeconds() + nr_cookies_age);
  nr_expire = nr_expire.getTime();
  await store("write", "nr_expire", nr_expire);

  // extract csrf via nr2, pretty hidey huh :)
  var sCSRF = decodeURIComponent(nr_cookies[1]).match(/crf\=(.*?)\;/)[1];
  log("outsystems.mjs", "SIM-Auth", "EXTRACT", `CSRF: ${sCSRF}`);
  await store("write", "csrf", sCSRF);

  // then parse cookies
  var nr_cookies = parseCookies(nr_cookies);
  log("outsystems.mjs", "SIM-Auth", "EXTRACT", `nr_cookies: ${nr_cookies}`);

  return [nr_cookies, sCSRF];
}

export async function interact(module, endpoint, data) {
  log("outsystems.mjs", "INFO", "FUNC", "interact", "info");

  if (
    nr_expire == null ||
    nr_expire < Date.now() ||
    nr_cookies == null ||
    CSRF == null
  ) {
    log(
      "outsystems.mjs",
      "INFO",
      "STATUS",
      "Cookie/CSRF is missing/expired, fetching a new one"
    );
    log("outsystems.mjs", "interact", "FETCH", "latestCookie, CSRF");
    CSRF = "T6C+9iB49TLra4jEsMeSckDMNhQ=";
    var authData = await authenticate(MICROSOFT_LOGIN_COOKIE);
    var latestCookie = authData[0];
    CSRF = authData[1];

    log(
      "outsystems.mjs",
      "interact",
      "EXTRACT",
      `latestCookie: ${latestCookie}`
    );
    log("outsystems.mjs", "interact", "EXTRACT", `CSRF: ${CSRF}`);

    store("write", "nr_cookies", latestCookie);
    store("write", "csrf", CSRF);

    nr_cookies = latestCookie;
  }

  log("outsystems.mjs", "interact", "FETCH", "apiVersion, moduleVersion");
  var api_module_version = await getVersion(module, endpoint);
  var apiVersion = api_module_version.apiVersion;
  var moduleVersion = api_module_version.moduleVersion;
  log("outsystems.mjs", "interact", "EXTRACT", `apiVersion: ${apiVersion}`);
  log(
    "outsystems.mjs",
    "interact",
    "EXTRACT",
    `moduleVersion: ${moduleVersion}`
  );

  var map = await store("get", "map", null, "json", false);
  map = JSON.parse(map);

  data.versionInfo.apiVersion = apiVersion;
  data.versionInfo.moduleVersion = moduleVersion;

  log(
    "outsystems.mjs",
    "interact",
    "EXTRACT",
    `data: ${JSON.stringify(data)}`
  );

  log("outsystems.mjs", "INFO", "STATUS", `Sending interaction request - Module: ${module}, Endpoint: ${endpoint}`)
  return await request(
    map[module].method,
    `https://simattendance.simge.edu.sg/StudentApp/${map[module].path}${map[module].endpoints[endpoint]}`,
    nr_cookies,
    true,
    JSON.stringify(data),
    "application/json",
    CSRF
  );
}
