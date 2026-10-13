// This is basically automated Microsoft B2C Login for SIM Uni
//
// I think this is the first automated login script ever? for b2c flow
// Feel free to modify to fit your needs

// ESTSAUTHPERSISTENT Cookie
// const MICROSOFT_LOGIN_COOKIE =

import { Log, request, parseCookies } from "./misc.mjs";

var logger = new Log("b2c.mjs");

export async function authenticate(MICROSOFT_LOGIN_COOKIE) {
  // start
  // flow for getting stateProperties

  var login = await request(
    "get",
    "https://simattendance.simge.edu.sg/IdP/Login.aspx?FromMobile=True&AppConfigId=5",
    { redirect: false },
  );

  var loginUrl = login.headers.get("location");
  logger.log("INFO", "loginUrl");
  var simCookies = login.headers.get("set-cookie");
  simCookies = parseCookies(simCookies).replace(
    /;\s*\d{2}-[A-Za-z]{3}-\d{4}\s\d{2}:\d{2}:\d{2}\sGMT/g,
    "",
  );

  // csrf for authapi
  // cookies ARE CRUCIAL >:(

  // csrf for authapi
  // why they want to make it 2 step????
  var csrf_prestate = await request("get", loginUrl);
  var csrf_prestate_text = await csrf_prestate.text();
  logger.log("INFO", "pre-csrf");
  // then pass csrf to authapi

  var csrf = csrf_prestate_text.match(/csrf\"\:\"(.*?)\"/)[1];
  logger.log("INFO", "csrf");
  // MSCookies are used in authapi and oauth
  var prestate = csrf_prestate_text.match(/StateProperties=(.*?)\"/)[1];
  logger.log("INFO", "prestate");

  var MSCookies = csrf_prestate.headers.get("set-cookie");
  MSCookies = parseCookies(MSCookies);
  logger.log("INFO", "microsoft cookies");

  // finally getting stateProperties
  var state_req = await request(
    "get",
    `https://simb2c.b2clogin.com/simb2c.onmicrosoft.com/B2C_1A_signup_signin_MYSIM_STUDENT_PROD/api/CombinedSigninAndSignup/unified?claimsexchange=SIM-STUDENT-AzureADExchange&csrf_token=${encodeURIComponent(
      csrf,
    )}&tx=StateProperties=${encodeURIComponent(
      prestate,
    )}&p=B2C_1A_signup_signin_MYSIM_STUDENT_PROD`,
    { cookie: MSCookies, redirect: false },
  );
  var state_text = await state_req.text();

  var state = state_text.match(/state\=(.*)\"/)[1];
  state = decodeURIComponent(state);
  logger.log("INFO", "stateProperties");

  // AND REFRESHING THE DAMN COOKIES AGAIN >:( I luv u microsoft <3
  MSCookies = parseCookies(state_req.headers.get("set-cookie"));
  logger.log("INFO", "microsoft cookies 2");

  // dynamic url are better than premade url cuz why not?
  var authUrl = state_text.match(/href\=\"(.*?)\"/)[1];
  // dumb &amp; thing
  authUrl = authUrl.replace(/&amp;/g, "&");
  logger.log("INFO", "authentication url");

  // flow for authentication
  // code and session
  logger.log("SUCCESS", "init done, now authenticating");

  var auth = await request("get", authUrl, {
    cookie: "ESTSAUTHPERSISTENT=" + MICROSOFT_LOGIN_COOKIE,
    redirect: false,
  });

  // check if cookie/login invalid
  var auth_text = await auth.text();
  if (auth_text.includes("<title>Sign in to your account</title>")) {
    logger.log(
      "ERROR",
      "LOGIN/COOKIE INVALID, MAKE SURE YOU'VE PASTED ESTSAUTHPERSISTENT COOKIE, OR TRY RE-LOGIN AND REPASTE THE COOKIE",
    );
    process.exit();
  }

  logger.log("SUCCESS", "authenticated!");
  // extract from auth response form thingy
  var code = auth_text.match(/name="code"\s+value="(.*?)"/)[1];
  var session = auth_text.match(/name="session_state"\s+value="(.*?)"/)[1];
  logger.log("INFO", "auth code, session");

  // getting SAMLResponse
  var SAML = await request(
    "post",
    "https://simb2c.b2clogin.com/simb2c.onmicrosoft.com/oauth2/authresp",
    {
      cookie: MSCookies,
      body: `code=${encodeURIComponent(code)}&state=${encodeURIComponent(
        state,
      )}&session_state=${encodeURIComponent(session)}`,
      bodyType: "application/x-www-form-urlencoded",
    },
  );

  SAML = (await SAML.text()).match(/value\=\'(.*?)\'\//)[1];
  logger.log("INFO", "saml");

  return { saml: SAML, cookie: simCookies };
}
