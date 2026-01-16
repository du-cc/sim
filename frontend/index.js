async function cookies(method, data) {
  if (method == "get") {
    return await window.cookie.get();
  }
  if (method == "write") {
    return await window.cookie.write(data);
  }
}

const input_e = document.getElementById("cookie");
const save_e = document.getElementById("save");
const status_e = document.getElementById("status");

cookies("get").then((data) => {
  if (data !== null) {
    input_e.value = data;
  }
});

save_e.addEventListener("click", async function () {
  var input = input_e.value;
  if (input !== "") {
    await cookies("write", input);
    status_e.innerText = "Cookie saved!";
    status_e.className = "status green";
    setTimeout(() => {
      status_e.className = "status hide";
    }, 2000);
  }
});

const log_container_e = document.getElementById("log");

function log(script, module, action, data, type) {
  var text = `[${script}][${module}] ${action} - ${data}`;
  var color;

  if (type == "error") {
    color = "color-mix(in srgb, red 70%, var(--fg) 30%)";
  }
  if (type == "info") {
    color = "color-mix(in srgb, dodgerblue 70%, var(--fg) 30%)";
  }
  if (type == "success") {
    color = "color-mix(in srgb, green 70%, var(--fg) 30%)";
  }

  var text_e = document.createElement("span");
  text_e.innerText = text;
  text_e.style.color = color == "" ? "var(--fg)" : color;

  log_container_e.appendChild(text_e);
  log_container_e.scrollTop = log_container_e.scrollHeight;
}

window.serverlog.update((arg) => {
  log(arg[0], arg[1], arg[2], arg[3], arg[4]);
});

const execute_e = document.getElementsByClassName("download-btn");

for (let i = 0; i < execute_e.length; i++) {
  const element = execute_e[i];

  element.addEventListener("click", function (e) {
    var date1 = document.getElementById("date1").value;
    var date2 = document.getElementById("date2").value;
    var date1_n = Date.parse(date1);
    var date2_n = Date.parse(date2);

    var status = document.getElementById("date_s");

    if (date1_n > date2_n || isNaN(date1_n) || isNaN(date2_n)) {
      status.innerText = "Invalid range!";
      status.className = "status red";
      return;
    } else {
      status.className = "status hide";
    }

    if (this.id == "execute_merged") {
      window.action.run(date1, date2, "merged");
    }
    if (this.id == "execute_split") {
      window.action.run(date1, date2, "split");
    }
  });
}

var theme_switch_e = document.getElementById("theme_switch");
var theme_switch_icon_e = document.querySelector("#theme_switch > i");
var THEME_DARK = true;

theme_switch_e.addEventListener("click", function (e) {
  var root = document.documentElement;

  if (THEME_DARK === true) {
    root.style.setProperty("--bg", "#d4d4d4");
    root.style.setProperty("--fg", "#020202");
    root.style.setProperty("--date-picker-filter", "0%");
    theme_switch_icon_e.className = "fa-solid fa-moon";

    THEME_DARK = false;
  } else {
    // This only runs if THEME_DARK was NOT true
    root.style.setProperty("--bg", "#020202");
    root.style.setProperty("--fg", "#d4d4d4");
    root.style.setProperty("--date-picker-filter", "100%");
    theme_switch_icon_e.className = "fa-solid fa-sun-bright";

    THEME_DARK = true;
  }
});
