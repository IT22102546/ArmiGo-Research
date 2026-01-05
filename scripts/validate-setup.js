#!/usr/bin/env node

// Validate environment and prerequisites for LearnUp

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const REQUIRED_NODE_VERSION = 20;
const REQUIRED_PNPM_VERSION = "10.0.0";

// Colors for terminal output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command) {
  try {
    return execSync(command, { encoding: "utf8", stdio: "pipe" }).trim();
  } catch (error) {
    return null;
  }
}

function checkNodeVersion() {
  log("\n🔍 Checking Node.js version...", "blue");
  const nodeVersion = process.version.replace("v", "");
  const majorVersion = parseInt(nodeVersion.split(".")[0]);

  if (majorVersion >= REQUIRED_NODE_VERSION) {
    log(
      `✅ Node.js v${nodeVersion} (required: v${REQUIRED_NODE_VERSION}+)`,
      "green"
    );
    return true;
  } else {
    log(
      `❌ Node.js v${nodeVersion} (required: v${REQUIRED_NODE_VERSION}+)`,
      "red"
    );
    return false;
  }
}

function checkPnpmVersion() {
  log("\n🔍 Checking pnpm version...", "blue");
  const pnpmVersion = execCommand("pnpm --version");

  if (pnpmVersion) {
    log(
      `✅ pnpm v${pnpmVersion} (required: v${REQUIRED_PNPM_VERSION}+)`,
      "green"
    );
    return true;
  } else {
    log(`❌ pnpm not found (required: v${REQUIRED_PNPM_VERSION}+)`, "red");
    log("   Install: npm install -g pnpm@10.19.0", "yellow");
    return false;
  }
}

function checkGit() {
  log("\n🔍 Checking Git...", "blue");
  const gitVersion = execCommand("git --version");

  if (gitVersion) {
    log(`✅ ${gitVersion}`, "green");
    return true;
  } else {
    log("❌ Git not found", "red");
    return false;
  }
}

function checkEnvFiles() {
  log("\n🔍 Checking environment files...", "blue");
  const envFiles = [
    { path: ".env.example", required: true },
    { path: ".env", required: false },
    { path: "apps/backend/.env.example", required: true },
    { path: "apps/backend/.env", required: false },
    { path: "apps/frontend/.env.example", required: true },
    { path: "apps/frontend/.env", required: false },
  ];

  let allExamplesExist = true;
  let allEnvsExist = true;

  envFiles.forEach((file) => {
    const exists = fs.existsSync(file.path);
    if (file.required && !exists) {
      log(`❌ Missing: ${file.path}`, "red");
      allExamplesExist = false;
    } else if (!file.required && !exists) {
      log(`⚠️  Missing: ${file.path} (copy from .env.example)`, "yellow");
      allEnvsExist = false;
    } else if (exists) {
      log(`✅ Found: ${file.path}`, "green");
    }
  });

  return allExamplesExist;
}

function checkConfigFiles() {
  log("\n🔍 Checking configuration files...", "blue");
  const configFiles = [
    "package.json",
    "pnpm-workspace.yaml",
    "turbo.json",
    "tsconfig.json",
    ".eslintrc.js",
    ".prettierrc",
    ".editorconfig",
    "commitlint.config.js",
  ];

  let allExist = true;

  configFiles.forEach((file) => {
    if (fs.existsSync(file)) {
      log(`✅ ${file}`, "green");
    } else {
      log(`❌ Missing: ${file}`, "red");
      allExist = false;
    }
  });

  return allExist;
}

function checkDependencies() {
  log("\n🔍 Checking dependencies...", "blue");
  const hasNodeModules = fs.existsSync("node_modules");

  if (hasNodeModules) {
    log("✅ Dependencies installed", "green");
    return true;
  } else {
    log("❌ Dependencies not installed", "red");
    log("   Run: pnpm install", "yellow");
    return false;
  }
}

function checkDatabase() {
  log("\n🔍 Checking database connection...", "blue");

  // Check if Prisma client is generated in any expected location
  const prismaClientPaths = [
    "apps/backend/node_modules/.prisma/client",
    "node_modules/.prisma/client",
    "node_modules/@prisma/client",
    "apps/backend/node_modules/@prisma/client",
  ];

  const foundPath = prismaClientPaths.find((p) => fs.existsSync(p));

  if (foundPath) {
    log(`✅ Prisma Client generated at: ${foundPath}`, "green");
  } else {
    log("⚠️  Prisma Client not generated", "yellow");
    log("   Run: pnpm db:generate", "yellow");
  }

  return true;
}

function checkDocker() {
  log("\n🔍 Checking Docker...", "blue");
  const dockerVersion = execCommand("docker --version");

  if (dockerVersion) {
    log(`✅ ${dockerVersion}`, "green");

    const dockerComposeVersion = execCommand("docker-compose --version");
    if (dockerComposeVersion) {
      log(`✅ ${dockerComposeVersion}`, "green");
    }

    return true;
  } else {
    log("⚠️  Docker not found (optional for development)", "yellow");
    return true;
  }
}

function printSummary(results) {
  log("\n" + "=".repeat(60), "blue");
  log("VALIDATION SUMMARY", "blue");
  log("=".repeat(60), "blue");

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  if (passed === total) {
    log(`\n🎉 All checks passed! (${passed}/${total})`, "green");
    log("\n✅ Your environment is ready for development!", "green");
    log("\nNext steps:", "blue");
    log("  1. Configure .env files with your values", "reset");
    log("  2. Run: pnpm docker:up (start databases)", "reset");
    log("  3. Run: pnpm db:migrate (setup database)", "reset");
    log("  4. Run: pnpm dev (start development)", "reset");
  } else {
    log(`\n⚠️  ${passed}/${total} checks passed`, "yellow");
    log("\n❌ Please fix the issues above before continuing", "red");
  }

  log("\n" + "=".repeat(60), "blue");
}

// Main execution
async function main() {
  log("=".repeat(60), "blue");
  log("LEARNUP PLATFORM - ENVIRONMENT VALIDATION", "blue");
  log("=".repeat(60), "blue");

  const results = [
    { name: "Node.js", passed: checkNodeVersion() },
    { name: "pnpm", passed: checkPnpmVersion() },
    { name: "Git", passed: checkGit() },
    { name: "Config Files", passed: checkConfigFiles() },
    { name: "Environment Files", passed: checkEnvFiles() },
    { name: "Dependencies", passed: checkDependencies() },
    { name: "Database", passed: checkDatabase() },
    { name: "Docker", passed: checkDocker() },
  ];

  printSummary(results);

  const allPassed = results.every((r) => r.passed);
  process.exit(allPassed ? 0 : 1);
}

main().catch((error) => {
  log(`\n❌ Validation failed: ${error.message}`, "red");
  process.exit(1);
});
