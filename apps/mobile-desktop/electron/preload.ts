import { contextBridge, ipcRenderer } from "electron";

/** Electron preload: secure API bridge for renderer. */

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electron", {
  // Store API
  store: {
    get: (key: string) => ipcRenderer.invoke("store:get", key),
    set: (key: string, value: any) =>
      ipcRenderer.invoke("store:set", key, value),
    delete: (key: string) => ipcRenderer.invoke("store:delete", key),
    clear: () => ipcRenderer.invoke("store:clear"),
  },

  // App API
  app: {
    getVersion: () => ipcRenderer.invoke("app:getVersion"),
    getPlatform: () => ipcRenderer.invoke("app:getPlatform"),
  },

  // Window API
  window: {
    minimize: () => ipcRenderer.send("window:minimize"),
    maximize: () => ipcRenderer.send("window:maximize"),
    close: () => ipcRenderer.send("window:close"),
  },

  // Notification API
  notification: {
    show: (options: { title: string; body: string }) =>
      ipcRenderer.invoke("notification:show", options),
  },

  // Shell API
  shell: {
    openExternal: (url: string) =>
      ipcRenderer.invoke("shell:openExternal", url),
  },

  // Updater API
  updater: {
    checkForUpdates: () => ipcRenderer.invoke("updater:check"),
    installUpdate: () => ipcRenderer.invoke("updater:install"),
    onUpdateAvailable: (callback: () => void) => {
      ipcRenderer.on("update-available", callback);
      return () => ipcRenderer.removeListener("update-available", callback);
    },
    onUpdateDownloaded: (callback: () => void) => {
      ipcRenderer.on("update-downloaded", callback);
      return () => ipcRenderer.removeListener("update-downloaded", callback);
    },
  },

  // Platform info
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
});

// Type definitions for TypeScript
declare global {
  interface Window {
    electron: {
      store: {
        get: (key: string) => Promise<any>;
        set: (key: string, value: any) => Promise<boolean>;
        delete: (key: string) => Promise<boolean>;
        clear: () => Promise<boolean>;
      };
      app: {
        getVersion: () => Promise<string>;
        getPlatform: () => Promise<string>;
      };
      window: {
        minimize: () => void;
        maximize: () => void;
        close: () => void;
      };
      notification: {
        show: (options: { title: string; body: string }) => Promise<boolean>;
      };
      shell: {
        openExternal: (url: string) => Promise<void>;
      };
      updater: {
        checkForUpdates: () => Promise<boolean>;
        installUpdate: () => Promise<boolean>;
        onUpdateAvailable: (callback: () => void) => () => void;
        onUpdateDownloaded: (callback: () => void) => () => void;
      };
      platform: string;
      versions: {
        node: string;
        chrome: string;
        electron: string;
      };
    };
  }
}
