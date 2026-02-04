import { write } from "files";
import { interact } from "./outsystems.mjs";
import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { log } from "./misc.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

var range = [];
var mode;

export async function getTimetable(d1, d2, m) {
  range = [d1, d2];
  mode = m;
  log("flow.mjs", "INFO", "STATUS", "Fetching timetable", "info");
  var timetableData = await requestTimetable();

  log(
    "flow.mjs",
    "INFO",
    "STATUS",
    "Converting timetable to calendar data",
    "info",
  );
  console.log(JSON.stringify(timetableData));
  var icsData = await toICS(timetableData);

  if (mode == "merged") {
    await write("./out.ics", icsData[0]);
    var filePath = path.resolve(__dirname, "..", "out.ics");
  }
  if (mode == "split") {
    var data = icsData[1];

    for (const [key, value] of Object.entries(data)) {
      var result = "BEGIN:VCALENDAR";
      // loop through dict per module
      for (let i = 0; i < value.length; i++) {
        var v = value[i];
        result += `
BEGIN:VEVENT
DTSTART:${v.start}
DTEND:${v.end}
DTSTAMP:${v.stamp}
UID:${v.uid}
SUMMARY:${v.title}
LOCATION:${v.location}
END:VEVENT`;
      }

      result += "\nEND:VCALENDAR";
      result = result.trim();
      write(`./out_multi/${key}.ics`, result);
    }
    var filePath = path.resolve(__dirname, "../out_multi", "out.ics");
  }

  log("flow.mjs", "INFO", "SUCCESS", "All done!", "success");

  // open in file manager
  const platform = process.platform;

  if (platform === "win32") {
    exec(`explorer.exe /select,"${filePath}"`);
  } else if (platform === "darwin") {
    exec(`open -R "${filePath}"`);
  } else {
    const parentDir = path.dirname(filePath);
    exec(`xdg-open "${parentDir}"`);
  }
}

async function requestTimetable() {
  log("flow.mjs", "INFO", "STATUS", "Requesting timetable data", "info");

  var rangeStart = new Date(range[0]);
  var rangeEnd = new Date(range[1]);

  var rangeStart_day = rangeStart.getDay();
  var rangeEnd_day = rangeEnd.getDay();

  // make the range the whole week
  // requests only can start in Sundays
  if (rangeStart_day !== 0) {
    rangeStart.setDate(rangeStart.getDate() - rangeStart_day);
  }

  if (rangeEnd_day !== 0) {
    rangeEnd.setDate(rangeEnd.getDate() - rangeEnd_day);
  }

  log(
    "flow.mjs",
    "requestTimetable",
    "EXTRACT",
    `rangeStart: ${rangeStart}, rangeEnd: ${rangeEnd}, rangeStart_day: ${rangeStart_day}, rangeEnd_day: ${rangeEnd_day}`,
  );

  // Number of weeks for iteration
  var weeks = (rangeEnd.getTime() - rangeStart.getTime()) / 604800000 + 1;
  log(
    "flow.mjs",
    "INFO",
    "STATUS",
    `Requesting ${weeks} weeks of calendar data`,
    "info",
  );

  // List of dates (Sunday) to query the week
  var query_days = [];
  query_days[0] = new Date(rangeStart);
  for (let i = 1; i < weeks; i++) {
    var day = new Date(rangeStart);
    day.setDate(day.getDate() + 7 * i);
    query_days[i] = day;
  }

  var requestData = {
    versionInfo: {
      moduleVersion: "",
      apiVersion: "",
    },
    viewName: "Timetable.Timetable",
    screenData: {
      variables: {
        IsShowCalendar: false,
        IsDay: false,
        IsWeek: true,
        IsMonth: false,
        EventList: {
          List: [],
          EmptyListItem: "1900-01-01T00:00:00",
        },
        IsShowLoading: true,
        IsRemoveContentWrapper: false,
        IsAVE: false,
        IsFromHome: false,
        _isFromHomeInDataFetchStatus: 1,
        SelectedDate: "2026-01-01",
        _selectedDateInDataFetchStatus: 1,
      },
    },
  };

  var data = [];

  // Interact with SIM API
  for (let i = 0; i < query_days.length; i++) {
    log(
      "flow.mjs",
      "INFO",
      "STATUS",
      `Requesting timetable data of week ${i + 1}`,
      "info",
    );
    requestData.screenData.variables.SelectedDate = query_days[i]
      .toISOString()
      .split("T")[0];
    var calendarData = await (
      await interact("timetable", "week", requestData)
    ).json();
    data[i] = calendarData;
  }

  return data;
}

