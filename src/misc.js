// ignore this spaghetti function
// I added the body last and lazy to modify all other existing function calls
// If it works, dont touch it --Random dev
async function request(method, url, args) {
  // var host = url.match(/https:\/\/(.*?)\//)[1];
  var response;

  var headers = {
    "User-Agent":
      "Mozilla/5.0 (X11; Linux x86_64; rv:146.0) Gecko/20100101 Firefox/146.0",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-site",
    "Sec-Fetch-User": "?1",
    Priority: "u=0, i",
  };

  if (args && "csrf" in args) {
    headers["X-CSRFToken"] = args["csrf"];
  }

  if (args && "cookie" in args) {
    headers["Cookie"] = args["cookie"];
  }

  // Define base options
  const options = {
    method: method,
    headers: headers,
  };

  if (args && "redirect" in args) {
    options["redirect"] = args["redirect"] === false ? "manual" : "follow";
  }

  if (args && "body" in args) {
    options.body = args["body"];
    headers["Content-Type"] = args["bodyType"];
  }

  response = await fetch(url, options);

  return response;
}

// I HATE THIS SHIT
// thx stackoverflow :)
function parseCookies(header) {
  const cookies = Array.isArray(header)
    ? header
    : header.split(/,(?=\s*[^=]+=[^;]+)/); // Split by comma only if followed by a key=value

  return cookies
    .map((c) => c.split(";")[0].trim()) // Take only "name=value" part
    .filter((c) => c.length > 0)
    .join("; "); // Join for the request header
}

module.exports = { request, parseCookies };
