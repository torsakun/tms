# QMaster REST API v1

A token-authenticated HTTP API for CI jobs and scripts, deliberately shaped like
Qase's so existing integrations port over with little more than a base-URL and
header change.

Base URL: `https://tms.socket9.com/api/v1`

## Authentication

Create a token at your avatar menu → **API tokens**. It is shown once;
store it in your CI secrets.

A token **acts as the user who created it** and inherits that user's project
roles exactly — there is no separate permission model to configure. Revoking a
token takes effect immediately.

Send it as either header:

```bash
curl https://tms.socket9.com/api/v1/projects -H "Token: qm_xxx"
curl https://tms.socket9.com/api/v1/projects -H "Authorization: Bearer qm_xxx"
```

## Response envelope

Every response carries a `status` boolean, so clients branch on one field:

```jsonc
// success
{ "status": true, "result": { ... } }

// failure
{ "status": false, "error": "Run not found." }
```

Lists are paginated with `?limit=` (max 100) and `?offset=`:

```jsonc
{ "status": true, "result": {
    "total": 220, "count": 100, "limit": 100, "offset": 0, "entities": [ ... ] } }
```

| Code | Meaning |
| --- | --- |
| 401 | Token missing, invalid, revoked or expired |
| 403 | The token's user lacks the role for this action in this project |
| 404 | Not found, or not visible to this token |
| 409 | Conflict — e.g. submitting a result to a run that is not ACTIVE |
| 413 | Upload exceeds 50 MB |
| 422 | Validation failed |

## Endpoints

`{code}` is the project code, e.g. `PRO`. Anywhere a case is referenced you may
pass its uuid **or** its sequence number — the `42` in `PRO-42`.

### Projects
| Method | Path |
| --- | --- |
| GET | `/projects` — add `?archived=true` to include archived |
| GET | `/projects/{code}` |

### Suites
| Method | Path |
| --- | --- |
| GET / POST | `/suite/{code}` |
| GET / PATCH / DELETE | `/suite/{code}/{id}` |

`DELETE ?retain_cases=true` moves the suite's cases to its parent instead of
deleting them.

### Cases
| Method | Path |
| --- | --- |
| GET / POST | `/case/{code}` — filters: `suite_id`, `priority`, `severity`, `automation`, `search` |
| GET / PATCH / DELETE | `/case/{code}/{id}` |

Sending `steps` on PATCH replaces the whole list.

### Runs
| Method | Path |
| --- | --- |
| GET / POST | `/run/{code}` — filter: `status` |
| GET / PATCH / DELETE | `/run/{code}/{id}` |
| POST | `/run/{code}/{id}/complete` |

Omit `cases` when creating a run to include every case in the project.

### Results
| Method | Path |
| --- | --- |
| GET / POST | `/result/{code}/{runId}` — filter: `status` |
| POST | `/result/{code}/{runId}/bulk` |

Statuses: `PASSED` `FAILED` `BLOCKED` `SKIPPED` `INVALID` `IN_PROGRESS`.

A run is created with a result row per case, so submitting **updates** that row.
Re-reporting a case overwrites it, which is what a CI retry should do. A case
that is not in the run is rejected rather than added, so a typo'd id surfaces
instead of quietly skewing the run's totals.

### Milestones / Plans / Environments / Defects
| Method | Path |
| --- | --- |
| GET / POST | `/milestone/{code}`, `/plan/{code}`, `/environment/{code}` |
| GET / PATCH / DELETE | `/milestone/{code}/{id}`, `/plan/{code}/{id}` |
| GET | `/defect/{code}` — filters: `case_id`, `result_id`, `provider` |

Defects are read-only here: they live in Jira/GitHub, so they are created
through that integration rather than this API, which would otherwise drift.

### Attachments
| Method | Path |
| --- | --- |
| POST | `/attachment/{code}` — `multipart/form-data`, one or more `file` parts |

Returns urls to place in a result's `steps[].attachments`, which is how a job
pins a screenshot to the exact step that failed.

## A full CI run

```bash
API=https://tms.socket9.com/api/v1
AUTH="Token: $QMASTER_TOKEN"

# 1. start a run over three cases
RUN=$(curl -s -X POST -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"title":"Nightly #142","cases":[1,2,3]}' "$API/run/PRO" \
  | jq -r .result.id)

# 2. attach a screenshot for the step that failed
URL=$(curl -s -X POST -H "$AUTH" -F "file=@fail.png" "$API/attachment/PRO" \
  | jq -r '.result[0].url')

# 3. report every case in one call
curl -s -X POST -H "$AUTH" -H 'Content-Type: application/json' -d "{
  \"results\": [
    {\"case_id\": 1, \"status\": \"passed\", \"time_spent_ms\": 4200},
    {\"case_id\": 2, \"status\": \"failed\", \"error_message\": \"TimeoutError\",
     \"steps\": [{\"status\": \"failed\", \"actual_result\": \"button never appeared\",
                 \"attachments\": [{\"name\": \"fail.png\", \"url\": \"$URL\"}]}]},
    {\"case_id\": 3, \"status\": \"blocked\"}
  ]}" "$API/result/PRO/$RUN"

# 4. close it
curl -s -X POST -H "$AUTH" "$API/run/PRO/$RUN/complete"
```

Bulk submission succeeds partially on purpose — one bad case id returns a
per-item error rather than discarding results the job spent minutes producing:

```jsonc
{ "status": true, "result": {
    "submitted": 3, "applied": 2, "failed": 1,
    "errors": [{ "index": 2, "case_id": 9999, "error": "Case '9999' not found in this project." }] } }
```

## Migrating from Qase

| Qase | QMaster |
| --- | --- |
| `https://api.qase.io/v1` | `https://tms.socket9.com/api/v1` |
| `Token: <qase token>` | `Token: qm_...` |
| Numeric status (`1`, `2`, `3`) | Names (`passed`, `failed`, `blocked`) |
| `/result/{code}/{run}` bulk body `{results:[…]}` | same, at `/result/{code}/{run}/bulk` |

Envelope, `limit`/`offset` paging and the `{code}` path style are unchanged.