async function toICS(data) {
  var result = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SIM//Class Schedule//EN
CALSCALE:GREGORIAN
BEGIN:VTIMEZONE
TZID:Asia/Singapore
LAST-MODIFIED:20230810T000000Z
BEGIN:STANDARD
TZNAME:SGT
TZOFFSETFROM:+0800
TZOFFSETTO:+0800
DTSTART:19700101T000000
END:STANDARD
END:VTIMEZONE`;

  // prep for calculable format
  // eg: 20260101
  var r0 = Number(range[0].replaceAll("-", ""));
  var r1 = Number(range[1].replaceAll("-", ""));

  var split_dict = {};

  // Loop through the timetable data to pull datas
  loop: for (let i = 0; i < data.length; i++) {
    var currentData = data[i].data.WeekItems.List;

    for (let j = 0; j < currentData.length; j++) {
      var dayData = currentData[j].TimeTableBlockDisplayList.List;

      for (let k = 0; k < dayData.length; k++) {
        var finalData = dayData[k];
        if (finalData.Type == "Holiday") {
          continue;
        }
        var date_start = Date.parse(`${finalData.Date} ${finalData.TimeStart}`);
        var date_end = Date.parse(`${finalData.Date} ${finalData.TimeEnd}`);

        // check if entry exceeded range
        if (
          // eg: 20260101
          Number(
            new Date(date_start)
              .toISOString()
              .match(/(.*?)T/)[1]
              .replaceAll("-", ""),
          ) > r1
        ) {
          break loop;
        }

        // check if entry haven't reach the range
        if (
          Number(
            new Date(date_start)
              .toISOString()
              .match(/(.*?)T/)[1]
              .replaceAll("-", ""),
          ) < r0
        ) {
          continue;
        }

        // ISO format and accordance to rfc2445 specs
        // see: https://www.ietf.org/rfc/rfc2445.txt
        // eg: 20260116T070000Z
        var start =
          new Date(date_start)
            .toISOString()
            .split(".")[0]
            .replace(/\.[0-9]*/, "") // remove ms from ISO format
            .replaceAll(/\:|\-|\./g, "") + "Z"; // remove symbol: -, :, .
        var end =
          new Date(date_end)
            .toISOString()
            .split(".")[0]
            .replace(/\.[0-9]*/, "")
            .replaceAll(/\:|\-|\./g, "") + "Z";

        var stamp = new Date(Date.now())
          .toISOString()
          .split(".")[0]
          .replaceAll(/\:|\-|\./g, "") + "Z";

        // var uid = `${(finalData.Description).replaceAll(/\s/g, "")}-${finalData.Date}:${finalData.TimeStart}@sim.edu.sg`
        // ":" is stripped for better compatibility to calendar apps
        var uid = `${finalData.ClassInformation.SlotId}@sim.edu.sg`.replaceAll(
          /\:|\-/g,
          "",
        );
        var title = finalData.Class;
        var location = finalData.Venue;

        // split mode: map datas by modules
        if (mode == "split") {
          if (!split_dict[title]) {
            split_dict[title] = [];
          }

          split_dict[title].push({
            start,
            end,
            stamp,
            uid,
            title,
            location,
          });
        }

        result = `
${result}
BEGIN:VEVENT
DTSTART:${start}
DTEND:${end}
DTSTAMP:${stamp}
UID:${uid}
SUMMARY:${title}
LOCATION:${location}
END:VEVENT`;
      }
    }
  }

  result = `
  ${result}
END:VCALENDAR`;
  result = result.trim();

  return [result, split_dict];
}
