# Workflow Authoring Reference

A workflow structures work across many agents — to be comprehensive (decompose and cover in parallel), to be confident (independent perspectives and adversarial checks before committing), or to take on scale one context can't hold (migrations, audits, broad sweeps). The script is where you encode that structure: what fans out, what verifies, what synthesizes.

When you do call it, the right move is often **hybrid**: scout inline first (list the files, find the channels, scope the diff) to discover the work-list, then call Workflow to pipeline over it. You don't need to know the shape before the *task* — only before the *orchestration step*.

---

## Script Modes

### JavaScript Mode (Default)

Plain JavaScript — type annotations and generics are **not supported** and cause parse errors.

```javascript
export const meta = {
  name: 'example',
  description: 'Example workflow',
}

phase('Scan')
const result = await agent('Find files', {schema: FILES_SCHEMA})
```

### TypeScript Mode (Optional Opt-in)

Enable type-safe scripts with `mode: 'typescript'` in meta. TypeScript runs in a sandboxed transpiler with full type inference:

```javascript
export const meta = {
  name: 'typed-audit',
  description: 'Type-safe audit workflow',
  mode: 'typescript',
}

phase('Scan')
const result: AuditResult = await agent('Audit codebase', {schema: AUDIT_SCHEMA})
const critical: Finding[] = result.findings.filter(f => f.severity === 'critical')
```

TypeScript features available:
- Type annotations: `: string[]`, `: number`, `: AuditResult`
- Interfaces: `interface Finding { severity: string; message: string }`
- Generics: `const items: T[]`
- Enums and type aliases
- Type guards and utility types

---

## Meta Structure

Every script must begin with `export const meta = {...}`:

```javascript
export const meta = {
  name: 'find-flaky-tests',
  description: 'Find flaky tests and propose fixes', // shown in permission dialog
  mode: 'typescript',  // optional: 'javascript' (default) or 'typescript'
  whenToUse: 'When CI has flaky test failures',      // optional: shown in workflow list
  phases: [                                            // optional: phase descriptors
    { title: 'Scan', detail: 'grep test logs for retries' },
    { title: 'Fix',  detail: 'one agent per flaky test' },
  ],
}
```

**Meta requirements:**
- `name` — unique identifier (kebab-case recommended)
- `description` — one-line shown in permission dialog
- `mode` — `'javascript'` (default) or `'typescript'`
- `phases` — array of `{ title, detail }` objects matching `phase()` calls
- `whenToUse` — optional guidance for when to invoke this workflow

**TypeScript meta constraints:**
- Meta object must be a **pure literal** — no variables, function calls, spreads, or template interpolation
- All type annotations go **after** the meta block in the script body

---

## Core Script Hooks

### agent()

Spawns a subagent to perform work:

```javascript
// JavaScript mode
const result = await agent('Review this code', {schema: REVIEW_SCHEMA})

// TypeScript mode
const result: ReviewResult = await agent('Review this code', {schema: REVIEW_SCHEMA})
```

**Agent options:**

```typescript
interface AgentOptions {
  label?: string       // Override display label in progress tree
  phase?: string       // Assign to named phase group explicitly
  schema?: object       // JSON Schema for structured output
  model?: string        // Override model (e.g., 'sonnet', 'opus')
  effort?: 'low' | 'medium' | 'high' | 'xhigh' | 'max'
  isolation?: 'worktree'  // Run in isolated git worktree
  
  // Retry configuration
  retry?: {
    maxAttempts?: number      // Default: 3
    backoff?: {
      initial?: number        // Initial delay in ms. Default: 1000
      multiplier?: number      // Backoff multiplier. Default: 2
      maxDelay?: number        // Max delay in ms. Default: 30000
      jitter?: number          // Random jitter 0-1. Default: 0.1
    }
    retryable?: (error: Error) => boolean  // Custom retry predicate
  }
  
  // Timeout configuration
  timeout?: number  // Max execution time in ms. Default: no timeout
  
  // Circuit breaker
  circuitBreaker?: {
    enabled?: boolean           // Enable circuit breaker. Default: false
    errorThreshold?: number     // % errors before opening. Default: 50
    windowMs?: number           // Time window in ms. Default: 10000
    halfOpenAttempts?: number   // Test requests in half-open. Default: 3
  }
  
  agentType?: string  // Custom subagent type
}
```

