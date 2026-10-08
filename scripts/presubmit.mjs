#!/usr/bin/env node
/**
 * presubmit.mjs — Runs all quality gates before submission.
 * Per spec Section 12: secret scan, branch check, repo size, lint, typecheck,
 * tests with coverage, production build, npm audit, content verification.
 * Exits non-zero on the first failure.
 */

import { execSync } from 'node:child_process';

const steps = [
  { name: '1. Secret scan', cmd: 'node scripts/check-secrets.mjs' },
  { name: '2. Branch & repo check', cmd: 'node scripts/check-repo.mjs' },
  { name: '3. Lint', cmd: 'npx eslint . --ext .ts,.tsx --report-unused-disable-directives --max-warnings 0' },
  { name: '4. Typecheck', cmd: 'npx tsc -b --noEmit' },
  { name: '5. Tests', cmd: 'npx vitest run' },
  { name: '6. Production build', cmd: 'npx vite build' },
  { name: '7. npm audit', cmd: 'npm audit --omit=dev --audit-level=high' },
];

console.log('🔒 BugWug — Presubmit Gate\n');

let allPassed = true;

for (const step of steps) {
  console.log(`\n▶ ${step.name}`);
  try {
    execSync(step.cmd, { stdio: 'inherit', encoding: 'utf-8' });
    console.log(`  ✅ ${step.name} passed`);
  } catch (err) {
    console.error(`  ❌ ${step.name} FAILED`);
    allPassed = false;
    process.exit(1);
  }
}

console.log('\n' + '='.repeat(50));
if (allPassed) {
  console.log('🎉 All presubmit checks PASSED!');
  console.log('\nRequired links for submission:');
  console.log('  1. Deployment URL: _______________');
  console.log('  2. LinkedIn post URL: _______________');
  console.log('  3. GitHub repo URL: https://github.com/ranawhocodes/BugHuntArena');
} else {
  console.error('🚫 Presubmit FAILED. Fix issues before submitting.');
  process.exit(1);
}
