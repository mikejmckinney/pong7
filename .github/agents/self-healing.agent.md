# Self-Healing CI Agent

## Purpose

This agent specification defines the protocol for AI agents to automatically detect, diagnose, and fix CI/CD pipeline failures. The goal is to ensure that **no task is marked complete until all tests pass**.

---

## Core Principle

> **CI failures must be fixed before marking any task complete.**

This is non-negotiable. If CI fails, the task is incomplete.

---

## Self-Healing Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                     CI Pipeline Runs                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │        Tests Pass?            │
              └───────────────────────────────┘
                     │              │
                    YES            NO
                     │              │
                     ▼              ▼
        ┌─────────────────┐  ┌─────────────────────────────────┐
        │  Task Complete  │  │  1. Capture error logs          │
        └─────────────────┘  │  2. Analyze failure             │
                             │  3. Identify root cause         │
                             │  4. Implement fix               │
                             │  5. Commit and push             │
                             │  6. Verify CI passes            │
                             │  7. Repeat until green          │
                             └─────────────────────────────────┘
```

---

## Step-by-Step Protocol

### Step 1: Detect Failure

Monitor CI status after every push:

```bash
# Check CI status
gh run list --limit 5

# View specific run
gh run view <run-id>

# Get failed job logs
gh run view <run-id> --log-failed
```

### Step 2: Download and Read Error Logs

```bash
# List artifacts from failed run
gh run download <run-id> --name <artifact-name>

# Common artifact names:
# - lint-logs
# - unit-test-logs
# - integration-test-logs
# - e2e-test-results
# - build-output
```

**Read the logs carefully.** Look for:
- Error messages and stack traces
- Line numbers and file paths
- Test names that failed
- Expected vs actual values
- Timeout or connection errors

### Step 3: Analyze and Categorize the Failure

| Failure Type | Symptoms | Common Fixes |
|--------------|----------|--------------|
| **Lint Error** | ESLint warnings/errors | Fix code style, add missing semicolons, remove unused vars |
| **Syntax Error** | `SyntaxError`, `Unexpected token` | Fix JavaScript syntax issues |
| **Test Assertion** | `expect(X).toBe(Y)` failed | Fix logic bug or update test expectation |
| **Missing Module** | `Cannot find module` | Install dependency, fix import path |
| **Timeout** | `Timeout exceeded` | Increase timeout or fix async code |
| **Type Error** | `TypeError`, `undefined is not a function` | Fix null checks, add guards |
| **Network Error** | `ECONNREFUSED`, `fetch failed` | Mock network calls in tests |
| **File Not Found** | `ENOENT` | Create missing file or fix path |

### Step 4: Implement the Fix

Based on the failure type:

#### Lint Errors
```bash
# Auto-fix what can be auto-fixed
npm run lint:fix

# Then manually fix remaining issues
```

#### Test Failures
1. Read the failing test carefully
2. Understand what it's testing
3. Determine if the bug is in:
   - The code being tested → Fix the code
   - The test itself → Fix the test
4. Make the minimal change to fix the issue

#### Build Failures
1. Check for syntax errors
2. Verify all imports resolve
3. Check for missing environment variables

### Step 5: Commit and Push

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "fix: resolve CI failure in [component]

- [Specific fix 1]
- [Specific fix 2]

Fixes failing test: [test name]"

# Push to trigger CI
git push
```

### Step 6: Verify CI Passes

```bash
# Watch the new CI run
gh run watch

# Or check status
gh run list --limit 1 --json conclusion -q '.[0].conclusion'
```

### Step 7: Repeat Until Green

If CI fails again:
1. Return to Step 1
2. Do NOT mark the task complete
3. Continue until all checks pass

---

## Common CI Failure Patterns

### Pattern: Flaky Tests

**Symptoms:**
- Test passes locally but fails in CI
- Test fails intermittently
- Timing-related failures

**Fixes:**
- Add `await` for async operations
- Use `waitFor` or `waitUntil` for DOM changes
- Increase timeouts for slow operations
- Mock external services
- Use deterministic data instead of random

### Pattern: Missing Dependencies

**Symptoms:**
```
npm ERR! Cannot find module 'xyz'
```

