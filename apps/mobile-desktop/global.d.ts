/// <reference types="react" />
/// <reference types="react-dom" />

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

export {};
