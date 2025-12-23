import { expect } from '@playwright/test';
import { loadFixture } from '../../playwright/paths';
import { test } from '../../playwright/test';
import {
  REQUEST_CONFIG,
  getRequestPane,
  getResponsePane,
  getUrlEditor,
  getVisibleCodeEditorTextbox,
} from '../../helpers/request-helpers';

async function createRequestCollection(page: Page) {
  const welcomeCreate = page.getByRole('button', { name: /create request collection/i }).first();
  try {
    await welcomeCreate.waitFor({ timeout: 10_000 });
    await welcomeCreate.click();
    return;
  } catch {}

  const sidebarCreate = page.getByRole('button', { name: /new request collection/i }).first();
  try {
    await sidebarCreate.waitFor({ timeout: 5_000 });
    await sidebarCreate.click();
    return;
  } catch {}

  await page.getByTestId('project').click();
  await page.getByLabel('Create in project').click();
  await page.getByText('Request collection').click();
  await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click();
}

async function createHttpRequest(page: Page) {
  await page.getByLabel('Create in collection').click();
  await page.getByRole('menuitemradio', { name: /http request/i }).click();
}

async function selectActiveRequest(page: Page) {
  const newRequest = page.getByTestId('New Request');
  if (await newRequest.count()) {
    await newRequest.click();
    return;
  }

  const fallbackRequest = page.getByRole('grid', { name: 'Request Collection' }).getByRole('row').first();
  await fallbackRequest.click();
}

async function setRequestUrl(page: Page, url: string) {
  const urlEditor = getUrlEditor(page);
  await urlEditor.click({ force: true });
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type(url);
  await page.keyboard.press('Enter');
}

async function setPostMethod(page: Page) {
  await page.getByLabel('Request Method').click();
  const postMenuItem = page.getByRole('menuitem', { name: 'POST' });
  if (await postMenuItem.count()) {
    await postMenuItem.click();
    return;
  }

  await page.getByRole('button', { name: 'POST' }).click();
}

async function setQueryParams(page: Page) {
  await page.getByRole('tab', { name: 'Params' }).click();
  const paramsList = getRequestPane(page).getByRole('listbox', { name: 'Key-value pairs' });
  const nameBox = paramsList.getByRole('textbox').nth(0);
  const valueBox = paramsList.getByRole('textbox').nth(1);
  await nameBox.fill(REQUEST_CONFIG.query.key);
  await valueBox.fill(REQUEST_CONFIG.query.value);
}

async function setRequestHeaders(page: Page) {
  await page.getByRole('tab', { name: 'Headers' }).click();
  const bulkEditButton = page.getByRole('button', { name: 'Bulk Edit' });
  if (await bulkEditButton.count()) {
    await bulkEditButton.click();
  }
  const headersEditor = getVisibleCodeEditorTextbox(page);
  await headersEditor.fill(`Content-Type: ${REQUEST_CONFIG.headers.contentType}
X-Request-Id: ${REQUEST_CONFIG.headers.requestId}`);
}

async function setRequestBody(page: Page) {
  await page.getByRole('tab', { name: 'Body' }).click();
  await page.getByRole('button', { name: 'Body' }).click();
  await page.getByRole('option', { name: 'JSON' }).click();
  const bodyEditor = getVisibleCodeEditorTextbox(page);
  await bodyEditor.fill(`{
  "userId": "${REQUEST_CONFIG.body.userId}",
  "token": "${REQUEST_CONFIG.body.token}",
  "note": "${REQUEST_CONFIG.body.note}"
}`);
}

test.describe('main workflow', () => {
  test('create -> configure -> send -> validate response', async ({ page }) => {
    test.slow(process.platform === 'darwin' || process.platform === 'win32', 'Slow app start on these platforms');
    const baseUrl = test.info().config.webServer?.url ?? 'http://127.0.0.1:4010';

    await test.step('Create a request collection', async () => {
      await createRequestCollection(page);
    });

    await test.step('Create a new HTTP request', async () => {
      await createHttpRequest(page);
      await selectActiveRequest(page);
    });

    await test.step('Configure request method, params, headers, body', async () => {
      await setPostMethod(page);
      await setQueryParams(page);
      await setRequestHeaders(page);
      await setRequestBody(page);
    });

    await test.step('Set request URL', async () => {
      const requestUrl = `${baseUrl}/echo`;
      await setRequestUrl(page, requestUrl);
      await expect(getRequestPane(page).getByTestId('OneLineEditor')).toContainText(requestUrl);
    });

    await test.step('Send request and validate response', async () => {
      await getRequestPane(page).getByRole('button', { name: 'Send' }).click();

      const statusTag = page.locator('[data-testid="response-status-tag"]:visible');
      await expect(statusTag).toContainText('200 OK');

      const responsePane = getResponsePane(page);
      await expect(responsePane).toContainText('"method": "POST"');
      await expect(responsePane).toContainText('x-request-id');
      await expect(responsePane).toContainText(REQUEST_CONFIG.headers.requestId);
      await expect(responsePane).toContainText(REQUEST_CONFIG.body.userId);
      await expect(responsePane).toContainText(REQUEST_CONFIG.body.token);
      await expect(responsePane).toContainText(REQUEST_CONFIG.body.note);
    });
  });
});
