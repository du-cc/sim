import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { store } from "./backend/misc.mjs";
import { getTimetable } from "./backend/flow.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

var mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    show: false,
  });
  // mainWindow.setMenu(null)
  mainWindow.loadFile("./frontend/index.html");
}

app.whenReady().then(() => {
  ipcMain.handle("cookieGet", async () => {
    return await store("get", "MICROSOFT_LOGIN_COOKIE");
  });

  ipcMain.handle("cookieWrite", async (e, ...args) => {
    const cookie = args[0];
    return await store("write", "MICROSOFT_LOGIN_COOKIE", cookie);
  });
  
  ipcMain.handle("run", async (e, ...args) => {
    return await getTimetable(...args);
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

export function sendToClient(name, ...args) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(name, ...args);
  }
}