**Retry examples:**

```javascript
// Basic retry (3 attempts, exponential backoff)
const result = await agent('API call', {
  schema: API_SCHEMA,
  retry: { maxAttempts: 3 }
})

// Custom backoff
const result = await agent('API call', {
  retry: {
    maxAttempts: 5,
    backoff: {
      initial: 500,
      multiplier: 2,
      maxDelay: 60000,
      jitter: 0.2
    }
  }
})

// Selective retry (only on network errors)
const result = await agent('API call', {
  retry: {
    maxAttempts: 3,
    retryable: (err) => err.message.includes('ECONNREFUSED') || err.message.includes('ETIMEDOUT')
  }
})
```

**Timeout examples:**

```javascript
// 30 second timeout
const quickCheck = await agent('Quick validation', {
  timeout: 30000
})

// 5 minute timeout for complex analysis
const deepAnalysis = await agent('Deep codebase analysis', {
  timeout: 300000
})
```

**Circuit breaker examples:**

```javascript
// Enable circuit breaker for unreliable service
const result = await agent('Call external API', {
  schema: API_SCHEMA,
  circuitBreaker: {
    enabled: true,
    errorThreshold: 50,      // Open after 50% errors
    windowMs: 10000,          // In 10 second window
    halfOpenAttempts: 3      // Try 3 requests half-open
  }
})
```

**Return behavior:**
- Without schema: returns final text as string
- With schema: returns validated JSON object
- Returns `null` if user skips, subagent dies after retries, or circuit breaker opens

### parallel()

Barrier execution — runs all tasks concurrently and **waits for all to complete**:

```javascript
const results = await parallel([
  () => agent('Review security', {schema: FINDINGS_SCHEMA}),
  () => agent('Review performance', {schema: FINDINGS_SCHEMA}),
  () => agent('Review correctness', {schema: FINDINGS_SCHEMA}),
])
// results = [securityFindings, perfFindings, correctnessFindings]
```

**Use parallel() ONLY when:**
- Stage N genuinely needs ALL results from stage N-1 together
- Examples: dedup across full result set, early-exit on zero count, cross-validation

**Do NOT use parallel() for:**
- Flattening/mapping/filtering (use inside pipeline stage)
- Running independent agents that don't need each other's results

### pipeline()

Fan-out execution — each item runs through all stages independently, **no barrier between stages**:

```javascript
const results = await pipeline(
  ['auth.ts', 'checkout.ts', 'inventory.ts'],
  async (file) => agent(`Review ${file}`, {schema: REVIEW_SCHEMA}),           // stage 1
  async (prev, file, idx) => agent(`Fix issues in ${file}`, {schema: FIX_SCHEMA}),  // stage 2
  async (prev, file, idx) => agent(`Verify ${file}`, {schema: VERIFY_SCHEMA})       // stage 3
)
// Item A can be in stage 3 while item B is still in stage 1
```

Stage callback signature: `(prevResult, originalItem, index)`

### phase()

Starts a new phase group in the progress display:

```javascript
phase('Scan')
const files = await agent('Find files', {schema: FILES_SCHEMA})

phase('Analyze')
const analysis = await agent('Analyze findings', {schema: ANALYSIS_SCHEMA})
```

### log()

Emit a progress message to the user:

```javascript
log('Found 47 issues across 12 files')
log(`Processing ${items.length} items...`)
```

### workflow()

Run another workflow inline as a sub-step:

```javascript
const auditResult = await workflow('full-audit', {deep: true})
const migrateResult = await workflow({scriptPath: './migrate-db.ts'}, {tables: ['users', 'orders']})
```

---

## Workflow Templates Library

