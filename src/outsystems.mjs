import { Log, request, parseCookies, Store } from "./misc.mjs";

export class OutSystems {
  constructor(csrf, nr_cookies) {
    this.csrf = csrf;
    this.nr_cookies = nr_cookies;
  }

  static async fetchModuleVersion() {
    return (
      await (
        await request(
          "GET",
          "https://simattendance.simge.edu.sg/StudentApp/moduleservices/moduleversioninfo",
        )
      ).json()
    ).versionToken;
  }

  static async fetchApiVersion(url) {
    var endpoint = url.match(/[^\/]+$/)[0];
    var version_url =
      "https://simattendance.simge.edu.sg/StudentApp/scripts/" +
      url
        .replace(
          /^(https:\/\/simattendance.simge.edu.sg\/StudentApp\/screenservices\/)|(\/[^\/]+)$/g,
          "",
        )
        .replace(/\//g, ".") +
      ".mvc.js";

    var version_req = await request("GET", version_url);
    return (await version_req.text()).match(
      new RegExp(String.raw`(?<=\/${endpoint}", ")([^"]+)`),
    )[0];
  }

  async authenticate(SAML, simCookies) {
    // logging in to SIM, formally
    // "We are in."
    // log("outsystems.mjs", "SIM-Auth", "STATUS", "Logging in into SIM", "info");
    // log("outsystems.mjs", "SIM-Auth", "FETCH", "token");
    var token_req = await request(
      "post",
      "https://simattendance.simge.edu.sg/IdP/SSO.aspx",
      {
        cookie: simCookies,
        body: `SAMLResponse=${encodeURIComponent(SAML)}`,
        bodyType: "application/x-www-form-urlencoded",
        csrf: this.csrf,
      },
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
    // log("outsystems.mjs", "INFO", "STATUS", "Log in success!", "success");

    var token = token_text.match(
      /MobileCloseInAppPoint\.aspx\?token\=(.*?)\"/,
    )[1];
    // log("outsystems.mjs", "SIM-Auth", "EXTRACT", `token: ${token}`);

    // FINALLY getting nr1 and nr2 cookies YAY :D
    // log("outsystems.mjs", "SIM-Auth", "FETCH", "nr1, nr2, csrf");
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
      {
        cookie: simCookies,
        body: JSON.stringify(samlLogin_arg),
        bodyType: "application/json",
        csrf: this.csrf,
      },
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

    var nr_expire = new Date();
    nr_expire.setSeconds(nr_expire.getSeconds() + nr_cookies_age);
    nr_expire = nr_expire.getTime();
    // await store("write", "nr_expire", nr_expire);

    // extract csrf via nr2, pretty hidey huh :)
    var sCSRF = decodeURIComponent(nr_cookies[1]).match(/crf\=(.*?)\;/)[1];
    // log("outsystems.mjs", "SIM-Auth", "EXTRACT", `CSRF: ${sCSRF}`);
    // await store("write", "csrf", sCSRF);

    // then parse cookies
    var nr_cookies = parseCookies(nr_cookies);
    // log("outsystems.mjs", "SIM-Auth", "EXTRACT", `nr_cookies: ${nr_cookies}`);

    this.nr_cookies = nr_cookies
    this.csrf = sCSRF
    return { cookie: nr_cookies, expire: nr_expire, csrf: sCSRF };
  }

  async interact(url, versionInfo, data) {
    var body = data;
    body.versionInfo = {
      moduleVersion: versionInfo.moduleVersion,
      apiVersion: versionInfo.apiVersion,
    };

    return await request("POST", url, {
      cookie: this.nr_cookies,
      body: JSON.stringify(body),
      bodyType: "application/json",
      csrf: this.csrf,
    });
  }
}
