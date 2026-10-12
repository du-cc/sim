import * as b2c from "./src/b2c.mjs";
import { request } from "./src/misc.mjs";
var url =
  "https://simattendance.simge.edu.sg/StudentApp/screenservices/StudentApp/Timetable/Timetable/DataActionWeekPreparation";
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
var version = (await version_req.text())
  .match(new RegExp(String.raw`(?<=\/${endpoint}", ")([^"]+)`))[0];



console.log(version);