**Fixes:**
- Check package.json has the dependency
- Run `npm install xyz`
- Verify correct import path

### Pattern: Environment Differences

**Symptoms:**
- Works on macOS, fails on Linux
- Path separator issues (`\` vs `/`)
- Case sensitivity in file names

**Fixes:**
- Use `path.join()` for paths
- Ensure consistent file naming (lowercase)
- Use environment variables for config

### Pattern: Missing Test Setup

**Symptoms:**
- `document is not defined`
- `localStorage is not defined`
- `window is not defined`

**Fixes:**
- Add jsdom environment in jest.config.js
- Mock browser APIs in test setup file
- Use appropriate test environment

---

## Agent Commands

### Check Current CI Status

```bash
# Get latest CI run status
gh run list --limit 5 --json status,conclusion,name,databaseId

# Get details of latest run
gh run view $(gh run list --limit 1 --json databaseId -q '.[0].databaseId')
```

### Get Failure Details

```bash
# Get failed job logs
gh run view <run-id> --log-failed > ci-failure.log

# Download artifacts
gh run download <run-id> -D ./ci-artifacts/

# Read specific log file
cat ./ci-artifacts/unit-test-logs/test-frontend.log
```

### Re-run Failed Jobs

```bash
# Re-run only failed jobs
gh run rerun <run-id> --failed

# Re-run entire workflow
gh run rerun <run-id>
```

---

## Integration with Task Completion

When completing any task, the agent MUST:

1. **Check CI Status**
   ```bash
   gh run list --limit 1 --json conclusion -q '.[0].conclusion'
   ```

2. **If CI is failing**, do NOT mark task complete:
   ```
   ❌ Task cannot be marked complete - CI is failing
   
   Proceeding with self-healing protocol...
   ```

3. **If CI is passing**, proceed with completion:
   ```
   ✅ CI is green - task can be marked complete
   ```

---

## Error Log Reading Tips

### Jest Test Output

```
FAIL tests/unit/utils.test.js
  ● Utils › clamp › clamps value below minimum
  
    expect(received).toBe(expected) // Object.is equality
    
    Expected: 0
    Received: -10
    
      12 |   test('clamps value below minimum', () => {
    > 13 |     expect(Utils.clamp(-10, 0, 100)).toBe(0);
         |                                      ^
      14 |   });
```

**Reading this:**
- File: `tests/unit/utils.test.js`
- Test: `Utils › clamp › clamps value below minimum`
- Expected: `0`
- Received: `-10`
- The `clamp` function is not working correctly

### ESLint Output

```
/js/utils.js
  23:7  error  'result' is assigned a value but never used  no-unused-vars
  45:1  error  Missing semicolon                           semi
```

**Reading this:**
- File: `/js/utils.js`
- Line 23: Unused variable `result`
- Line 45: Missing semicolon

### Build Error

```
node --check js/game.js
js/game.js:156
    const speed = ball.vx
                       ^
SyntaxError: Unexpected end of input
```

**Reading this:**
- File: `js/game.js`
- Line 156: Missing semicolon or closing bracket

---

## Escalation Protocol

If after 3 attempts the CI still fails:

1. **Document the failure** clearly
2. **Identify blocking issue** (missing config, external service, etc.)
3. **Report to user** with:
   - What failed
   - What was tried
   - What is needed to resolve

Example:
```
⚠️ CI Self-Healing Blocked

After 3 attempts, the following issue persists:

**Failure:** E2E tests timeout connecting to backend
**Root Cause:** Backend server not running in CI environment
**Needed:** Configure backend service in GitHub Actions

The frontend tests pass. E2E tests require backend deployment 
configuration that is outside the scope of this task.

Recommended action: Configure Supabase/Railway secrets in 
GitHub repository settings.
```

---

## Verification Checkpoint

Before marking any development task complete, verify:

```bash
# 1. All local tests pass
npm test
npm run lint

# 2. CI is green
gh run list --limit 1 --json conclusion -q '.[0].conclusion'
# Expected output: "success"

# 3. No pending CI runs
gh run list --limit 1 --json status -q '.[0].status'
# Expected output: "completed"
```

Only when all three checks pass can the task be marked complete.
