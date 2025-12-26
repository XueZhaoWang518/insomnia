import { expect } from '@playwright/test';
import { test } from '../../playwright/test';
import { REQUEST_CONFIG, getRequestPane } from '../../helpers/request-helpers';
import {
  assertMainWorkflowBody,
  assertMainWorkflowHeaders,
  assertMainWorkflowMethod,
  assertMainWorkflowParams,
  assertMainWorkflowUrl,
  assertResponseOk,
  assertBadRequestError,
  assertMainWorkflowResponse,
  assertServerUnavailableError,
} from '../../helpers/main-workflow-assertions';
import {
  createHttpRequest,
  createRequestCollection,
  importConfigurationFromFile,
  importCollectionFromFile,
  selectActiveRequest,
  selectImportedRequest,
  scanCollectionFromFile,
  sendRequestAndAssertSuccess,
  setEnvironmentVariables,
  slowOnDarwinAndWindows,
  setJsonBody,
  setPostMethod,
  setQueryParams,
  setRequestUrl,
  setRequestBody,
  setRequestHeaders,
  sendRequest,
} from '../../helpers/main-workflow-helpers';

test.describe('main workflow', () => {
  test('create -> configure -> send -> validate response', async ({ page }) => {
    slowOnDarwinAndWindows(test);
    const baseUrl = test.info().config.webServer?.url ?? 'http://127.0.0.1:4010';

    await test.step('Create a request collection', async () => {
      await createRequestCollection(page);
      await expect(page.getByRole('grid', { name: 'Request Collection' })).toBeVisible();
    });

    await test.step('Create a new HTTP request', async () => {
      await createHttpRequest(page);
      await selectActiveRequest(page);
      await expect(getRequestPane(page).getByRole('button', { name: 'Send' })).toBeVisible();
    });

    await test.step('Configure request method, params, headers, body', async () => {
      await setPostMethod(page);
      await assertMainWorkflowMethod(page);

      await setQueryParams(page);
      await assertMainWorkflowParams(page);

      await setRequestHeaders(page);
      await assertMainWorkflowHeaders(page);

      await setRequestBody(page);
      await assertMainWorkflowBody(page);
    });

    await test.step('Set request URL', async () => {
      const requestUrl = `${baseUrl}/echo`;
      await setRequestUrl(page, requestUrl);
      await assertMainWorkflowUrl(page, requestUrl);
    });

    await test.step('Send request and validate response', async () => {
      await sendRequestAndAssertSuccess(page, async curentPage =>{
        await sendRequest(curentPage);
        await assertMainWorkflowResponse(curentPage);
      });
    });
  });

  test('resolves environment variables in request URL', async ({ page }) => {
    slowOnDarwinAndWindows(test);
    const baseUrl = test.info().config.webServer?.url ?? 'http://127.0.0.1:4010';

    await test.step('Create a request collection', async () => {
      await createRequestCollection(page);
      await expect(page.getByRole('grid', { name: 'Request Collection' })).toBeVisible();
    });

    await test.step('Create a new HTTP request', async () => {
      await createHttpRequest(page);
      await selectActiveRequest(page);
      await expect(getRequestPane(page).getByRole('button', { name: 'Send' })).toBeVisible();
    });

    await test.step('Set environment variable for base URL', async () => {
      await setEnvironmentVariables(page, [{ key: REQUEST_CONFIG.env.baseUrlKey, value: baseUrl }]);
    });

    await test.step('Set request URL with template', async () => {
      const requestUrl = `{{ ${REQUEST_CONFIG.env.baseUrlKey} }}/echo`;
      await setRequestUrl(page, requestUrl);
      await assertMainWorkflowUrl(page, requestUrl);
    });

    await test.step('Send request and validate response', async () => {
      await sendRequestAndAssertSuccess(page, async currentPage => {
        await sendRequest(currentPage);
        await assertResponseOk(currentPage);
        await expect(currentPage.getByTestId('response-pane')).toContainText('"method": "GET"');
      });
    });
  });

  test('shows bad request error when required body field is missing', async ({ page }) => {
    slowOnDarwinAndWindows(test);
    const baseUrl = test.info().config.webServer?.url ?? 'http://127.0.0.1:4010';

    await test.step('Create a request collection', async () => {
      await createRequestCollection(page);
      await expect(page.getByRole('grid', { name: 'Request Collection' })).toBeVisible();
    });

    await test.step('Create a new HTTP request', async () => {
      await createHttpRequest(page);
      await selectActiveRequest(page);
      await expect(getRequestPane(page).getByRole('button', { name: 'Send' })).toBeVisible();
    });

    await test.step('Configure request method, headers, and invalid body', async () => {
      await setPostMethod(page);
      await assertMainWorkflowMethod(page);

      await setRequestHeaders(page);
      await assertMainWorkflowHeaders(page);

      await setJsonBody(page, `{"token": "${REQUEST_CONFIG.body.token}"}`);
    });

    await test.step('Set request URL', async () => {
      const requestUrl = `${baseUrl}/validate-request`;
      await setRequestUrl(page, requestUrl);
      await assertMainWorkflowUrl(page, requestUrl);
    });

    await test.step('Send request and validate error response', async () => {
      await sendRequestAndAssertSuccess(page, async currentPage => {
        await sendRequest(currentPage);
        await assertBadRequestError(currentPage, 'Missing field: name');
      });
    });

    await test.step('Fix body and validate success response', async () => {
      await setJsonBody(page, `{"name": "wxz-main", "token": "${REQUEST_CONFIG.body.token}"}`);
      await sendRequestAndAssertSuccess(page, async currentPage => {
        await sendRequest(currentPage);
        await assertResponseOk(currentPage);
      });
    });
  });

  test('basic auth via imported fixture request', async ({ page }) => {
    slowOnDarwinAndWindows(test);

    await test.step('Create a request collection', async () => {
      await createRequestCollection(page);
      await expect(page.getByRole('grid', { name: 'Request Collection' })).toBeVisible();
    });

    await test.step('Import fixture collection and select request', async () => {
      await importConfigurationFromFile(page, 'smoke-test-collection.yaml');
      await page.getByLabel('Request Collection').getByTestId('sends request with basic authentication').press('Enter');
      await expect(getRequestPane(page).getByRole('button', { name: 'Send' })).toBeVisible();
    });

    await test.step('Send request and validate response', async () => {
      await sendRequestAndAssertSuccess(page, async currentPage => {
        await assertResponseOk(currentPage);
        await expect(currentPage.getByTestId('response-pane')).toContainText('basic auth received');
      });
    });
  });

  test('shows error when server is unavailable', async ({ page }) => {
    slowOnDarwinAndWindows(test);
    const unavailableUrl = 'http://127.0.0.1:59999/unavailable';

    await test.step('Create a request collection', async () => {
      await createRequestCollection(page);
      await expect(page.getByRole('grid', { name: 'Request Collection' })).toBeVisible();
    });

    await test.step('Create a new HTTP request', async () => {
      await createHttpRequest(page);
      await selectActiveRequest(page);
      await expect(getRequestPane(page).getByRole('button', { name: 'Send' })).toBeVisible();
    });

    await test.step('Set request URL', async () => {
      await setRequestUrl(page, unavailableUrl);
      await assertMainWorkflowUrl(page, unavailableUrl);
    });

    await test.step('Send request and validate error response', async () => {
      await sendRequestAndAssertSuccess(page, assertServerUnavailableError);
    });
  });

  test('import -> select -> send -> validate response', async ({ app, page }) => {
    slowOnDarwinAndWindows(test);
    const responsePane = page.getByTestId('response-pane');

    await test.step('Import request collection from file', async () => {
      await importCollectionFromFile(page, 'smoke-test-collection.yaml');
    });

    await test.step('Select imported request', async () => {
      await selectImportedRequest(page, 'Smoke tests', 'send JSON request');
    });

    await test.step('Send request and validate response', async () => {
      await sendRequestAndAssertSuccess(page, async currentPage => {
        await assertResponseOk(currentPage);
        await expect(responsePane).toContainText('"id": "1"');
      });
    });
  });

  test('import shows parse error for invalid file', async ({ page }) => {
    await test.step('Scan invalid import file', async () => {
      await scanCollectionFromFile(page, 'invalid-import.yaml');
    });

    await test.step('Verify parse error is shown', async () => {
      const dialog = page.getByRole('dialog');
      await expect(dialog).toContainText('Parse file invalid-import.yaml failed');
      await expect(dialog.getByRole('listitem').first()).toBeVisible();
    });
  });
 });