### Template: Basic Audit

```javascript
// audit-template.js
export const meta = {
  name: 'audit',
  description: 'Comprehensive codebase audit',
  phases: [
    { title: 'Discover', detail: 'Find all target files' },
    { title: 'Analyze', detail: 'Run parallel analysis' },
    { title: 'Verify', detail: 'Adversarial verification' },
    { title: 'Report', detail: 'Synthesize findings' },
  ],
}

phase('Discover')
const files = await pipeline(
  ['**/*.ts', '**/*.js'],
  async (pattern) => agent(`List files matching ${pattern}`),
  async (files) => files.flat().filter(Boolean)
)

phase('Analyze')
const findings = await pipeline(
  files,
  async (file) => agent(`Analyze ${file} for bugs`, {schema: FINDING_SCHEMA})
)

phase('Verify')
const verified = await pipeline(
  findings.filter(f => f.severity === 'critical'),
  async (f) => agent(`Verify: ${f.description}`, {schema: VERDICT_SCHEMA})
)

return { files: files.length, critical: verified.filter(v => v.real).length }
```

### Template: Database Migration

```javascript
// migrate-template.js
export const meta = {
  name: 'migrate',
  description: 'Safe database migration workflow',
  phases: [
    { title: 'Backup', detail: 'Create database backup' },
    { title: 'Plan', detail: 'Generate migration plan' },
    { title: 'Execute', detail: 'Apply migrations in worktree' },
    { title: 'Verify', detail: 'Validate data integrity' },
  ],
}

phase('Backup')
const backup = await agent('Create database backup', {schema: BACKUP_SCHEMA})

phase('Plan')
const plan = await agent('Generate migration plan', {schema: PLAN_SCHEMA})

phase('Execute')
const results = await pipeline(
  plan.migrations,
  async (m) => agent(m.sql, {
    isolation: 'worktree',
    retry: { maxAttempts: 3, backoff: { initial: 1000, multiplier: 2 } }
  })
)

phase('Verify')
const integrity = await agent('Verify data integrity', {schema: INTEGRITY_SCHEMA})

return { backup, plan, results, integrity }
```

### Template: Code Review

```javascript
// review-template.js
export const meta = {
  name: 'review',
  description: 'Multi-perspective code review',
  phases: [
    { title: 'Security', detail: 'Security review' },
    { title: 'Performance', detail: 'Performance review' },
    { title: 'Correctness', detail: 'Correctness review' },
    { title: 'Style', detail: 'Style and maintainability' },
    { title: 'Synthesize', detail: 'Merge findings' },
  ],
}

const LENSES = [
  { title: 'Security', prompt: 'Review for security vulnerabilities' },
  { title: 'Performance', prompt: 'Review for performance issues' },
  { title: 'Correctness', prompt: 'Review for correctness bugs' },
  { title: 'Style', prompt: 'Review for code style and maintainability' },
]

const allFindings = await parallel(
  LENSES.map(lens => () => agent(`${lens.prompt}: ${args.diff}`, {
    phase: lens.title,
    schema: FINDINGS_SCHEMA
  }))
)

phase('Synthesize')
const report = await agent('Synthesize all findings', {
  schema: REPORT_SCHEMA
})

return report
```

### Template: Research Sweep

```javascript
// research-template.js
export const meta = {
  name: 'research',
  description: 'Multi-modal research with synthesis',
  phases: [
    { title: 'Sweep', detail: 'Parallel research across sources' },
    { title: 'Deep-dive', detail: 'Deep read on key findings' },
    { title: 'Synthesize', detail: 'Merge into coherent report' },
  ],
}

const QUERIES = [
  'Official documentation',
  'Community discussions',
  'Best practices',
  'Common pitfalls',
  'Real-world examples',
]

phase('Sweep')
const sweepResults = await pipeline(
  QUERIES,
  async (q) => agent(`Research: ${q} about ${args.topic}`)
)

phase('Deep-dive')
const deepDives = await pipeline(
  sweepResults.slice(0, 5),  // Top 5 findings
  async (finding) => agent(`Deep research: ${finding.topic}`)
)

phase('Synthesize')
const report = await agent('Synthesize research', {schema: REPORT_SCHEMA})
return report
```

