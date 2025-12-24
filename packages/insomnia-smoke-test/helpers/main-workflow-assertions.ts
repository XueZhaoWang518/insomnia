import { expect, type Page } from '@playwright/test';
import {
  getRequestPane,
  getResponsePane,
  getUrlEditor,
  getUrlEditorTextbox,
  getVisibleCodeEditorContainer,
  REQUEST_CONFIG,
} from './request-helpers';

export async function assertMainWorkflowParams(page: Page) {
  const paramsList = getRequestPane(page).getByRole('listbox', { name: 'Key-value pairs' });
  await expect(paramsList.getByRole('textbox').nth(0)).toHaveValue(REQUEST_CONFIG.query.key);
  await expect(paramsList.getByRole('textbox').nth(1)).toHaveValue(REQUEST_CONFIG.query.value);
}

export async function assertMainWorkflowHeaders(page: Page) {
  const headersEditor = getVisibleCodeEditorContainer(page);
  await expect(headersEditor).toContainText(`Content-Type: ${REQUEST_CONFIG.headers.contentType}`);
  await expect(headersEditor).toContainText(`X-Request-Id: ${REQUEST_CONFIG.headers.requestId}`);
}

export async function assertMainWorkflowBody(page: Page) {
  const bodyEditor = getVisibleCodeEditorContainer(page);
  await expect(bodyEditor).toContainText(`"userId": "${REQUEST_CONFIG.body.userId}"`);
  await expect(bodyEditor).toContainText(`"token": "${REQUEST_CONFIG.body.token}"`);
  await expect(bodyEditor).toContainText(`"note": "${REQUEST_CONFIG.body.note}"`);
}

export async function assertMainWorkflowMethod(page: Page) {
  await expect(page.getByLabel('Request Method')).toContainText('POST');
}

export async function assertMainWorkflowUrl(page: Page, requestUrl: string) {
  const urlContainer = getUrlEditor(page);
  const urlTextbox = getUrlEditorTextbox(page);
  await expect(urlContainer).toContainText(requestUrl);
}

export async function assertMainWorkflowResponse(page: Page) {
  const statusTag = page.locator('[data-testid="response-status-tag"]:visible');
  await expect(statusTag).toContainText('200 OK');

  const responsePane = getResponsePane(page);
  await expect(responsePane).toContainText('"method": "POST"');
  await expect(responsePane).toContainText('x-request-id');
  await expect(responsePane).toContainText(REQUEST_CONFIG.headers.requestId);
  await expect(responsePane).toContainText(REQUEST_CONFIG.body.userId);
  await expect(responsePane).toContainText(REQUEST_CONFIG.body.token);
  await expect(responsePane).toContainText(REQUEST_CONFIG.body.note);
}

export async function assertBadRequestError(page: Page, message: string) {
  const statusTag = page.locator('[data-testid="response-status-tag"]:visible');
  await expect(statusTag).toContainText('400');

  const responsePane = getResponsePane(page);
  await expect(responsePane).toContainText(message);
}

export async function assertServerUnavailableError(page: Page) {
  const responsePane = getResponsePane(page);
  await expect(responsePane).toContainText('URL using bad/illegal format or missing URL');
}
