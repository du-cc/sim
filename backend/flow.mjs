import { interact } from "./outsystems.mjs";

export async function getTimetable() {
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
  var calendarData = await(await interact("timetable", "week", requestData)).json();
  console.log(JSON.stringify(calendarData))

  
}
