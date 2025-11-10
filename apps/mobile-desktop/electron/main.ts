import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  Tray,
  nativeImage,
  shell,
} from "electron";
import { autoUpdater } from "electron-updater";
import Store from "electron-store";
import * as path from "path";
import * as url from "url";

// Configure electron-store
const store = new Store({
  name: "learnup-config",
  encryptionKey: "learnup-desktop-secure-key-change-in-production",
});

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

const isDevelopment = process.env.NODE_ENV !== "production";
const isMac = process.platform === "darwin";
const isWindows = process.platform === "win32";

/**
 * Create the main browser window
 */
function createWindow(): void {
  // Get saved window bounds or use defaults
  const windowBounds = store.get("windowBounds", {
    width: 1280,
    height: 800,
  }) as { width: number; height: number; x?: number; y?: number };

  mainWindow = new BrowserWindow({
    ...windowBounds,
    minWidth: 800,
    minHeight: 600,
    title: "LearnApp",
    backgroundColor: "#ffffff",
    show: false, // Don't show until ready-to-show
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
    icon: path.join(__dirname, "../public/icon.png"),
    ...(isMac && {
      titleBarStyle: "hiddenInset",
    }),
  });

  // Save window bounds on close
  mainWindow.on("close", () => {
    if (mainWindow) {
      store.set("windowBounds", mainWindow.getBounds());
    }
  });

  // Load the app
  if (isDevelopment) {
    mainWindow.loadURL("http://localhost:8080");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, "../dist/index.html"),
        protocol: "file:",
        slashes: true,
      })
    );
  }

  // Show window when ready
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Handle navigation
  mainWindow.webContents.on("will-navigate", (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (
      parsedUrl.origin !== "http://localhost:8080" &&
      parsedUrl.protocol !== "file:"
    ) {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

/**
 * Create system tray
 */
function createTray(): void {
  const iconPath = path.join(__dirname, "../public/icon.png");
  const icon = nativeImage.createFromPath(iconPath);

  tray = new Tray(icon.resize({ width: 16, height: 16 }));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show LearnApp",
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    {
      label: "Hide LearnApp",
      click: () => {
        mainWindow?.hide();
      },
    },
    { type: "separator" },
    {
      label: "Check for Updates",
      click: () => {
        autoUpdater.checkForUpdates();
      },
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setToolTip("LearnApp Desktop");
  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    mainWindow?.isVisible() ? mainWindow.hide() : mainWindow?.show();
  });
}

/**
 * Create application menu
 */
function createMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" as const },
              { type: "separator" as const },
              { role: "services" as const },
              { type: "separator" as const },
              { role: "hide" as const },
              { role: "hideOthers" as const },
              { role: "unhide" as const },
              { type: "separator" as const },
              { role: "quit" as const },
            ],
          },
        ]
      : []),
    {
      label: "File",
      submenu: [isMac ? { role: "close" as const } : { role: "quit" as const }],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" as const },
        { role: "redo" as const },
        { type: "separator" as const },
        { role: "cut" as const },
        { role: "copy" as const },
        { role: "paste" as const },
        ...(isMac
          ? [
              { role: "pasteAndMatchStyle" as const },
              { role: "delete" as const },
              { role: "selectAll" as const },
            ]
          : [
              { role: "delete" as const },
              { type: "separator" as const },
              { role: "selectAll" as const },
            ]),
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" as const },
        { role: "forceReload" as const },
        { role: "toggleDevTools" as const },
        { type: "separator" as const },
        { role: "resetZoom" as const },
        { role: "zoomIn" as const },
        { role: "zoomOut" as const },
        { type: "separator" as const },
        { role: "togglefullscreen" as const },
      ],
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" as const },
        { role: "zoom" as const },
        ...(isMac
          ? [
              { type: "separator" as const },
              { role: "front" as const },
              { type: "separator" as const },
              { role: "window" as const },
            ]
          : [{ role: "close" as const }]),
      ],
    },
    {
      role: "help",
      submenu: [
        {
          label: "Learn More",
          click: async () => {
            await shell.openExternal("https://learnup.com");
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * Setup auto-updater
 */
function setupAutoUpdater(): void {
  if (isDevelopment) {
    return; // Don't check for updates in development
  }

  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on("update-available", () => {
    mainWindow?.webContents.send("update-available");
  });

  autoUpdater.on("update-downloaded", () => {
    mainWindow?.webContents.send("update-downloaded");
  });

  // Check for updates every 4 hours
  setInterval(
    () => {
      autoUpdater.checkForUpdatesAndNotify();
    },
    4 * 60 * 60 * 1000
  );
}

/**
 * Setup IPC handlers
 */
function setupIpcHandlers(): void {
  // Store operations
  ipcMain.handle("store:get", (_event, key: string) => {
    return store.get(key);
  });

  ipcMain.handle("store:set", (_event, key: string, value: any) => {
    store.set(key, value);
    return true;
  });

  ipcMain.handle("store:delete", (_event, key: string) => {
    store.delete(key);
    return true;
  });

  ipcMain.handle("store:clear", () => {
    store.clear();
    return true;
  });

  // App info
  ipcMain.handle("app:getVersion", () => {
    return app.getVersion();
  });

  ipcMain.handle("app:getPlatform", () => {
    return process.platform;
  });

  // Window controls
  ipcMain.on("window:minimize", () => {
    mainWindow?.minimize();
  });

  ipcMain.on("window:maximize", () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.on("window:close", () => {
    mainWindow?.close();
  });

  // Notifications
  ipcMain.handle(
    "notification:show",
    (_event, options: { title: string; body: string }) => {
      const { title, body } = options;
      const { Notification } = require("electron");
      new Notification({
        title,
        body,
      }).show();
      return true;
    }
  );

  // Open external URL
  ipcMain.handle("shell:openExternal", (_event, url: string) => {
    return shell.openExternal(url);
  });

  // Check for updates manually
  ipcMain.handle("updater:check", () => {
    autoUpdater.checkForUpdates();
    return true;
  });

  ipcMain.handle("updater:install", () => {
    autoUpdater.quitAndInstall();
    return true;
  });
}

/**
 * App lifecycle events
 */
app.whenReady().then(() => {
  createWindow();
  createMenu();
  createTray();
  setupIpcHandlers();
  setupAutoUpdater();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (!isMac) {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (mainWindow) {
    mainWindow.removeAllListeners("close");
    mainWindow.close();
  }
});

// Handle errors
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
