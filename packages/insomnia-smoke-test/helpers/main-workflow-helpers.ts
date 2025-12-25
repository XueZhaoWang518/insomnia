import type { Page } from '@playwright/test';
import { getRequestPane, getUrlEditor, getVisibleCodeEditorTextbox, REQUEST_CONFIG } from './request-helpers';

export async function createRequestCollection(page: Page) {
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

export async function createHttpRequest(page: Page) {
  await page.getByLabel('Create in collection').click();
  await page.getByRole('menuitemradio', { name: /http request/i }).click();
}

export async function selectActiveRequest(page: Page) {
  const newRequest = page.getByTestId('New Request');
  if (await newRequest.count()) {
    await newRequest.click();
    return;
  }

  const fallbackRequest = page.getByRole('grid', { name: 'Request Collection' }).getByRole('row').first();
  await fallbackRequest.click();
}

export async function setRequestUrl(page: Page, url: string) {
  const urlEditor = getUrlEditor(page);
  await urlEditor.waitFor({ state: 'visible', timeout: 10_000 });
  await urlEditor.click({ force: true });
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type(url, { delay: 10 });
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
}

export async function setPostMethod(page: Page) {
  await page.getByLabel('Request Method').click();
  const postMenuItem = page.getByRole('menuitem', { name: 'POST' });
  if (await postMenuItem.count()) {
    await postMenuItem.click();
    return;
  }

  await page.getByRole('button', { name: 'POST' }).click();
}

export async function setQueryParams(page: Page) {
  await page.getByRole('tab', { name: 'Params' }).click();
  const paramsList = getRequestPane(page).getByRole('listbox', { name: 'Key-value pairs' });
  const nameBox = paramsList.getByRole('textbox').nth(0);
  const valueBox = paramsList.getByRole('textbox').nth(1);
  await nameBox.fill(REQUEST_CONFIG.query.key);
  await valueBox.fill(REQUEST_CONFIG.query.value);
}

export async function setRequestHeaders(page: Page) {
  await page.getByRole('tab', { name: 'Headers' }).click();
  const bulkEditButton = page.getByRole('button', { name: 'Bulk Edit' });
  if (await bulkEditButton.count()) {
    await bulkEditButton.click();
  }
  const headersEditor = getVisibleCodeEditorTextbox(page);
  await headersEditor.fill(`Content-Type: ${REQUEST_CONFIG.headers.contentType}
X-Request-Id: ${REQUEST_CONFIG.headers.requestId}`);
}

export async function setRequestBody(page: Page) {
  await setJsonBody(page, `{
  "userId": "${REQUEST_CONFIG.body.userId}",
  "token": "${REQUEST_CONFIG.body.token}",
  "note": "${REQUEST_CONFIG.body.note}"
}`);
}

export async function setJsonBody(page: Page, body: string) {
  await page.getByRole('tab', { name: 'Body' }).click();
  await page.getByRole('button', { name: 'Body' }).click();
  await page.getByRole('option', { name: 'JSON' }).click();
  const bodyEditor = getVisibleCodeEditorTextbox(page);
  await bodyEditor.fill(body);
}

export async function sendRequest(page: Page) {
  await getRequestPane(page).getByRole('button', { name: 'Send' }).click();
}
