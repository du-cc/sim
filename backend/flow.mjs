import { write } from "files";
import { interact } from "./outsystems.mjs";
import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

var range = [];
var mode;

export async function getTimetable(d1, d2, m) {
  range = [d1, d2];
  mode = m;

  var timetableData = await requestTimetable();
  var icsData = await toICS(timetableData);

  if (mode == "merged") {
    await write("./out.ics", icsData[0]);
    var filePath = path.resolve(__dirname, "..", "out.ics");
  }
  if (mode == "split") {
    var data = icsData[1];
    var result = "BEGIN:VCALENDAR";

    for (var [key, value] of Object.entries(data)) {
      for (let i = 0; i < value.length; i++) {
        value = value[i];
        result = `
${result}
BEGIN:VEVENT
DTSTART:${value.start}
DTEND:${value.end}
DTSTAMP:${value.stamp}
UID:${value.uid}
SUMMARY:${value.title}
LOCATION:${value.location}
END:VEVENT`;
      }

      result = `
${result}
END:VCALENDAR`;
      result = result.trim();

      write(`./out_multi/${key}.ics`, result);
    }
    var filePath = path.resolve(__dirname, "../out_multi", "out.ics");
  }

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
  var rangeStart = new Date(range[0]);
  var rangeEnd = new Date(range[1]);

  var rangeStart_day = rangeStart.getDay();
  var rangeEnd_day = rangeEnd.getDay();

  if (rangeStart_day !== 0) {
    rangeStart.setDate(rangeStart.getDate() - rangeStart_day);
  }

  if (rangeEnd_day !== 0) {
    rangeEnd.setDate(rangeEnd.getDate() - rangeEnd_day);

    // rangeEnd.setDate(rangeEnd.getDate() + (7 - rangeEnd.getDay()));
  }

  // Number of weeks for iteration
  var weeks = (rangeEnd.getTime() - rangeStart.getTime()) / 604800000 + 1;

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

  for (let i = 0; i < query_days.length; i++) {
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
  // console.log(JSON.stringify(data));

  const template = `
  BEGIN:VEVENT
  DTSTART:20260120T100000Z
  DTEND:20260120T110000Z
  DTSTAMP:20260114T140000Z
  UID:event1-uid@example.com
  SUMMARY:
  DESCRIPTION:Discuss Q1 goals.
  LOCATION:Conference Room A
  END:VEVENT
  `;

  var result = "BEGIN:VCALENDAR";

  var r0 = Number(range[0].replaceAll("-", ""));
  var r1 = Number(range[1].replaceAll("-", ""));

  var split_dict = {};

  loop: for (let i = 0; i < data.length; i++) {
    var currentData = data[i].data.WeekItems.List;

    for (let j = 0; j < currentData.length; j++) {
      var dayData = currentData[j].TimeTableBlockDisplayList.List;

      for (let k = 0; k < dayData.length; k++) {
        var finalData = dayData[k];

        var date_start = Date.parse(`${finalData.Date} ${finalData.TimeStart}`);
        var date_end = Date.parse(`${finalData.Date} ${finalData.TimeEnd}`);

        if (
          Number(
            new Date(date_start)
              .toISOString()
              .match(/(.*?)T/)[1]
              .replaceAll("-", "")
          ) > r1
        ) {
          break loop;
        }

        if (
          Number(
            new Date(date_start)
              .toISOString()
              .match(/(.*?)T/)[1]
              .replaceAll("-", "")
          ) < r0
        ) {
          continue;
        }

        var start = new Date(date_start)
          .toISOString()
          .replace(/\.[0-9]*/, "")
          .replaceAll(/\:|\-|\./g, "");
        var end = new Date(date_end)
          .toISOString()
          .replace(/\.[0-9]*/, "")
          .replaceAll(/\:|\-|\./g, "");
        var stamp = new Date(Date.now())
          .toISOString()
          .replaceAll(/\:|\-|\./g, "");
        // var uid = `${(finalData.Description).replaceAll(/\s/g, "")}-${finalData.Date}:${finalData.TimeStart}@sim.edu.sg`
        var uid = `${finalData.ClassInformation.SlotId}@sim.edu.sg`.replaceAll(
          ":",
          ""
        );
        var title = finalData.Class;
        var location = finalData.Venue;

        // console.log(start, end, uid, title, location);

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
  
  console.log(split_dict);
  return [result, split_dict];
}