### Template: Parallel Migration

```javascript
// parallel-migrate-template.js
export const meta = {
  name: 'parallel-migrate',
  description: 'Migrate multiple entities in parallel with isolation',
  phases: [
    { title: 'Discover', detail: 'Find migration targets' },
    { title: 'Migrate', detail: 'Parallel migration with worktree isolation' },
    { title: 'Verify', detail: 'Verify all migrations' },
  ],
}

phase('Discover')
const targets = await agent('List migration targets', {schema: TARGETS_SCHEMA})

phase('Migrate')
const results = await pipeline(
  targets,
  async (target) => agent(`Migrate ${target.name}`, {
    isolation: 'worktree',
    retry: {
      maxAttempts: 3,
      backoff: { initial: 500, multiplier: 2, maxDelay: 30000 }
    },
    timeout: 120000
  })
)

phase('Verify')
const verified = await parallel(
  results.filter(r => r.success).map(r => () =>
    agent(`Verify migration: ${r.name}`, {schema: VERIFY_SCHEMA})
  )
)

return { total: targets.length, successful: verified.filter(Boolean).length }
```

### Template: Loop Until Dry (Discovery)

```javascript
// discovery-template.js
export const meta = {
  name: 'discover',
  description: 'Exhaustive discovery with loop-until-dry',
  phases: [
    { title: 'Discover', detail: 'Loop until no new findings' },
    { title: 'Verify', detail: 'Verify all findings' },
  ],
}

const seen = new Set()
let confirmed = []
let roundsWithoutNew = 0
const MAX_DRY_ROUNDS = 3

while (roundsWithoutNew < MAX_DRY_ROUNDS) {
  phase('Discover')
  
  const finders = [
    () => agent('Find edge cases', {schema: FINDINGS_SCHEMA}),
    () => agent('Find security issues', {schema: FINDINGS_SCHEMA}),
    () => agent('Find performance issues', {schema: FINDINGS_SCHEMA}),
  ]
  
  const allFound = (await parallel(finders))
    .filter(Boolean)
    .flatMap(r => r.findings || [])
  
  const fresh = allFound.filter(f => !seen.has(key(f)))
  
  if (!fresh.length) {
    roundsWithoutNew++
    log(`No new findings (round ${roundsWithoutNew}/${MAX_DRY_ROUNDS})`)
    continue
  }
  
  roundsWithoutNew = 0
  fresh.forEach(f => seen.add(key(f)))
  
  phase('Verify')
  const verified = await pipeline(
    fresh,
    async (f) => agent(`Verify: ${f.description}`, {schema: VERDICT_SCHEMA})
  )
  
  confirmed.push(...verified.filter(v => v.real))
  log(`Found ${fresh.length} new issues, ${confirmed.length} confirmed total`)
}

return confirmed
```

---

## Advanced Patterns

### Adversarial Verification

Spawn N independent skeptics, each trying to refute. Kill if majority refute:

```javascript
const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    real: { type: 'boolean', description: 'Is this finding valid?' },
    confidence: { type: 'number', description: '0-1 confidence score' },
  },
  required: ['real']
}

const votes = await parallel(
  Array.from({length: 3}, () => () =>
    agent(`Try to refute: ${finding.desc}. Default to real=false if uncertain.`, {
      schema: VERDICT_SCHEMA
    })
  )
)

const survives = votes
  .filter(Boolean)
  .filter(v => v.real)
  .length >= 2

if (!survives) {
  log(`REFUTED: ${finding.desc}`)
} else {
  confirmedFindings.push(finding)
}
```

### Perspective-Diverse Verification

Different lenses catch different failure modes:

