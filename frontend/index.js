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
  var color = "#fff";

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
  text_e.style.color = color;

  log_container_e.appendChild(text_e);
}

window.serverlog.update((arg) => {
  log(arg[0], arg[1], arg[2], arg[3], arg[4]);
});

const execute_e = document.getElementById("execute");
execute_e.addEventListener("click", () => {
  window.action.run();
});


