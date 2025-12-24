# Main Workflow Smoke Test

This document describes the custom "Main workflow" Playwright test that lives under `packages/insomnia-smoke-test/tests/main-workflow`.

## What It Covers

The test exercises a realistic end-to-end flow in Insomnia:

- Create a new request collection.
- Create a new HTTP request and make it active.
- Configure request method, params, headers, and JSON body.
- Set the request URL and send the request.
- Validate status and response content.

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
npm run test:dev -w insomnia-smoke-test -- tests/main-workflow/main.test.ts
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

## Troubleshooting

- If the app opens to a black screen, ensure `npm run watch:app` is running and that `entry.renderer.min.js` exists.
- If the test times out waiting for UI elements, inspect the trace under `packages/insomnia-smoke-test/traces/` with:

```sh
npx playwright show-trace packages/insomnia-smoke-test/traces/<trace-folder>/trace.zip
```