```javascript
const lenses = [
  { name: 'correctness', prompt: 'Does this code produce correct output?' },
  { name: 'security', prompt: 'Are there security vulnerabilities?' },
  { name: 'performance', prompt: 'Are there performance bottlenecks?' },
  { name: 'edge-cases', prompt: 'What edge cases are not handled?' },
]

const judgments = await pipeline(
  findings,
  async (finding) => {
    const results = await parallel(
      lenses.map(lens => () => agent(`${lens.prompt}: ${finding.desc}`, {
        schema: VERDICT_SCHEMA
      }))
    )
    return {
      finding,
      scores: Object.fromEntries(
        lenses.map((l, i) => [l.name, results[i]?.score || 0])
      )
    }
  }
)
```

### Judge Panel

Multiple approaches evaluated by parallel judges:

```javascript
const approaches = [
  () => agent('Solve using clean architecture', {schema: SOLUTION_SCHEMA}),
  () => agent('Solve using functional approach', {schema: SOLUTION_SCHEMA}),
  () => agent('Solve using minimal changes', {schema: SOLUTION_SCHEMA}),
]

const candidates = (await parallel(approaches)).filter(Boolean)

const judged = await pipeline(
  candidates,
  async (solution) => agent('Score solution quality', {schema: SCORE_SCHEMA})
)

const winner = judged.reduce((best, curr) => 
  curr.score > best.score ? curr : best
)

return winner
```

### Circuit Breaker Pattern

Protect against cascading failures in external integrations:

```javascript
// Shared circuit breaker state
const cbState = { failures: 0, lastFailure: 0, state: 'closed' }

async function callWithCircuitBreaker(prompt, options = {}) {
  const { errorThreshold = 50, windowMs = 10000, halfOpenAttempts = 3 } = 
    options.circuitBreaker || {}
  
  if (cbState.state === 'open') {
    if (Date.now() - cbState.lastFailure > windowMs) {
      cbState.state = 'half-open'
      cbState.testAttempts = 0
    } else {
      throw new Error('CIRCUIT_OPEN: Service unavailable')
    }
  }
  
  if (cbState.state === 'half-open') {
    if (cbState.testAttempts >= halfOpenAttempts) {
      throw new Error('CIRCUIT_HALF_OPEN_MAX: Max test attempts reached')
    }
    cbState.testAttempts++
  }
  
  try {
    const result = await agent(prompt, options)
    
    // Success - close circuit if half-open
    if (cbState.state === 'half-open') {
      cbState.state = 'closed'
      cbState.failures = 0
    }
    
    return result
  } catch (error) {
    cbState.failures++
    cbState.lastFailure = Date.now()
    
    const failureRate = cbState.failures / 10  // Simplified
    if (failureRate >= errorThreshold / 100 || cbState.state === 'half-open') {
      cbState.state = 'open'
      log(`Circuit opened after ${cbState.failures} failures`)
    }
    
    throw error
  }
}

// Usage with automatic circuit breaker
const result = await agent('Call external API', {
  schema: API_SCHEMA,
  circuitBreaker: {
    enabled: true,
    errorThreshold: 50,
    windowMs: 10000,
    halfOpenAttempts: 3
  }
})
```

### Retry with Circuit Breaker

Combine retry and circuit breaker for resilient external calls:

```javascript
async function resilientCall(prompt, options = {}) {
  const { maxAttempts = 3, ...retryOpts } = options.retry || {}
  const circuitBreaker = options.circuitBreaker
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await agent(prompt, {
        ...options,
        retry: undefined,
        circuitBreaker: undefined
      })
    } catch (error) {
      if (attempt === maxAttempts) throw error
      
      const shouldRetry = options.retry?.retryable?.(error) ?? true
      if (!shouldRetry) throw error
      
      if (circuitBreaker?.enabled && 
          error.message?.includes('CIRCUIT_OPEN')) {
        throw error  // Don't retry if circuit is open
      }
      
      const delay = calculateBackoff(attempt, retryOpts.backoff)
      log(`Attempt ${attempt} failed, retrying in ${delay}ms...`)
      await new Promise(r => setTimeout(r, delay))
    }
  }
}
```

