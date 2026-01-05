#!/usr/bin/env node

/**
 * Generate Secure Secrets for LearnUp Platform
 *
 * This script generates cryptographically secure random secrets for:
 * - JWT_SECRET
 * - JWT_REFRESH_SECRET
 * - SESSION_SECRET
 * - REDIS_PASSWORD
 * - DB_PASSWORD
 *
 * Usage: node scripts/generate-secrets.js
 */

const crypto = require("crypto");

/**
 * Generate a cryptographically secure random string
 * @param {number} length - Length in bytes
 * @returns {string} Hex encoded random string
 */
function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Generate a secure password with special characters
 * @param {number} length - Length of password
 * @returns {string} Random password
 */
function generatePassword(length = 24) {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
  let password = "";
  const randomBytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }

  return password;
}

console.log(
  "=================================================================================================="
);
console.log("🔐 LearnUp Platform - Secure Secrets Generator");
console.log(
  "==================================================================================================\n"
);

console.log("⚠️  CRITICAL: Copy these secrets to your .env file");
console.log(
  "⚠️  Keep these secrets secure and NEVER commit them to version control"
);
console.log(
  "⚠️  Generate new secrets for each environment (development, staging, production)\n"
);

console.log(
  "=================================================================================================="
);
console.log("JWT Configuration (Authentication)");
console.log(
  "=================================================================================================="
);
console.log(`JWT_SECRET=${generateSecret(32)}`);
console.log(`JWT_REFRESH_SECRET=${generateSecret(32)}`);
console.log("");

console.log(
  "=================================================================================================="
);
console.log("Security Configuration");
console.log(
  "=================================================================================================="
);
console.log(`SESSION_SECRET=${generateSecret(32)}`);
console.log("");

console.log(
  "=================================================================================================="
);
console.log("Database Configuration");
console.log(
  "=================================================================================================="
);
console.log(`DB_PASSWORD=${generatePassword(24)}`);
console.log("");

console.log(
  "=================================================================================================="
);
console.log("Redis Configuration");
console.log(
  "=================================================================================================="
);
console.log(`REDIS_PASSWORD=${generatePassword(24)}`);
console.log("");

console.log(
  "=================================================================================================="
);
console.log("📋 Next Steps:");
console.log(
  "=================================================================================================="
);
console.log("1. Copy the secrets above to your .env file (apps/backend/.env)");
console.log(
  "2. Replace ALL placeholder values (CHANGE_ME_*) in your .env file"
);
console.log("3. Update DATABASE_URL with your actual DB_PASSWORD");
console.log("4. Verify all secrets are different and at least 32 characters");
console.log(
  "5. For production, generate NEW secrets (never reuse development secrets)"
);
console.log(
  "6. Store production secrets in a secure secrets manager (Azure Key Vault, AWS Secrets Manager, etc.)"
);
console.log(
  "==================================================================================================\n"
);

console.log("✅ Secrets generated successfully!\n");
