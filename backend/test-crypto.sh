#!/bin/sh
# Test script to verify crypto polyfill is working

echo "Testing crypto availability..."

node -e "
require('./dist/src/polyfills/crypto');
console.log('globalThis.crypto:', typeof globalThis.crypto);
console.log('global.crypto:', typeof global.crypto);
console.log('crypto.randomUUID:', typeof globalThis.crypto?.randomUUID);

if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
  const uuid = globalThis.crypto.randomUUID();
  console.log('Generated UUID:', uuid);
  console.log('✅ Crypto polyfill is working correctly!');
  process.exit(0);
} else {
  console.error('❌ Crypto polyfill is NOT working!');
  process.exit(1);
}
"
