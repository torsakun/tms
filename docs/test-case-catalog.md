# QMaster — Test Case Catalog

เอกสารนี้รวบรวม **test case ทั้งหมด** ในโปรเจกต์ QMaster โดยอัตโนมัติจากไฟล์ test จริง
(สร้างจาก `scripts/build-test-catalog.mjs` — regenerate ได้เมื่อ test เปลี่ยน)

## สรุป

| ระดับ | จำนวน test | ครอบคลุม |
|---|---|---|
| Unit | 287 | API routes, lib utilities — logic ราย function (mock DB/auth) |
| Integration | 8 | API หลาย layer ทำงานร่วมกัน |
| System (E2E legacy) | 12 | End-to-end เดิม |
| UI E2E (Playwright) | 12 | คลิกหน้าจอจริง (Auth + Core CRUD) |
| **รวม** | **319** (1 skipped) | |

---

## Unit

### Ai Batch Generate

`tests/unit/ai-batch-generate.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 1 | POST /api/projects/[code]/ai/batch-generate | returns 400 when caseIds is missing or empty | ✅ active |
| 2 | POST /api/projects/[code]/ai/batch-generate | throws when OpenAI key is not configured | ✅ active |
| 3 | POST /api/projects/[code]/ai/batch-generate | throws when Gemini key is not configured | ✅ active |
| 4 | POST /api/projects/[code]/ai/batch-generate | throws when Claude key is not configured | ✅ active |
| 5 | POST /api/projects/[code]/ai/batch-generate | generates script and updates test case when OpenAI key is set | ✅ active |

### Audit Logger

`tests/unit/audit-logger.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 6 | logAudit | creates audit log with string details | ✅ active |
| 7 | logAudit | serializes object details to JSON string | ✅ active |
| 8 | logAudit | stores null when details is not provided | ✅ active |
| 9 | logAudit | does not throw when DB write fails | ✅ active |

### Auth Options

`tests/unit/auth-options.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 10 | authOptions credentials provider | authorizes a user with valid email and password | ✅ active |
| 11 | authOptions credentials provider | rejects missing credentials | ✅ active |
| 12 | authOptions credentials provider | rejects an unknown email | ✅ active |
| 13 | authOptions credentials provider | rejects an invalid password | ✅ active |
| 14 | authOptions callbacks | adds user id and role to the JWT | ✅ active |
| 15 | authOptions callbacks | adds token id and role to the session user | ✅ active |

### By Code Runs

`tests/unit/by-code-runs.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 16 | GET /api/projects/by-code/[code]/runs | returns 404 when project not found | ✅ active |
| 17 | GET /api/projects/by-code/[code]/runs | returns 200 with testRuns array when project exists | ✅ active |
| 18 | GET /api/projects/by-code/[code]/runs | returns 500 when DB throws an error | ✅ active |
| 19 | POST /api/projects/by-code/[code]/runs | returns 404 when project not found | ✅ active |
| 20 | POST /api/projects/by-code/[code]/runs | returns 400 when neither caseIds nor planId is provided | ✅ active |
| 21 | POST /api/projects/by-code/[code]/runs | returns 201 and creates run with results for the provided caseIds | ✅ active |

### Case Delete

`tests/unit/case-delete.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 22 | DELETE /api/projects/[code]/cases/[caseId] | returns 401 when user is not authenticated | ✅ active |
| 23 | DELETE /api/projects/[code]/cases/[caseId] | returns 404 when project does not exist | ✅ active |
| 24 | DELETE /api/projects/[code]/cases/[caseId] | returns 404 when case belongs to a different project | ✅ active |
| 25 | DELETE /api/projects/[code]/cases/[caseId] | deletes the case and returns success | ✅ active |
| 26 | DELETE /api/projects/[code]/cases/[caseId] | logs audit entry after successful deletion | ✅ active |

### Case Detail

`tests/unit/case-detail.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 27 | DELETE /api/projects/[code]/cases/[caseId] | returns 401 when there is no session | ✅ active |
| 28 | DELETE /api/projects/[code]/cases/[caseId] | returns 404 when project is not found | ✅ active |
| 29 | DELETE /api/projects/[code]/cases/[caseId] | returns 404 when test case is not found | ✅ active |
| 30 | DELETE /api/projects/[code]/cases/[caseId] | returns 404 when test case projectId does not match project | ✅ active |
| 31 | DELETE /api/projects/[code]/cases/[caseId] | deletes the test case, calls logAudit, and returns { success: true } | ✅ active |
| 32 | DELETE /api/projects/[code]/cases/[caseId] | returns 500 when delete throws an error | ✅ active |

### Case Github Pr