### Budget-Aware Scaling

Scale parallelism to available budget:

```javascript
const FLEET_SIZE = budget.total 
  ? Math.max(1, Math.floor(budget.remaining() / 100_000))
  : 5

const chunkSize = Math.ceil(files.length / FLEET_SIZE)
const chunks = []
for (let i = 0; i < files.length; i += chunkSize) {
  chunks.push(files.slice(i, i + chunkSize))
}

const results = await parallel(
  chunks.map(chunk => () => 
    pipeline(chunk, async (f) => agent(`Process ${f}`, {schema: RESULT_SCHEMA}))
  )
)
```

### Timeout with Graceful Degradation

```javascript
async function timedAgent(prompt, timeout, fallback) {
  try {
    return await agent(prompt, { timeout })
  } catch (error) {
    if (error.message.includes('TIMEOUT')) {
      log(`Agent timed out after ${timeout}ms, using fallback`)
      return fallback
    }
    throw error
  }
}

// Usage
const critical = await timedAgent(
  'Analyze critical path',
  60000,  // 1 minute timeout
  { analysis: 'timeout', recommendations: [] }  // Fallback
)
```

---

## Error Handling

### Structured Error Types

```javascript
class WorkflowError extends Error {
  constructor(message, code, context = {}) {
    super(message)
    this.name = 'WorkflowError'
    this.code = code
    this.context = context
  }
}

class AgentError extends WorkflowError {
  constructor(message, agentLabel, attempts, lastError) {
    super(message, 'AGENT_ERROR', { agentLabel, attempts, lastError })
    this.name = 'AgentError'
  }
}

class TimeoutError extends WorkflowError {
  constructor(agentLabel, timeoutMs) {
    super(`Agent "${agentLabel}" timed out after ${timeoutMs}ms`, 'TIMEOUT', { agentLabel, timeoutMs })
    this.name = 'TimeoutError'
  }
}

class CircuitOpenError extends WorkflowError {
  constructor(serviceName, lastFailure) {
    super(`Circuit breaker open for ${serviceName}`, 'CIRCUIT_OPEN', { serviceName, lastFailure })
    this.name = 'CircuitOpenError'
  }
}

class RetryExhaustedError extends WorkflowError {
  constructor(agentLabel, attempts, lastError) {
    super(`All ${attempts} retry attempts exhausted for "${agentLabel}"`, 'RETRY_EXHAUSTED', { agentLabel, attempts, lastError })
    this.name = 'RetryExhaustedError'
  }
}
```

### Error Handling Patterns

```javascript
// Try-catch with typed errors
try {
  const result = await agent('Risky operation', {
    retry: { maxAttempts: 3 },
    circuitBreaker: { enabled: true }
  })
  return result
} catch (error) {
  if (error instanceof TimeoutError) {
    return fallbackResult
  } else if (error instanceof CircuitOpenError) {
    log('External service unavailable, using cached data')
    return cachedResult
  } else if (error instanceof RetryExhaustedError) {
    log(`Failed after ${error.context.attempts} attempts`)
    throw error
  }
  throw error
}

// Null coalescing for optional agents
const optionalResult = await agent('Optional enhancement', {
  schema: ENHANCEMENT_SCHEMA,
  retry: { maxAttempts: 1 }
}).catch(() => null)

const final = optionalResult || defaultEnhancement
```

---

## Resume

The tool result includes a runId. To resume after a pause, kill, or script edit:

```javascript
// Option 1: Resume from last run
await workflow({name: 'my-workflow', resumeFromRunId: 'run-abc123'})

// Option 2: Edit script and resume
// Edit the workflow script file, then:
await workflow({scriptPath: './workflow.ts', resumeFromRunId: 'run-abc123'})
```

**Cache behavior:**
- Same script + same args → 100% cache hit
- Unchanged agent() calls return cached results instantly
- First edited/new call and everything after runs live

