# Playwright to TMS Integration

This example reports Playwright results to the TMS API.

## Test naming

Put a stable case key in the test title:

```ts
test("[LOGIN-001] homepage loads successfully", async ({ page }) => {
  // ...
});
```

The TMS API will:

- find or create the project from `TMS_PROJECT_CODE`
- find or create a test case from the case key/title
- find or create a test run from `TMS_RUN_ID` or `TMS_RUN_TITLE`
- save pass/fail/skipped status, duration, logs, error message, file, and line

## Run

From this folder:

```bash
TMS_API_URL=http://localhost:3000 \
TMS_PROJECT_CODE=ECO \
TMS_RUN_TITLE="Local Playwright Run" \
npx playwright test
```

If `PLAYWRIGHT_WEBHOOK_SECRET` is set in the TMS app, pass the same value as:

```bash
TMS_API_TOKEN=your-secret npx playwright test
```
