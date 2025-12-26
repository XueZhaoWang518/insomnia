import type { Page } from '@playwright/test';

export const REQUEST_CONFIG = {
  query: { key: 'source', value: 'wxz-main' },
  headers: {
    contentType: 'application/json',
    requestId: 'req-456',
  },
  env: {
    baseUrlKey: 'base_url',
    authUserKey: 'auth_user',
    authPassKey: 'auth_pass',
  },
  body: {
    userId: 'user-123',
    token: 'wxz-token',
    note: 'smoke-main-flow',
  },
};

export function getRequestPane(page: Page) {
  return page.getByTestId('request-pane');
}

export function getResponsePane(page: Page) {
  return page.getByTestId('response-pane');
}

export function getUrlEditor(page: Page) {
  return getRequestPane(page).locator('header').locator('[data-testid="OneLineEditor"]').first();
}

export function getUrlEditorTextbox(page: Page) {
  return getUrlEditor(page).getByRole('textbox').first();
}

export function getVisibleCodeEditorTextbox(page: Page) {
  return getRequestPane(page).locator('[data-testid="CodeEditor"]:visible').getByRole('textbox');
}

export function getVisibleCodeEditorContainer(page: Page) {
  return getRequestPane(page).locator('[data-testid="CodeEditor"]:visible');
}
