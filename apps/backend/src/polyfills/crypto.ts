/**
 * Crypto polyfill for Node.js environments
 * Ensures global crypto object is available for @nestjs/schedule and other libraries
 * CRITICAL: This must be imported BEFORE any NestJS modules that use crypto
 */

import { webcrypto } from "crypto";

// Define crypto on globalThis (standard location)
if (!globalThis.crypto) {
  (globalThis as any).crypto = webcrypto;
}

// Define crypto on global (Node.js legacy)
if (typeof global !== "undefined" && !(global as any).crypto) {
  (global as any).crypto = webcrypto;
}

// Export to ensure this module is not tree-shaken
export const cryptoPolyfill = true;
