#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * Checks that all required environment variables are set for PaperPal IQ
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
  'NEXT_PUBLIC_APP_URL'
];

const OPTIONAL_VARS = [
  'NODE_ENV',
  'NEXT_PUBLIC_ENVIRONMENT'
];

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

function checkEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');

  if (!fs.existsSync(envPath)) {
    console.log(`${colors.red}✗${colors.reset} .env.local file not found`);
    console.log(`${colors.gray}  Create .env.local and add your environment variables${colors.reset}\n`);
    return false;
  }

  console.log(`${colors.green}✓${colors.reset} .env.local file exists\n`);
  return true;
}

function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};

  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  return env;
}

function validateVariable(varName, value) {
  if (!value || value === '') {
    console.log(`${colors.red}✗${colors.reset} ${varName} ${colors.gray}(missing)${colors.reset}`);
    return false;
  }

  // Specific validations
  if (varName === 'NEXT_PUBLIC_SUPABASE_URL' && !value.includes('supabase.co')) {
    console.log(`${colors.yellow}⚠${colors.reset} ${varName} ${colors.gray}(format may be incorrect)${colors.reset}`);
    return true;
  }

  if (varName === 'OPENAI_API_KEY' && !value.startsWith('sk-')) {
    console.log(`${colors.yellow}⚠${colors.reset} ${varName} ${colors.gray}(should start with 'sk-')${colors.reset}`);
    return true;
  }

  console.log(`${colors.green}✓${colors.reset} ${varName}`);
  return true;
}

function main() {
  console.log(`${colors.blue}PaperPal IQ - Environment Variables Check${colors.reset}\n`);

  // Check if .env.local exists
  if (!checkEnvFile()) {
    console.log(`${colors.yellow}Tip:${colors.reset} Copy .env.example to .env.local and fill in the values\n`);
    process.exit(1);
  }

  // Load environment variables
  const env = loadEnvFile();

  // Check required variables
  console.log(`${colors.blue}Required Variables:${colors.reset}`);
  let allValid = true;
  REQUIRED_VARS.forEach(varName => {
    const isValid = validateVariable(varName, env[varName]);
    allValid = allValid && isValid;
  });

  // Check optional variables
  console.log(`\n${colors.blue}Optional Variables:${colors.reset}`);
  OPTIONAL_VARS.forEach(varName => {
    const value = env[varName];
    if (value && value !== '') {
      console.log(`${colors.green}✓${colors.reset} ${varName} ${colors.gray}(${value})${colors.reset}`);
    } else {
      console.log(`${colors.gray}○${colors.reset} ${varName} ${colors.gray}(not set)${colors.reset}`);
    }
  });

  // Summary
  console.log('');
  if (allValid) {
    console.log(`${colors.green}✓ All required environment variables are set!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}✗ Some required environment variables are missing${colors.reset}`);
    console.log(`${colors.gray}  Please add them to .env.local${colors.reset}\n`);
    process.exit(1);
  }
}

main();