`tests/unit/case-github-pr.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 33 | POST /api/projects/[code]/cases/[caseId]/github/pr | returns 404 when test case not found | ✅ active |
| 34 | POST /api/projects/[code]/cases/[caseId]/github/pr | returns 404 when test case has no automation script | ✅ active |
| 35 | POST /api/projects/[code]/cases/[caseId]/github/pr | returns 400 when GitHub credentials are not configured | ✅ active |
| 36 | POST /api/projects/[code]/cases/[caseId]/github/pr | creates PR and updates githubPrUrl on success | ✅ active |
| 37 | POST /api/projects/[code]/cases/[caseId]/github/pr | returns 500 when GitHub API fails | ✅ active |

### Case Verify

`tests/unit/case-verify.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 38 | POST /api/projects/[code]/cases/[caseId]/verify | returns 400 when no script is provided | ✅ active |
| 39 | POST /api/projects/[code]/cases/[caseId]/verify | returns passed=true and saves log when playwright succeeds | ✅ active |
| 40 | POST /api/projects/[code]/cases/[caseId]/verify | returns passed=false when playwright exits with error | ✅ active |
| 41 | POST /api/projects/[code]/cases/[caseId]/verify | wraps bare script in a playwright test block | ✅ active |
| 42 | POST /api/projects/[code]/cases/[caseId]/verify | Automated Test Case | ✅ active |
| 43 | POST /api/projects/[code]/cases/[caseId]/verify | does not double-wrap scripts that already contain test( | ✅ active |
| 44 | POST /api/projects/[code]/cases/[caseId]/verify | Automated Test Case | ✅ active |

### Cases Bulk

`tests/unit/cases-bulk.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 45 | DELETE /api/projects/[code]/cases/bulk | returns 401 when not authenticated | ✅ active |
| 46 | DELETE /api/projects/[code]/cases/bulk | returns 403 when user lacks role | ✅ active |
| 47 | DELETE /api/projects/[code]/cases/bulk | returns 400 when caseIds is empty | ✅ active |
| 48 | DELETE /api/projects/[code]/cases/bulk | deletes cases scoped to project and returns count | ✅ active |
| 49 | DELETE /api/projects/[code]/cases/bulk | returns 404 when project not found | ✅ active |
| 50 | POST /api/projects/[code]/cases/bulk-clone | returns 401 when not authenticated | ✅ active |
| 51 | POST /api/projects/[code]/cases/bulk-clone | returns 400 when caseIds is empty | ✅ active |
| 52 | POST /api/projects/[code]/cases/bulk-clone | returns 404 when no cases found in project | ✅ active |
| 53 | POST /api/projects/[code]/cases/bulk-clone | clones cases into destination suite | ✅ active |
| 54 | POST /api/projects/[code]/cases/bulk-clone | keeps original suiteId when destinationId is undefined | ✅ active |

### Cases Route

`tests/unit/cases-route.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 55 | POST /api/projects/[code]/cases | returns 404 when project not found | ✅ active |
| 56 | POST /api/projects/[code]/cases | returns 401 when no session | ✅ active |
| 57 | POST /api/projects/[code]/cases | returns 403 when requireProjectRole returns false | ✅ active |
| 58 | POST /api/projects/[code]/cases | returns 400 when zod validation fails (missing title) | ✅ active |
| 59 | POST /api/projects/[code]/cases | returns 201 and creates case with sequenceNumber | ✅ active |
| 60 | GET /api/projects/[code]/cases | returns all cases when no automationStatus filter | ✅ active |
| 61 | GET /api/projects/[code]/cases | filters by automationStatus when query param is present | ✅ active |
| 62 | GET /api/projects/[code]/cases | returns 404 when project not found | ✅ active |

### Cron Branches

`tests/unit/cron-branches.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 63 | POST /api/cron/process-schedules | returns 401 when Authorization header is missing | ✅ active |
| 64 | POST /api/cron/process-schedules | returns 401 when Authorization header is wrong | ✅ active |
| 65 | POST /api/cron/process-schedules | returns 200 with 0 triggered when no active schedules | ✅ active |
| 66 | POST /api/cron/process-schedules | skips schedule when GitHub credentials are missing | ✅ active |
| 67 | POST /api/cron/process-schedules | skips schedule when no automated test cases found | ✅ active |
| 68 | POST /api/cron/process-schedules | creates test run and triggers GitHub when schedule is due | ✅ active |
| 69 | POST /api/cron/process-schedules | continues to next schedule when GitHub dispatch fails | ✅ active |

### Cron Schedules

`tests/unit/cron-schedules.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 70 | POST /api/cron/process-schedules | returns 401 when bearer token is missing | ✅ active |
| 71 | POST /api/cron/process-schedules | returns 401 when bearer token is wrong | ✅ active |
| 72 | POST /api/cron/process-schedules | processes schedules and returns count when no schedules are due | ✅ active |
| 73 | POST /api/cron/process-schedules | returns success with empty triggered list when no active schedules exist | ✅ active |
| 74 | POST /api/cron/process-schedules | skips schedule when GitHub credentials are missing | ✅ active |

### Dashboard Page

`tests/unit/dashboard-page.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 75 | GlobalDashboardPage | renders the dashboard header | ✅ active |
| 76 | GlobalDashboardPage | renders KPI cards with metrics from mocked dashboard data | ✅ active |
| 77 | GlobalDashboardPage | renders the ranked project list and quality grid visualizations | ✅ active |
| 78 | GlobalDashboardPage | renders project, schedule, activity, and risk data from mocked dashboard data | ✅ active |
| 79 | GlobalDashboardPage | renders empty dashboard states when no data exists | ✅ active |
| 80 | GlobalDashboardPage | propagates the error when data fetching fails (no fallback exists on main) | ✅ active |

### Execute Result

`tests/unit/execute-result.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 81 | POST /api/projects/[code]/runs/[runId]/results/[resultId]/execute | returns 400 when script is missing | ✅ active |
| 82 | POST /api/projects/[code]/runs/[runId]/results/[resultId]/execute | returns demo mode response and skips exec when NEXT_PUBLIC_IS_DEMO=true | ✅ active |
| 83 | POST /api/projects/[code]/runs/[runId]/results/[resultId]/execute | returns passed=true when playwright exits successfully | ✅ active |
| 84 | POST /api/projects/[code]/runs/[runId]/results/[resultId]/execute | my test | ✅ active |
| 85 | POST /api/projects/[code]/runs/[runId]/results/[resultId]/execute | returns passed=false when playwright exits with error | ✅ active |
| 86 | POST /api/projects/[code]/runs/[runId]/results/[resultId]/execute | my test | ✅ active |
| 87 | POST /api/projects/[code]/runs/[runId]/results/[resultId]/execute | wraps bare script in a test() block before writing to file | ✅ active |

### Execute Script

`tests/unit/execute-script.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 88 | POST /runs/[runId]/results/[resultId]/execute | returns 400 when script is missing | ✅ active |
| 89 | POST /runs/[runId]/results/[resultId]/execute | marks result as PASSED when playwright exits successfully | ✅ active |
| 90 | POST /runs/[runId]/results/[resultId]/execute | marks result as FAILED when playwright exits with non-zero | ✅ active |
| 91 | POST /runs/[runId]/results/[resultId]/execute | skips execution and returns disabled message in demo mode | ✅ active |
| 92 | POST /runs/[runId]/results/[resultId]/execute | wraps unwrapped script in a playwright test block before executing | ✅ active |
| 93 | POST /runs/[runId]/results/[resultId]/execute | Automated Test Case | ✅ active |

### Github Dispatch

`tests/unit/github-dispatch.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 94 | POST /api/projects/[code]/runs/[runId]/github/dispatch | returns 404 when test run not found | ✅ active |
| 95 | POST /api/projects/[code]/runs/[runId]/github/dispatch | returns 400 when GitHub credentials are missing | ✅ active |
| 96 | POST /api/projects/[code]/runs/[runId]/github/dispatch | returns 200 and dispatches to the correct GitHub URL | ✅ active |
| 97 | POST /api/projects/[code]/runs/[runId]/github/dispatch | returns 500 when GitHub fetch returns !ok | ✅ active |
| 98 | POST /api/projects/[code]/runs/[runId]/github/dispatch | updates automated result statuses to IN_PROGRESS after dispatch | ✅ active |
| 99 | POST /api/projects/[code]/runs/[runId]/github/dispatch | skips updateMany when no automated cases exist | ✅ active |

### Github Sync

`tests/unit/github-sync.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 100 | POST /api/projects/[code]/github/sync-all | returns 404 when project not found | ✅ active |
| 101 | POST /api/projects/[code]/github/sync-all | returns 400 when no automated test cases found | ✅ active |
| 102 | POST /api/projects/[code]/github/sync-all | returns 400 when GitHub credentials are not configured | ✅ active |
| 103 | POST /api/projects/[code]/github/sync-all | syncs cases and creates PR successfully | ✅ active |
| 104 | POST /api/projects/[code]/github/sync-all | updates githubPrUrl on all synced test cases after success | ✅ active |

### Jira Integration

`tests/unit/jira-integration.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 105 | GET /api/integrations/jira/issue | returns 400 when ticketId is missing | ✅ active |
| 106 | GET /api/integrations/jira/issue | returns 400 when Jira credentials are not configured | ✅ active |
| 107 | GET /api/integrations/jira/issue | returns 401 when Jira authentication fails | ✅ active |
| 108 | GET /api/integrations/jira/issue | returns 404 when ticket does not exist in Jira | ✅ active |
| 109 | GET /api/integrations/jira/issue | returns parsed requirement text from Jira issue | ✅ active |

### Milestones

`tests/unit/milestones.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 110 | GET /api/projects/[code]/milestones | returns milestones for the given project code | ✅ active |
| 111 | GET /api/projects/[code]/milestones | returns 500 when findMany throws | ✅ active |
| 112 | POST /api/projects/[code]/milestones | returns 404 when project is not found | ✅ active |
| 113 | POST /api/projects/[code]/milestones | returns 201 and creates milestone with dueDate when provided | ✅ active |
| 114 | POST /api/projects/[code]/milestones | returns 201 and creates milestone with null dueDate when not provided | ✅ active |
| 115 | POST /api/projects/[code]/milestones | returns 500 when create throws | ✅ active |

### Pipeline Detail

`tests/unit/pipeline-detail.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 116 | PATCH /api/projects/[code]/pipelines/[id] | returns 404 when project is not found | ✅ active |
| 117 | PATCH /api/projects/[code]/pipelines/[id] | returns 404 when pipeline is not found | ✅ active |
| 118 | PATCH /api/projects/[code]/pipelines/[id] | returns 200 and updates pipeline without GitHub sync when project has no credentials | ✅ active |
| 119 | PATCH /api/projects/[code]/pipelines/[id] | returns 200 and calls fetch for GitHub sync when project has credentials | ✅ active |
| 120 | DELETE /api/projects/[code]/pipelines/[id] | returns 200 and deletes pipeline without GitHub cleanup when project has no credentials | ✅ active |
| 121 | DELETE /api/projects/[code]/pipelines/[id] | returns 200 and calls fetch to delete GitHub file when project has credentials | ✅ active |

### Plan Detail

`tests/unit/plan-detail.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 122 | GET /api/projects/[code]/plans/[planId] | returns 404 when plan is not found | ✅ active |
| 123 | GET /api/projects/[code]/plans/[planId] | returns 200 with plan when found | ✅ active |
| 124 | GET /api/projects/[code]/plans/[planId] | returns 500 on unexpected error | ✅ active |
| 125 | PUT /api/projects/[code]/plans/[planId] | returns 400 when title or caseIds are missing | ✅ active |
| 126 | PUT /api/projects/[code]/plans/[planId] | returns 200 with updated plan on success | ✅ active |
| 127 | DELETE /api/projects/[code]/plans/[planId] | returns 200 with success true when plan is deleted | ✅ active |
| 128 | DELETE /api/projects/[code]/plans/[planId] | returns 500 on unexpected error | ✅ active |

### Project Audit

`tests/unit/project-audit.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 129 | GET /api/projects/[code]/audit | returns 401 when there is no session | ✅ active |
| 130 | GET /api/projects/[code]/audit | returns 404 when project is not found | ✅ active |
| 131 | GET /api/projects/[code]/audit | returns 403 when requireProjectRole returns false and user is not ADMIN | ✅ active |
| 132 | GET /api/projects/[code]/audit | returns 200 with logs array including user data when access is granted | ✅ active |
| 133 | GET /api/projects/[code]/audit | returns 500 when the database throws an error | ✅ active |

### Project Auth

`tests/unit/project-auth.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 134 | getProjectRole | returns ADMIN when user is system ADMIN regardless of membership | ✅ active |
| 135 | getProjectRole | returns null when project does not exist | ✅ active |
| 136 | getProjectRole | returns member role when user is an explicit project member | ✅ active |
| 137 | getProjectRole | defaults to VIEWER when user is not an explicit project member | ✅ active |
| 138 | requireProjectRole | returns true when user role is in allowed list | ✅ active |
| 139 | requireProjectRole | returns false when user role is not in allowed list | ✅ active |
| 140 | requireProjectRole | returns false when project does not exist | ✅ active |

### Project Crud

`tests/unit/project-crud.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 141 | GET /api/projects/[code]/members | returns 404 when project not found | ✅ active |
| 142 | GET /api/projects/[code]/members | returns list of users for the project | ✅ active |
| 143 | GET /api/projects/[code]/environments | returns 404 when project not found | ✅ active |
| 144 | GET /api/projects/[code]/environments | returns list of environments | ✅ active |
| 145 | POST /api/projects/[code]/environments | creates environment and returns 201 | ✅ active |
| 146 | POST /api/projects/[code]/environments | auto-generates slug from title when slug is omitted | ✅ active |
| 147 | GET /api/projects/[code]/plans | returns 404 when project not found | ✅ active |
| 148 | GET /api/projects/[code]/plans | returns list of plans | ✅ active |
| 149 | POST /api/projects/[code]/plans | returns 400 when title is missing | ✅ active |
| 150 | POST /api/projects/[code]/plans | creates plan with connected cases and returns 201 | ✅ active |
| 151 | GET /api/projects/[code]/suites | returns empty array when project not found | ✅ active |
| 152 | GET /api/projects/[code]/suites | returns list of suites | ✅ active |
| 153 | POST /api/projects/[code]/suites | returns 401 when not authenticated | ✅ active |
| 154 | POST /api/projects/[code]/suites | creates suite and returns 201 | ✅ active |

### Project Dashboard

`tests/unit/project-dashboard.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 155 | GET /api/projects/[code]/dashboard | returns 404 when project is not found | ✅ active |
| 156 | GET /api/projects/[code]/dashboard | returns 200 with correct metrics structure | ✅ active |
| 157 | GET /api/projects/[code]/dashboard | returns automation object with correct counts | ✅ active |
| 158 | GET /api/projects/[code]/dashboard | formats recentRuns with correct metrics | ✅ active |
| 159 | GET /api/projects/[code]/dashboard | returns empty recentRuns array when there are no runs | ✅ active |
| 160 | GET /api/projects/[code]/dashboard | returns 500 when the database throws an error | ✅ active |

### Project Integrations

`tests/unit/project-integrations.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 161 | GET /api/projects/[code]/integrations | returns 401 when not authenticated | ✅ active |
| 162 | GET /api/projects/[code]/integrations | returns 403 when user is not ADMIN | ✅ active |
| 163 | GET /api/projects/[code]/integrations | returns 404 when project not found | ✅ active |
| 164 | GET /api/projects/[code]/integrations | returns integration settings for project | ✅ active |
| 165 | PUT /api/projects/[code]/integrations | returns 401 when not authenticated | ✅ active |
| 166 | PUT /api/projects/[code]/integrations | returns 403 when user is not ADMIN | ✅ active |
| 167 | PUT /api/projects/[code]/integrations | updates integration settings and returns project | ✅ active |
| 168 | PUT /api/projects/[code]/integrations | sets fields to null when values are empty strings | ✅ active |

### Project Invitations

`tests/unit/project-invitations.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 169 | POST /api/projects/[code]/invitations | returns 401 when no session | ✅ active |
| 170 | POST /api/projects/[code]/invitations | returns 403 when requireProjectRole returns false and user is not ADMIN | ✅ active |
| 171 | POST /api/projects/[code]/invitations | returns 404 when project not found | ✅ active |
| 172 | POST /api/projects/[code]/invitations | returns 400 when email or role is missing | ✅ active |
| 173 | POST /api/projects/[code]/invitations | returns 400 when user is already a project member | ✅ active |
| 174 | POST /api/projects/[code]/invitations | returns 201 with success on valid invitation: upserts invitation and calls sendEmail | ✅ active |
| 175 | POST /api/projects/[code]/invitations | skips member check and still creates invitation when user is not found | ✅ active |

### Project Runs List

`tests/unit/project-runs-list.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 176 | POST /api/projects/[code]/runs | returns 404 when project not found | ✅ active |
| 177 | POST /api/projects/[code]/runs | returns 401 when no session | ✅ active |
| 178 | POST /api/projects/[code]/runs | returns 403 when user lacks project role | ✅ active |
| 179 | POST /api/projects/[code]/runs | returns 400 when caseIds is empty | ✅ active |
| 180 | POST /api/projects/[code]/runs | returns 201 and calls logAudit on success | ✅ active |

### Projects Route

`tests/unit/projects-route.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 181 | projects API route | rejects project creation when name or code is missing | ✅ active |
| 182 | projects API route | normalizes the project code before creating a project | ✅ active |
| 183 | projects API route | rejects duplicate project codes | ✅ active |
| 184 | projects API route | lists projects with only id, name, and code | ✅ active |

### Register Route

`tests/unit/register-route.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 185 | register API route | rejects registration when email is missing | ✅ active |
| 186 | register API route | rejects registration when password is missing | ✅ active |
| 187 | register API route | rejects duplicate email registration | ✅ active |
| 188 | register API route | creates the first registered user as an admin with a hashed password | ✅ active |
| 189 | register API route | rejects self-registration once a user already exists (invite-only) | ✅ active |
| 190 | register API route | returns a generic error when registration fails unexpectedly | ✅ active |

### Run Complete

`tests/unit/run-complete.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 191 | POST /api/runs/[runId]/complete | returns 404 when run is not found | ✅ active |
| 192 | POST /api/runs/[runId]/complete | returns 200 with success and does not call fetch when msTeamsWebhookUrl is null | ✅ active |
| 193 | POST /api/runs/[runId]/complete | calls fetch with the Teams webhook URL when msTeamsWebhookUrl is set | ✅ active |
| 194 | POST /api/runs/[runId]/complete | sets themeColor to E81123 (red) when there are failed results | ✅ active |
| 195 | POST /api/runs/[runId]/complete | sets themeColor to 00CC6A (green) when all results passed | ✅ active |
| 196 | POST /api/runs/[runId]/complete | returns 200 and swallows error when Teams webhook fetch throws | ✅ active |
| 197 | POST /api/runs/[runId]/complete | returns 500 when the database throws an error | ✅ active |

### Run Create

`tests/unit/run-create.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 198 | POST /api/projects/[code]/runs | returns 401 when not authenticated | ✅ active |
| 199 | POST /api/projects/[code]/runs | returns 403 when user lacks role | ✅ active |
| 200 | POST /api/projects/[code]/runs | returns 400 when caseIds is empty | ✅ active |
| 201 | POST /api/projects/[code]/runs | creates run with IN_PROGRESS results and returns 201 | ✅ active |
| 202 | POST /api/projects/[code]/runs | logs audit after run is created | ✅ active |
| 203 | POST /api/projects/[code]/runs | returns 404 when project not found | ✅ active |

### Run Crud

`tests/unit/run-crud.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 204 | GET /api/projects/[code]/runs/[runId] | returns run with results when found | ✅ active |
| 205 | GET /api/projects/[code]/runs/[runId] | returns 404 when run does not exist | ✅ active |
| 206 | PUT /api/projects/[code]/runs/[runId] | returns 400 when title is missing | ✅ active |
| 207 | PUT /api/projects/[code]/runs/[runId] | updates run and adds new cases | ✅ active |
| 208 | DELETE /api/projects/[code]/runs/[runId] | deletes run and returns success | ✅ active |

### Runs Bulk Update

`tests/unit/runs-bulk-update.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 209 | DELETE /api/projects/[code]/cases/bulk | returns 404 when the project is not found | ✅ active |
| 210 | DELETE /api/projects/[code]/cases/bulk | returns 401 when there is no authenticated session | ✅ active |
| 211 | DELETE /api/projects/[code]/cases/bulk | returns 403 when the user lacks the required project role | ✅ active |
| 212 | DELETE /api/projects/[code]/cases/bulk | returns 400 when caseIds is empty or missing | ✅ active |
| 213 | DELETE /api/projects/[code]/cases/bulk | returns 400 when caseIds is not an array | ✅ active |
| 214 | DELETE /api/projects/[code]/cases/bulk | deletes cases and returns success with count for an authorized user | ✅ active |
| 215 | DELETE /api/projects/[code]/cases/bulk | allows a global ADMIN to delete even without explicit project role | ✅ active |
| 216 | DELETE /api/projects/[code]/cases/bulk | returns 400 when deleteMany throws an unexpected error | ✅ active |

### Shared Steps

`tests/unit/shared-steps.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 217 | GET /api/projects/[code]/shared-steps | returns shared steps for the given project code | ✅ active |
| 218 | GET /api/projects/[code]/shared-steps | returns 500 when findMany throws | ✅ active |
| 219 | POST /api/projects/[code]/shared-steps | returns 404 when project is not found | ✅ active |
| 220 | POST /api/projects/[code]/shared-steps | creates and returns a shared step with status 201 | ✅ active |
| 221 | POST /api/projects/[code]/shared-steps | returns 500 when create throws | ✅ active |

### Suite Clone

`tests/unit/suite-clone.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 222 | POST /api/projects/[code]/suites/[suiteId]/clone | returns 404 when project is not found | ✅ active |
| 223 | POST /api/projects/[code]/suites/[suiteId]/clone | returns 401 when there is no session | ✅ active |
| 224 | POST /api/projects/[code]/suites/[suiteId]/clone | returns 403 when requireProjectRole returns false and user is not ADMIN | ✅ active |
| 225 | POST /api/projects/[code]/suites/[suiteId]/clone | returns 201 and clones suite with test cases when strategy is cases_and_suites | ✅ active |
| 226 | POST /api/projects/[code]/suites/[suiteId]/clone | does NOT clone test cases when strategy is not cases_and_suites | ✅ active |
| 227 | POST /api/projects/[code]/suites/[suiteId]/clone | returns 400 when suite is not found (testSuite.findUnique returns null) | ✅ active |

### Suite Crud

`tests/unit/suite-crud.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 228 | PATCH /api/projects/[code]/suites/[suiteId] | returns 401 when user is not authenticated | ✅ active |
| 229 | PATCH /api/projects/[code]/suites/[suiteId] | returns 403 when user lacks EDITOR or ADMIN role | ✅ active |
| 230 | PATCH /api/projects/[code]/suites/[suiteId] | updates suite title and returns updated suite | ✅ active |
| 231 | DELETE /api/projects/[code]/suites/[suiteId] | returns 403 when user lacks role | ✅ active |
| 232 | DELETE /api/projects/[code]/suites/[suiteId] | deletes suite and its cases when retainCases is false | ✅ active |
| 233 | DELETE /api/projects/[code]/suites/[suiteId] | moves cases to parent suite when retainCases is true | ✅ active |

### Suite Detail

`tests/unit/suite-detail.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 234 | PATCH /api/projects/[code]/suites/[suiteId] | returns 404 when project is not found | ✅ active |
| 235 | PATCH /api/projects/[code]/suites/[suiteId] | returns 401 when session is missing | ✅ active |
| 236 | PATCH /api/projects/[code]/suites/[suiteId] | returns 200 and updated suite | ✅ active |
| 237 | DELETE /api/projects/[code]/suites/[suiteId] | returns 401 when session is missing | ✅ active |
| 238 | DELETE /api/projects/[code]/suites/[suiteId] | returns 200 and moves cases to null when retainCases=true | ✅ active |
| 239 | DELETE /api/projects/[code]/suites/[suiteId] | returns 200 and deletes cases when retainCases=false | ✅ active |
| 240 | DELETE /api/projects/[code]/suites/[suiteId] | returns 403 when requireProjectRole returns false and user is not ADMIN | ✅ active |

### Suites Route

`tests/unit/suites-route.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 241 | project suites API route | rejects suite creation when the user is not authenticated | ✅ active |
| 242 | project suites API route | creates a suite under an existing project when the user has access | ✅ active |
| 243 | project suites API route | auto-creates the project before creating a suite when the project does not exist | ✅ active |
| 244 | project suites API route | lists suites for an existing project ordered by position | ✅ active |
| 245 | project suites API route | returns an empty list when listing suites for an unknown project | ✅ active |

### Tags Route

`tests/unit/tags-route.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 246 | POST /api/projects/[code]/tags | returns 400 when name is missing | ✅ active |
| 247 | POST /api/projects/[code]/tags | returns 201 and the created tag on success | ✅ active |
| 248 | POST /api/projects/[code]/tags | returns 409 when prisma throws a P2002 unique constraint error | ✅ active |
| 249 | POST /api/projects/[code]/tags | returns 400 when prisma throws a non-P2002 error | ✅ active |
| 250 | GET /api/projects/[code]/tags | returns the array of tags for the project | ✅ active |

### Workspace Invites

`tests/unit/workspace-invites.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 251 | GET /api/workspace/invites | returns list of pending invites with role names | ✅ active |
| 252 | POST /api/workspace/invites | returns 400 when required fields are missing | ✅ active |
| 253 | POST /api/workspace/invites | returns 400 when user already exists | ✅ active |
| 254 | POST /api/workspace/invites | creates invitation and sends email successfully | ✅ active |
| 255 | POST /api/workspace/invites | deletes invitation and returns 500 when email fails to send | ✅ active |

### Workspace Roles Route

`tests/unit/workspace-roles-route.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 256 | GET /api/workspace/roles | returns roles without creating when system roles already exist | ✅ active |
| 257 | GET /api/workspace/roles | seeds system roles when none exist, then returns them | ✅ active |
| 258 | GET /api/workspace/roles | returns 500 when DB throws | ✅ active |
| 259 | POST /api/workspace/roles | returns 401 when unauthenticated | ✅ active |
| 260 | POST /api/workspace/roles | returns 403 when actor lacks role-management permission | ✅ active |
| 261 | POST /api/workspace/roles | returns 400 when title is missing | ✅ active |
| 262 | POST /api/workspace/roles | creates role and returns 201 | ✅ active |
| 263 | POST /api/workspace/roles | clears old default before setting new one when isDefault=true | ✅ active |
| 264 | POST /api/workspace/roles | returns 500 when DB throws during create | ✅ active |

### Workspace Roles

`tests/unit/workspace-roles.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 265 | GET /api/workspace/roles/[id] | returns role when found | ✅ active |
| 266 | GET /api/workspace/roles/[id] | returns 404 when role not found | ✅ active |
| 267 | PUT /api/workspace/roles/[id] | returns 404 when role not found | ✅ active |
| 268 | PUT /api/workspace/roles/[id] | updates role and returns updated data | ✅ active |
| 269 | PUT /api/workspace/roles/[id] | clears other default roles when setting isDefault true | ✅ active |
| 270 | DELETE /api/workspace/roles/[id] | returns 404 when role not found | ✅ active |
| 271 | DELETE /api/workspace/roles/[id] | returns 400 when trying to delete a system role | ✅ active |
| 272 | DELETE /api/workspace/roles/[id] | returns 400 when trying to delete the default role | ✅ active |
| 273 | DELETE /api/workspace/roles/[id] | deletes role and returns success | ✅ active |

### Workspace Settings

`tests/unit/workspace-settings.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 274 | GET /api/workspace/settings | returns settings as key-value object | ✅ active |
| 275 | GET /api/workspace/settings | masks OPENAI_API_KEY keeping only last 4 chars | ✅ active |
| 276 | GET /api/workspace/settings | masks GEMINI_API_KEY, CLAUDE_API_KEY, and JIRA_API_TOKEN | ✅ active |
| 277 | GET /api/workspace/settings | returns 500 when DB throws | ✅ active |
| 278 | POST /api/workspace/settings | upserts each non-masked non-empty key-value pair | ✅ active |
| 279 | POST /api/workspace/settings | skips keys that start with masked bullet characters | ✅ active |
| 280 | POST /api/workspace/settings | skips empty string values | ✅ active |
| 281 | POST /api/workspace/settings | returns 200 with no DB writes when all values are empty | ✅ active |
| 282 | POST /api/workspace/settings | returns 500 when DB throws | ✅ active |

### Workspace User

`tests/unit/workspace-user.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 283 | PATCH /api/workspace/users/[id] | returns 401 when user is not authenticated | ✅ active |
| 284 | PATCH /api/workspace/users/[id] | returns 403 when caller is not ADMIN | ✅ active |
| 285 | PATCH /api/workspace/users/[id] | deactivates target user successfully | ✅ active |
| 286 | PATCH /api/workspace/users/[id] | returns 400 when admin tries to deactivate own account | ✅ active |
| 287 | PATCH /api/workspace/users/[id] | generates a password reset token and returns a reset link | ✅ active |

---

## Integration

### Project Api

`tests/integration/project-api.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 288 | project API integration smoke | creates a project through the real projects route | ✅ active |
| 289 | project API integration smoke | creates and lists a suite through the real suites route | ✅ active |
| 290 | project API integration smoke | creates and lists a test case with a step and tag through the real cases route | ✅ active |

### Test Case Code

`tests/integration/test-case-code.test.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 291 | test case code — integration tests | first test case receives sequenceNumber 1 (code {PROJECT_CODE}-001) | ✅ active |
| 292 | test case code — integration tests | second test case receives sequenceNumber 2 (code {PROJECT_CODE}-002) | ✅ active |
| 293 | test case code — integration tests | GET /cases returns sequenceNumber for every case | ✅ active |
| 294 | test case code — integration tests | sequences are project-scoped — a second project also starts from 1 | ✅ active |
| 295 | test case code — integration tests | sequenceNumber persists after re-fetching the case list | ✅ active |

---

## System (E2E legacy)

### Smoke

`tests/system/smoke.spec.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 296 | TMS smoke tests | TMS smoke tests | ✅ active |
| 297 | TMS smoke tests | redirects unauthenticated users from dashboard to login | ✅ active |
| 298 | TMS smoke tests | signs up a new user and opens the global dashboard | ✅ active |
| 299 | TMS smoke tests | signs in and opens the projects page | ✅ active |
| 300 | TMS smoke tests | creates a project from the projects UI and reads it in the list | ✅ active |
| 301 | TMS smoke tests | creates a suite and test case through APIs, then reads them in repository UI | ✅ active |

### Test Case Code

`tests/system/test-case-code.spec.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 302 | test case code badge | test case code badge | ✅ active |
| 303 | test case code badge | code badge is visible in repository view after creating a case | ✅ active |
| 304 | test case code badge | code badge matches format PROJECT_CODE-NNN | ✅ active |
| 305 | test case code badge | second case receives incremented code badge -002 | ✅ active |
| 306 | test case code badge | code is shown in test run execution view | ✅ active |
| 307 | test case code badge | code badge persists after page refresh | ✅ active |

---

## UI E2E (Playwright)

### Auth

`e2e/auth.spec.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 308 | Authentication | Authentication | ✅ active |
| 309 | Authentication | QMS-01 login with valid credentials | ✅ active |
| 310 | Authentication | QMS-02 login with wrong password shows error | ✅ active |
| 311 | Authentication | QMS-08 logout returns to login | ✅ active |

### Cases

`e2e/cases.spec.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 312 | Test Cases | Test Cases | ✅ active |
| 313 | Test Cases | QMS-05 create a new test case | ✅ active |
| 314 | Test Cases | QMS-06 edit an existing test case | ⏭️ skip |

### Projects

`e2e/projects.spec.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 315 | Projects | Projects | ✅ active |
| 316 | Projects | QMS-03 create a new project | ✅ active |
| 317 | Projects | QMS-04 open a project and see its test cases | ✅ active |

### Runs

`e2e/runs.spec.ts`

| # | Scenario | Test case | Status |
|---|---|---|---|
| 318 | Test Runs | Test Runs | ✅ active |
| 319 | Test Runs | QMS-07 create a test run and select cases | ✅ active |

---

## หมายเหตุ

- **✅ active** = รันจริงทุกครั้ง
- **⏭️ skip** = ถูก mark `skip`/`fixme`
- Unit tests ใช้ mock (ไม่แตะ DB จริง) — รันเร็ว แยก logic
- UI E2E ใช้ Playwright คลิกหน้าจอจริง + ส่งผลกลับ QMaster ผ่าน reporter
