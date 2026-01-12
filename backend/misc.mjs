import * as files from "files";

// debug mode will show all variable values while running
const DEBUG = true;

// ignore this spaghetti function
// I added the body last and lazy to modify all other existing function calls
// If it works, dont touch it --Random dev
export async function request(
  method,
  url,
  cookie,
  redirect = true,
  body,
  bodyType,
  csrf
) {
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
    "X-CSRFToken": csrf,
  };

  if (cookie) {
    headers["Cookie"] = cookie;
  }

  // Define base options
  const options = {
    method: method,
    headers: headers,
    redirect: redirect === true ? "follow" : "manual",
  };

  if (body) {
    options.body = body;
    headers["Content-Type"] = bodyType;
  }

  response = await fetch(url, options);

  return response;
}

export function log(script, module, action, data, type) {
  if (type == "error") {
    return console.error(
      "\x1b[31m%s\x1b[0m",
      `[${script}][${module}] ${action} - ${data}`
    );
  }
  if (type == "info") {
    return console.error(
      "\x1b[34m%s\x1b[0m",
      `[${script}][${module}] ${action} - ${data}`
    );
  }
  if (type == "success") {
    return console.error(
      "\x1b[32m%s\x1b[0m",
      `[${script}][${module}] ${action} - ${data}`
    );
  }
  if (DEBUG == false && action == "EXTRACT") {
    return;
  }
  return console.log(`[${script}][${module}] ${action} - ${data}`);
}

// I HATE THIS SHIT
// thx stackoverflow :)
export function parseCookies(header) {
  const cookies = Array.isArray(header)
    ? header
    : header.split(/,(?=\s*[^=]+=[^;]+)/); // Split by comma only if followed by a key=value

  return cookies
    .map((c) => c.split(";")[0].trim()) // Take only "name=value" part
    .filter((c) => c.length > 0)
    .join("; "); // Join for the request header
}

export async function store(action, v, data, e=null) {
  var end = e == null ? 'txt' : e
  var path = `./data/${v}.${end}`;
  if (action == "get") {
    if (!(await files.exists(path))) {
      return null;
    }
    return await files.read(path);
  }
  if (action == "write") {
    return await files.write(path, data);
  }
  if (action == "delete") {
    return await files.remove(path);
  }
}
