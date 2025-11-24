#!/usr/bin/env node

/**
 * API Endpoint Testing Script
 * Basic health checks for PaperPal IQ API endpoints
 */

const http = require('http');
const https = require('https');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Parse URL for http/https module
const url = new URL(BASE_URL);
const isHttps = url.protocol === 'https:';
const httpModule = isHttps ? https : http;

async function testEndpoint(method, path, description) {
  return new Promise((resolve) => {
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: path,
      method: method,
      timeout: 5000
    };

    const req = httpModule.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const status = res.statusCode;
        let result = {
          success: status >= 200 && status < 500, // 4xx is expected for unauth
          status: status,
          description: description,
          path: path
        };

        resolve(result);
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        status: 'ERROR',
        description: description,
        path: path,
        error: error.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        status: 'TIMEOUT',
        description: description,
        path: path,
        error: 'Request timed out'
      });
    });

    req.end();
  });
}

function printResult(result) {
  const icon = result.success ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
  const statusColor = result.success ? colors.green : colors.red;

  console.log(`${icon} ${result.description}`);
  console.log(`  ${colors.gray}${result.method || 'GET'} ${result.path}${colors.reset}`);
  console.log(`  ${statusColor}Status: ${result.status}${colors.reset}`);

  if (result.error) {
    console.log(`  ${colors.red}Error: ${result.error}${colors.reset}`);
  }

  console.log('');
}

async function main() {
  console.log(`${colors.blue}PaperPal IQ - API Endpoint Tests${colors.reset}\n`);
  console.log(`${colors.gray}Testing against: ${BASE_URL}${colors.reset}\n`);

  // Check if server is running
  console.log(`${colors.blue}Checking server availability...${colors.reset}\n`);

  const serverCheck = await testEndpoint('GET', '/', 'Home page');
  printResult(serverCheck);

  if (!serverCheck.success) {
    console.log(`${colors.red}✗ Server is not running or not accessible${colors.reset}`);
    console.log(`${colors.gray}  Start the dev server with: npm run dev${colors.reset}\n`);
    process.exit(1);
  }

  console.log(`${colors.green}✓ Server is running${colors.reset}\n`);

  // Test API endpoints
  console.log(`${colors.blue}Testing API endpoints...${colors.reset}\n`);

  const tests = [
    { method: 'GET', path: '/api/documents', description: 'List documents (should require auth)' },
    { method: 'POST', path: '/api/upload', description: 'Upload endpoint (should require auth)' },
    { method: 'POST', path: '/api/summarize', description: 'Summarize endpoint (should require auth)' }
  ];

  const results = [];
  for (const test of tests) {
    const result = await testEndpoint(test.method, test.path, test.description);
    result.method = test.method;
    results.push(result);
    printResult(result);
  }

  // Summary
  const successful = results.filter(r => r.success).length;
  const total = results.length;

  console.log(`${colors.blue}Summary:${colors.reset}`);
  console.log(`  ${successful}/${total} endpoints responded correctly\n`);

  console.log(`${colors.gray}Note: 401/403 status codes are expected for unauthenticated requests${colors.reset}`);
  console.log(`${colors.gray}Use authenticated requests to test full functionality${colors.reset}\n`);

  if (successful === total) {
    console.log(`${colors.green}✓ All endpoints are reachable${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.yellow}⚠ Some endpoints may need attention${colors.reset}\n`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error(`${colors.red}Error running tests:${colors.reset}`, error.message);
  process.exit(1);
});
