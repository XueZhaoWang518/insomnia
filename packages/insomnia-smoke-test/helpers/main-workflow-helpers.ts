import { expect, type Page } from '@playwright/test';
import { getFixturePath } from '../playwright/paths';
import { getRequestPane, getUrlEditor, getVisibleCodeEditorTextbox, REQUEST_CONFIG } from './request-helpers';

export function slowOnDarwinAndWindows(test: { slow: (condition: boolean, description?: string) => void }) {
  test.slow(process.platform === 'darwin' || process.platform === 'win32', 'Slow app start on these platforms');
}

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
  const tabsGrid = page.getByRole('grid', { name: 'Insomnia Tabs' });
  if (await tabsGrid.count()) {
    const newRequestTab = tabsGrid.getByRole('row', { name: /tab-new request/i }).first();
    if (await newRequestTab.count()) {
      await newRequestTab.click();
      await expect(newRequestTab).toHaveAttribute('aria-selected', 'true');
      return;
    }
  }

  const requestGrid = page.getByRole('grid', { name: 'Request Collection' });
  await requestGrid.waitFor({ state: 'visible', timeout: 10_000 });

  const newRequestRow = requestGrid.getByRole('row', { name: /new request/i }).first();
  if (await newRequestRow.count()) {
    await newRequestRow.click();
    return;
  }

  const fallbackRequest = requestGrid.getByRole('row').last();
  await fallbackRequest.click();
}

export async function setRequestUrl(page: Page, url: string) {
  const urlEditor = getUrlEditor(page);
  await urlEditor.waitFor({ state: 'visible', timeout: 10_000 });
  const urlTextbox = urlEditor.getByRole('textbox').first();
  await urlTextbox.click({ force: true });
  await urlTextbox.fill(url);
  await page.keyboard.press('Enter');
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
  await page.getByRole('button', { name: /change body type/i }).click();
  await page.getByRole('option', { name: 'JSON' }).click();
  const bodyEditor = getVisibleCodeEditorTextbox(page);
  await bodyEditor.press('ControlOrMeta+A');
  await bodyEditor.press('Backspace');
  await bodyEditor.fill(body);
}

export async function sendRequest(page: Page) {
  const sendButton = getRequestPane(page).getByRole('button', { name: 'Send' });
  await expect(sendButton).toBeVisible;
  await expect(sendButton).toBeEnabled;
  await sendButton.click();
}

export async function setEnvironmentVariables(page: Page, entries: Array<{ key: string; value: string }>) {
  await page.getByRole('button', { name: 'Manage Environments' }).click();
  const manageCollectionButton = page.getByRole('button', { name: 'Manage collection environments' });
  if (await manageCollectionButton.count()) {
    await manageCollectionButton.click();
  }

  const dialog = page
    .getByRole('dialog', { name: 'Manage Environments' })
    .filter({ has: page.getByRole('button', { name: 'Add Row' }) })
    .first();
  await dialog.waitFor({ state: 'visible', timeout: 10_000 });

  const baseEnvRow = dialog.getByRole('row', { name: /base environment/i });
  if (await baseEnvRow.count()) {
    await baseEnvRow.click();
  }

  const dialogTable = dialog.getByRole('listbox', { name: 'Environment Key Value Pair' });
  if (!(await dialogTable.count())) {
    const tableViewToggle = dialog.getByRole('button', { name: /table view/i });
    if (await tableViewToggle.count()) {
      await tableViewToggle.click();
    }
  }

  const kvTable = dialog.getByRole('listbox', { name: 'Environment Key Value Pair' });
  await kvTable.waitFor({ state: 'visible', timeout: 10_000 });

  const addRowButton = dialog.getByRole('button', { name: 'Add Row' });
  let existingRows = await kvTable.getByRole('option').count();
  while (existingRows < entries.length && (await addRowButton.count())) {
    await addRowButton.click({ delay: 200 });
    existingRows = await kvTable.getByRole('option').count();
  }
  await expect
    .poll(async () => kvTable.getByRole('option').count(), { timeout: 10_000 })
    .toBeGreaterThanOrEqual(entries.length);

  for (let i = 0; i < entries.length; i += 1) {
    const row = kvTable.getByRole('option').nth(i);
    const keyEditor = row.getByTestId('OneLineEditor').first();
    const valueEditor = row.getByTestId('OneLineEditor').nth(1);
    await keyEditor.click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.type(entries[i].key);

    await valueEditor.click({ delay: 200 });
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.type(entries[i].value);
  }

  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
}

export async function importConfigurationFromFile(page: Page, fixtureName: string) {
  const fixturePath = getFixturePath(fixtureName);
  await page.getByTestId('workspace-context-dropdown').click();
  await page.getByText('From File').click();
  await page.locator('[data-test-id="import-from-file"]').click();
  await page.setInputFiles('[data-test-id="import-file-input"]', fixturePath);
  await page.getByRole('button', { name: 'Scan' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Import' }).click();
}

export async function importCollectionFromFile(page: Page, fixtureName: string) {
  const fixturePath = getFixturePath(fixtureName);
  const importButton = page.getByRole('button', { name: 'Import' });
  await importButton.click();
  await page.locator('[data-test-id="import-from-file"]').click();
  await page.setInputFiles('[data-test-id="import-file-input"]', fixturePath);
  await page.getByRole('button', { name: 'Scan' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Import' }).click();
}

export async function scanCollectionFromFile(page: Page, fixtureName: string) {
  const fixturePath = getFixturePath(fixtureName);
  await page.getByLabel('Import').click();
  await page.locator('[data-test-id="import-from-file"]').click();
  await page.setInputFiles('[data-test-id="import-file-input"]', fixturePath);
  await page.getByRole('button', { name: 'Scan' }).click();
}

export async function selectImportedRequest(page: Page, collectionName: string, requestName: string) {
  await page.getByLabel(collectionName).click();
  await page.getByLabel('Request Collection').getByTestId(requestName).press('Enter');
}

export async function sendRequestAndAssertSuccess(
  page: Page,
  assertResponse: (page: Page) => Promise<void>,
) {
  await sendRequest(page);
  await assertResponse(page);
}
