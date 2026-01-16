// This is basically automated Microsoft B2C Login for SIM Uni
//
// I think this is the first automated login script ever? for b2c flow
// Feel free to modify to fit your needs

// ESTSAUTHPERSISTENT Cookie
// const MICROSOFT_LOGIN_COOKIE =

import { log, request, parseCookies } from "./misc.mjs";

export async function authenticate(MICROSOFT_LOGIN_COOKIE) {
  // start
  log("b2c.mjs", "INFO", "FUNC", "Authenticate", "info");
  // flow for getting stateProperties
  log("b2c.mjs", "stateProperties", "FETCH", "loginUrl");

  var login = await request(
    "get",
    "https://simattendance.simge.edu.sg/IdP/Login.aspx?FromMobile=True&AppConfigId=5",
    null,
    false
  );

  var loginUrl = login.headers.get("location");
  log("b2c.mjs", "stateProperties", "EXTRACT", `loginUrl: ${loginUrl}`);
  var simCookies = login.headers.get("set-cookie");
  simCookies = parseCookies(simCookies).replace(
    /;\s*\d{2}-[A-Za-z]{3}-\d{4}\s\d{2}:\d{2}:\d{2}\sGMT/g,
    ""
  );
  log("b2c.mjs", "stateProperties", "EXTRACT", `simCookies: ${simCookies}`);

  // csrf for authapi
  // cookies ARE CRUCIAL >:(
  log("b2c.mjs", "stateProperties", "FETCH", "pre-CSRF");

  // csrf for authapi
  // why they want to make it 2 step????
  var csrf_prestate = await request("get", loginUrl);
  var csrf_prestate_text = await csrf_prestate.text();
  // then pass csrf to authapi
  log("b2c.mjs", "stateProperties", "FETCH", "CSRF, prestate, MSCookies");

  var csrf = csrf_prestate_text.match(/csrf\"\:\"(.*?)\"/)[1];
  log("b2c.mjs", "stateProperties", "EXTRACT", `CSRF: ${csrf}`);

  // MSCookies are used in authapi and oauth
  var prestate = csrf_prestate_text.match(/StateProperties=(.*?)\"/)[1];
  log("b2c.mjs", "stateProperties", "EXTRACT", `prestate: ${prestate}`);
  var MSCookies = csrf_prestate.headers.get("set-cookie");
  MSCookies = parseCookies(MSCookies);
  log("b2c.mjs", "stateProperties", "EXTRACT", `MSCookies: ${MSCookies}`);

  // finally getting stateProperties
  log("b2c.mjs", "stateProperties", "FETCH", "stateProperties");
  var state_req = await request(
    "get",
    `https://simb2c.b2clogin.com/simb2c.onmicrosoft.com/B2C_1A_signup_signin_MYSIM_STUDENT_PROD/api/CombinedSigninAndSignup/unified?claimsexchange=SIM-STUDENT-AzureADExchange&csrf_token=${encodeURIComponent(
      csrf
    )}&tx=StateProperties=${encodeURIComponent(
      prestate
    )}&p=B2C_1A_signup_signin_MYSIM_STUDENT_PROD`,
    MSCookies,
    false
  );
  var state_text = await state_req.text();

  var state = state_text.match(/state\=(.*)\"/)[1];
  state = decodeURIComponent(state);
  log("b2c.mjs", "stateProperties", "EXTRACT", `stateProperties: ${state}`);

  // AND REFRESHING THE DAMN COOKIES AGAIN >:( I luv u microsoft <3
  MSCookies = parseCookies(state_req.headers.get("set-cookie"));
  log("b2c.mjs", "MS-Auth", "EXTRACT", `MSCookies: ${MSCookies}`);

  // dynamic url are better than premade url cuz why not?
  var authUrl = state_text.match(/href\=\"(.*?)\"/)[1];
  // dumb &amp; thing
  authUrl = authUrl.replace(/&amp;/g, "&");
  log("b2c.mjs", "MS-Auth", "EXTRACT", `authUrl: ${authUrl}`);

  // flow for authentication
  // code and session
  log(
    "b2c.mjs",
    "INFO",
    "STATUS",
    "Authenticating with Microsoft",
    "info"
  );
  log("b2c.mjs", "MS-Auth", "FETCH", "code, session");

  var auth = await request("get", authUrl, MICROSOFT_LOGIN_COOKIE, false);

  // check if cookie/login invalid
  var auth_text = await auth.text();
  if (auth_text.includes("<title>Sign in to your account</title>")) {
    log(
      "b2c.mjs",
      "MS-Auth",
      "ERROR",
      "LOGIN/COOKIE INVALID, MAKE SURE YOU'VE PASTED ESTSAUTHPERSISTENT COOKIE, OR TRY RE-LOGIN AND REPASTE THE COOKIE",
      "error"
    );
    process.exit();
  }

  log("b2c.mjs", "INFO", "STATUS", "Authenticated!", "success");

  // extract from auth response form thingy
  var code = auth_text.match(/name="code"\s+value="(.*?)"/)[1];
  var session = auth_text.match(/name="session_state"\s+value="(.*?)"/)[1];
  log("b2c.mjs", "MS-Auth", "EXTRACT", `code: ${code}`);
  log("b2c.mjs", "MS-Auth", "EXTRACT", `session: ${session}`);

  log("b2c.mjs", "MS-Auth", "FETCH", "SAMLResponse");
  // getting SAMLResponse
  var SAML = await request(
    "post",
    "https://simb2c.b2clogin.com/simb2c.onmicrosoft.com/oauth2/authresp",
    MSCookies,
    true,
    `code=${encodeURIComponent(code)}&state=${encodeURIComponent(
      state
    )}&session_state=${encodeURIComponent(session)}`,
    "application/x-www-form-urlencoded"
  );

  SAML = (await SAML.text()).match(/value\=\'(.*?)\'\//)[1];
  log("b2c.mjs", "MS-Auth", "EXTRACT", `SAML: ${SAML}`);

  log("b2c.mjs", "INFO", "END", "b2c.mjs", "info");
  return [SAML, simCookies];
}
