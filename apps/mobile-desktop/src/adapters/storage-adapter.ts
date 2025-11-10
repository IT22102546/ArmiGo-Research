/** Storage adapter: platform-agnostic interface for Electron and localStorage. */

// Check if we're in Electron environment
const isElectron = typeof window !== "undefined" && window.electron;

export const storage = {
  /**
   * Get a value from storage
   */
  async getItem(key: string): Promise<string | null> {
    if (isElectron) {
      try {
        const value = await window.electron.store.get(key);
        return value !== undefined ? JSON.stringify(value) : null;
      } catch (error) {
        console.error("Storage getItem error:", error);
        return null;
      }
    }

    // Fallback to localStorage for web
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error("LocalStorage getItem error:", error);
      return null;
    }
  },

  /**
   * Set a value in storage
   */
  async setItem(key: string, value: string): Promise<void> {
    if (isElectron) {
      try {
        await window.electron.store.set(key, JSON.parse(value));
      } catch (error) {
        console.error("Storage setItem error:", error);
        // Fallback: store as string
        await window.electron.store.set(key, value);
      }
      return;
    }

    // Fallback to localStorage for web
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error("LocalStorage setItem error:", error);
    }
  },

  /**
   * Remove a value from storage
   */
  async removeItem(key: string): Promise<void> {
    if (isElectron) {
      try {
        await window.electron.store.delete(key);
      } catch (error) {
        console.error("Storage removeItem error:", error);
      }
      return;
    }

    // Fallback to localStorage for web
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error("LocalStorage removeItem error:", error);
    }
  },

  /**
   * Clear all storage
   */
  async clear(): Promise<void> {
    if (isElectron) {
      try {
        await window.electron.store.clear();
      } catch (error) {
        console.error("Storage clear error:", error);
      }
      return;
    }

    // Fallback to localStorage for web
    try {
      localStorage.clear();
    } catch (error) {
      console.error("LocalStorage clear error:", error);
    }
  },

  /**
   * Get all keys
   */
  async getAllKeys(): Promise<string[]> {
    if (isElectron) {
      // electron-store doesn't have a direct way to get all keys
      // You might need to implement this differently based on your needs
      return [];
    }

    // Fallback to localStorage for web
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error("LocalStorage getAllKeys error:", error);
      return [];
    }
  },
};

// Make it globally available for React Native components
if (typeof window !== "undefined") {
  (window as any).storage = storage;
}

export default storage;
