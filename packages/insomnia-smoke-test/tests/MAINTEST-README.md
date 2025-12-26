# Main Workflow Smoke Test

This document describes the custom "Main workflow" Playwright test that lives under `packages/insomnia-smoke-test/tests/main-workflow`.

## What It Covers

The test exercises a realistic end-to-end flow in Insomnia:

- Create a request collection and a new HTTP request.
- Configure request method, query params, headers, and JSON body.
- Set the request URL, send, and validate a successful response.
- Validate a 400 error when required body fields are missing.
- Recover from a 400 error by fixing the body and validating success.
- Validate a connection error when the server is unavailable.
- Send a basic-auth request from an imported fixture collection.
- Import a collection, select a request, and validate its response.
- Show a parse error when importing an invalid file.

File:

- `packages/insomnia-smoke-test/tests/main-workflow/main.test.ts`

## Prerequisites

The renderer bundle must be available. Use one of the following:

- Dev watch (recommended):
  ```sh
  npm run watch:app
  ```

- Build bundle:
  ```sh
  npm run app-build
  ```

Make sure dependencies are installed first:

```sh
npm i
```

If you only want to install smoke-test deps:

```sh
npm i -w insomnia-smoke-test
```

## How To Run

Run only this project (recommended):

```sh
npx playwright test -c packages/insomnia-smoke-test/playwright.config.ts --project "Main"
```

Or run via the dev test script with a filter:

```sh
npm run test:dev -w packages/insomnia-smoke-test -- tests/main-workflow/main.test.ts
```

## Notes

- The test uses the standard smoke-test web server from `packages/insomnia-smoke-test/server`.
- It avoids relying on `data-testid="project"` because the entry page can vary.
- The URL field is a CodeMirror editor; the test uses keyboard input to avoid click interception issues.
- The `test:dev` script relies on `xvfb-maybe` (installed via npm).

## View Report

After running Playwright, view the HTML report with:

```sh
npx playwright show-report packages/insomnia-smoke-test/playwright-report
```

## Windows Notes

On Windows, prefer running Playwright directly to avoid Linux-only helpers:

```sh
npx playwright test -c packages/insomnia-smoke-test/playwright.config.ts --project "Main"
```

## Design Considerations

This workflow focuses on realistic user paths (create/configure/send, import from file, invalid import feedback, and common error states) while keeping selectors stable across UI changes. It favors UI-driven flows over API shortcuts to validate end-to-end behavior, but limits scope to a few representative requests to keep runtime reasonable.

## Assumptions

- The smoke-test server is available at the configured webServer URL and provides `/echo` and `/validate-request`.
- The import modal supports file-based imports via the `import-file-input` control.
- Environment editing is available in table mode via "Manage Environments".

## Trade-offs

- UI-driven steps are slower and more fragile than direct data seeding, but they better reflect user behavior.
- Error assertions allow minor platform wording differences, trading strictness for cross-platform stability.
- Import failure validation checks for the presence of error messaging, not the full error payload, to reduce flakiness.

## Troubleshooting

- If the app opens to a black screen, ensure `npm run watch:app` is running and that `entry.renderer.min.js` exists.
- If the test times out waiting for UI elements, inspect the trace under `packages/insomnia-smoke-test/traces/` with:

```sh
npx playwright show-trace packages/insomnia-smoke-test/traces/<trace-folder>/trace.zip
```