**Before diagnosing unexpected results:**
- Read `<transcriptDir>/journal.jsonl` — records actual agent return values
- Do not assume cached results are non-empty
- Fallback: Read `agent-<id>.jsonl` files in transcript directory

**Timestamp/Random limitations:**
- `Date.now()`, `Math.random()`, argless `new Date()` throw (break resume)
- Pass timestamps via args
- Stamp results after workflow returns
- For randomness: vary agent prompt/label by index

---

## Complete Example

```javascript
// comprehensive-audit.js
export const meta = {
  name: 'comprehensive-audit',
  description: 'Multi-phase audit with retry and verification',
  mode: 'typescript',
  phases: [
    { title: 'Discover', detail: 'Find all source files' },
    { title: 'Analyze', detail: 'Parallel security/performance review' },
    { title: 'Verify', detail: 'Adversarial verification' },
    { title: 'Report', detail: 'Generate final report' },
  ],
}

// Types (TypeScript mode)
interface Finding {
  type: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  file: string
  line: number
  description: string
}

interface Verdict {
  real: boolean
  confidence: number
}

// Discover phase
phase('Discover')
const files = await agent('Find all TypeScript files in src/', {
  schema: { type: 'object', properties: { files: { type: 'array', items: { type: 'string' } } }, required: ['files'] }
})

// Analyze phase with retry
phase('Analyze')
const securityFindings = await pipeline(
  files.files,
  async (file) => agent(`Security audit ${file}`, {
    schema: { type: 'object', properties: { findings: { type: 'array' } } },
    retry: { maxAttempts: 3, backoff: { initial: 1000, multiplier: 2, maxDelay: 30000 } },
    timeout: 120000
  })
)

const perfFindings = await pipeline(
  files.files,
  async (file) => agent(`Performance audit ${file}`, {
    schema: { type: 'object', properties: { findings: { type: 'array' } } },
    retry: { maxAttempts: 3 }
  })
)

const allFindings: Finding[] = [
  ...securityFindings.flatMap(r => r?.findings || []),
  ...perfFindings.flatMap(r => r?.findings || [])
]

// Verify critical findings with circuit breaker
phase('Verify')
const criticalFindings = allFindings.filter(f => f.severity === 'critical')

const verified = await pipeline(
  criticalFindings,
  async (finding) => agent(`Verify: ${finding.description}`, {
    schema: { type: 'object', properties: { real: { type: 'boolean' } }, required: ['real'] },
    circuitBreaker: { enabled: true, errorThreshold: 50, windowMs: 10000 }
  })
)

const confirmedFindings = verified
  .filter((v: Verdict | null) => v?.real)
  .map((_, i) => criticalFindings[i])

// Report
phase('Report')
const report = await agent('Generate audit report', {
  schema: {
    type: 'object',
    properties: {
      summary: { type: 'string' },
      critical: { type: 'array' },
      recommendations: { type: 'array' }
    }
  }
})

return report
```

---

## Quick Reference

| Feature | Syntax | Default |
|---------|--------|---------|
| Mode | `mode: 'typescript'` | `'javascript'` |
| Retry | `retry: { maxAttempts: 3 }` | No retry |
| Backoff | `backoff: { initial: 1000, multiplier: 2 }` | 1s, 2x |
| Timeout | `timeout: 30000` | No timeout |
| Circuit Breaker | `circuitBreaker: { enabled: true }` | Disabled |
| Isolation | `isolation: 'worktree'` | None |
| Model override | `model: 'opus'` | Session default |
| Effort override | `effort: 'high'` | Session default |

---

## Anti-Patterns to Avoid

1. **Don't use parallel() as a barrier for map/filter** — use pipeline stage instead
2. **Don't hardcode Date.now()** — pass timestamps via args
3. **Don't use TypeScript syntax in JavaScript mode** — parse errors
4. **Don't skip error handling on retries** — handle terminal failures
5. **Don't ignore circuit breaker state** — log state changes
6. **Don't leave timeouts unbounded** — set reasonable defaults
7. **Don't skip silent truncation logging** — use log() to report dropped items
