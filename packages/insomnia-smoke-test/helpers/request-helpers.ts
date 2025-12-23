import type { Page } from '@playwright/test';

export const REQUEST_CONFIG = {
  query: { key: 'source', value: 'wxz-main' },
  headers: {
    contentType: 'application/json',
    requestId: 'req-456',
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
  return getRequestPane(page).getByTestId('OneLineEditor').getByRole('textbox');
}

export function getVisibleCodeEditorTextbox(page: Page) {
  return getRequestPane(page).locator('[data-testid="CodeEditor"]:visible').getByRole('textbox');
}
