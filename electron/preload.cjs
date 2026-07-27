const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("goalGarden", {
  isDesktop: true,
  getInfo: () => ipcRenderer.invoke("goal-garden:get-info"),
});
