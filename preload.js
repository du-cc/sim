const { contextBridge, ipcRenderer } = require("electron");
// import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("cookie", {
  get: () => ipcRenderer.invoke("cookieGet"),
  write: (cookie) => ipcRenderer.invoke("cookieWrite", cookie)
})

contextBridge.exposeInMainWorld("serverlog", {
  update: (callback) => ipcRenderer.on("log", (event, ...args) => callback(...args))
})

contextBridge.exposeInMainWorld("action", {
  run: (...args) => ipcRenderer.invoke("run", ...args)
})