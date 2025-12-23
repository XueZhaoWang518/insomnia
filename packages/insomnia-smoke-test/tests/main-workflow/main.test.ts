import { expect } from '@playwright/test';
import { test } from '../../playwright/test';
import { REQUEST_CONFIG, getRequestPane, getVisibleCodeEditorTextbox } from '../../helpers/request-helpers';
import {
  assertMainWorkflowBody,
  assertMainWorkflowHeaders,
  assertMainWorkflowMethod,
  assertMainWorkflowParams,
  assertMainWorkflowResponse,
  assertMainWorkflowUrl,
  assertBadRequestError,
  assertServerUnavailableError,
} from '../../helpers/main-workflow-assertions';
import {
  createHttpRequest,
  createRequestCollection,
  selectActiveRequest,
  sendRequest,
  setJsonBody,
  setPostMethod,
  setQueryParams,
  setRequestBody,
  setRequestHeaders,
  setRequestUrl,
} from '../../helpers/main-workflow-helpers';

test.describe('main workflow', () => {
  test('create -> configure -> send -> validate response', async ({ page }) => {
    test.slow(process.platform === 'darwin' || process.platform === 'win32', 'Slow app start on these platforms');
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
      await sendRequest(page);
      await assertMainWorkflowResponse(page);
    });
  });

  test('shows bad request error when required body field is missing', async ({ page }) => {
    test.slow(process.platform === 'darwin' || process.platform === 'win32', 'Slow app start on these platforms');
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

      await setJsonBody(page, `{
  "token": "${REQUEST_CONFIG.body.token}"
}`);
    });

    await test.step('Set request URL', async () => {
      const requestUrl = `${baseUrl}/validate-request`;
      await setRequestUrl(page, requestUrl);
      await assertMainWorkflowUrl(page, requestUrl);
    });

    await test.step('Send request and validate error response', async () => {
      await sendRequest(page);
      await assertBadRequestError(page, 'Missing field: name');
    });
  });

  test('shows error when server is unavailable', async ({ page }) => {
    test.slow(process.platform === 'darwin' || process.platform === 'win32', 'Slow app start on these platforms');
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
      await sendRequest(page);
      await assertServerUnavailableError(page);
    });
  });
});
