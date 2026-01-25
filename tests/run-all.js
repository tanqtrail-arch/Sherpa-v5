#!/usr/bin/env node
/**
 * Test Runner - Run all tests
 * テストランナー - すべてのテストを実行
 *
 * Usage: node tests/run-all.js
 */

const { execSync } = require('child_process');
const path = require('path');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

const testFiles = [
  'quiz-categorization.test.js',
  'data-integrity.test.js'
];

console.log(`\n${colors.cyan}╔════════════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.cyan}║     探究学習カリキュラム - テストスイート            ║${colors.reset}`);
console.log(`${colors.cyan}║     Exploratory Learning Curriculum Test Suite     ║${colors.reset}`);
console.log(`${colors.cyan}╚════════════════════════════════════════════════════╝${colors.reset}\n`);

let totalPassed = 0;
let totalFailed = 0;
const results = [];

testFiles.forEach((file, index) => {
  console.log(`${colors.yellow}[${index + 1}/${testFiles.length}] Running: ${file}${colors.reset}`);
  console.log('-'.repeat(50));

  try {
    const testPath = path.join(__dirname, file);
    execSync(`node "${testPath}"`, { stdio: 'inherit' });
    results.push({ file, status: 'passed' });
    console.log(`${colors.green}✓ ${file} completed successfully${colors.reset}\n`);
  } catch (error) {
    results.push({ file, status: 'failed' });
    console.log(`${colors.red}✗ ${file} had failures${colors.reset}\n`);
  }
});

// Final Summary
console.log(`\n${colors.cyan}════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.cyan}              Final Test Results Summary             ${colors.reset}`);
console.log(`${colors.cyan}════════════════════════════════════════════════════${colors.reset}\n`);

results.forEach((result, index) => {
  const icon = result.status === 'passed' ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
  console.log(`  ${icon} ${result.file}`);
});

const passedCount = results.filter(r => r.status === 'passed').length;
const failedCount = results.filter(r => r.status === 'failed').length;

console.log(`\n  ${colors.blue}Total: ${results.length} test files${colors.reset}`);
console.log(`  ${colors.green}Passed: ${passedCount}${colors.reset}`);
console.log(`  ${colors.red}Failed: ${failedCount}${colors.reset}`);

if (failedCount > 0) {
  console.log(`\n${colors.red}Some tests failed. Please review the output above.${colors.reset}\n`);
  process.exit(1);
} else {
  console.log(`\n${colors.green}All tests passed! 🎉${colors.reset}\n`);
  process.exit(0);
}
