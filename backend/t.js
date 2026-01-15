var date = "2026-01-02"
var time = "13:00:01"
        var start = Date.parse(`${date} ${time}`)
        console.log(new Date(start).getDate())
