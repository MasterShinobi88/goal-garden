/**
 * Goal Garden — Electron main process (Windows desktop shell)
 * Dev: loads http://localhost:3000
 * Prod: starts Next standalone server from extraResources
 */
const { app, BrowserWindow, shell, ipcMain, dialog } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const http = require("http");
const fs = require("fs");

const isDev = !app.isPackaged;
let mainWindow = null;
let nextProcess = null;
let serverPort = 3911;
let nextServerLogs = "";

function showFatalError(title, message) {
  try {
    dialog.showErrorBox(title, message);
  } catch {
    console.error(title, message);
  }
}

function waitForServer(url, attempts = 60) {
  return new Promise((resolve, reject) => {
    let n = 0;
    const tick = () => {
      n += 1;
      const req = http.get(url, (res) => {
        res.resume();
        resolve(true);
      });
      req.on("error", () => {
        if (n >= attempts) reject(new Error("Next server did not start in time"));
        else setTimeout(tick, 500);
      });
    };
    tick();
  });
}

function startNextServer() {
  return new Promise((resolve, reject) => {
    const resources = process.resourcesPath;
    const appDir = path.join(resources, "app");
    const serverJs = path.join(appDir, "server.js");

    if (!fs.existsSync(serverJs)) {
      reject(
        new Error(
          `Standalone server missing at ${serverJs}. Run npm run desktop:build.`
        )
      );
      return;
    }

    const nextModule = path.join(appDir, "node_modules", "next");
    if (!fs.existsSync(nextModule)) {
      reject(
        new Error(
          `Next.js runtime missing at ${nextModule}.\n\nThe installer package is incomplete (node_modules not shipped). Rebuild with npm run desktop:build.`
        )
      );
      return;
    }

    // Pick a free-ish port in a fixed range for desktop
    serverPort = 3911 + Math.floor(Math.random() * 80);

    const env = {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(serverPort),
      HOSTNAME: "127.0.0.1",
      NEXT_PUBLIC_DESKTOP: "true",
      NEXT_PUBLIC_DEMO_MODE: "true",
    };

    nextServerLogs = "";

    // Prefer Electron's bundled Node via process.execPath with ELECTRON_RUN_AS_NODE
    nextProcess = spawn(process.execPath, [serverJs], {
      cwd: appDir,
      env: { ...env, ELECTRON_RUN_AS_NODE: "1" },
      stdio: isDev ? "inherit" : "pipe",
    });

    if (nextProcess.stdout) {
      nextProcess.stdout.on("data", (chunk) => {
        nextServerLogs += chunk.toString();
      });
    }
    if (nextProcess.stderr) {
      nextProcess.stderr.on("data", (chunk) => {
        nextServerLogs += chunk.toString();
        console.error(chunk.toString());
      });
    }

    nextProcess.on("error", reject);
    nextProcess.on("exit", (code) => {
      if (code && code !== 0) {
        console.error("Next server exited", code);
        if (nextServerLogs) console.error(nextServerLogs.slice(-2000));
      }
    });

    const url = `http://127.0.0.1:${serverPort}`;
    waitForServer(url)
      .then(() => resolve(url))
      .catch((err) => {
        const detail = nextServerLogs.trim()
          ? `\n\nServer output:\n${nextServerLogs.trim().slice(-1500)}`
          : "";
        reject(new Error(`${err.message}${detail}`));
      });
  });
}

async function createWindow() {
  let startUrl;

  if (isDev) {
    startUrl = process.env.GOAL_GARDEN_DEV_URL || "http://localhost:3000";
  } else {
    startUrl = await startNextServer();
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    show: false,
    backgroundColor: "#0a1210",
    title: "Goal Garden",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  await mainWindow.loadURL(startUrl);
}

// Desktop bridge
ipcMain.handle("goal-garden:get-info", () => ({
  isDesktop: true,
  isPackaged: app.isPackaged,
  version: app.getVersion(),
  platform: process.platform,
  userData: app.getPath("userData"),
}));

app.whenReady().then(async () => {
  try {
    await createWindow();
  } catch (err) {
    console.error(err);
    showFatalError(
      "Goal Garden failed to start",
      err && err.message ? String(err.message) : String(err)
    );
    app.quit();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow().catch((err) => {
        console.error(err);
        showFatalError(
          "Goal Garden failed to start",
          err && err.message ? String(err.message) : String(err)
        );
      });
    }
  });
});

app.on("window-all-closed", () => {
  if (nextProcess && !nextProcess.killed) {
    nextProcess.kill();
    nextProcess = null;
  }
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (nextProcess && !nextProcess.killed) {
    nextProcess.kill();
    nextProcess = null;
  }
});
